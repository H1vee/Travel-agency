import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card, CardBody, CardHeader, Button, Chip, Divider, Spinner,
} from '@heroui/react';
import {
  CalendarDays, MapPin, Users, CreditCard, CheckCircle,
  XCircle, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../Main/components/Footer/Footer';
import { openLiqPayWidget } from '../../hooks/useLiqPay';

const API = process.env.REACT_APP_API_URL!;

interface BookingByToken {
  id: number;
  tour_title: string;
  customer_name: string;
  seats: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'reversed';
  date_from: string;
  date_to: string;
  from_location?: string;
  to_location?: string;
}

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
const formatPrice = (p: number) =>
  new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(p);

export const GuestPay: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const [booking, setBooking] = useState<BookingByToken | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API}/bookings/by-token/${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Не вдалося завантажити бронювання');
        if (!cancelled) setBooking(data);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Помилка завантаження');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token]);

  const handlePay = async () => {
    if (!booking) return;
    setPaying(true);
    setPayError('');
    try {
      const res = await fetch(`${API}/liqpay/create-payment-by-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не вдалося ініціювати оплату');

      await openLiqPayWidget({
        data: data.data,
        signature: data.signature,
        amount: booking.total_price,
        tourTitle: booking.tour_title,
        seats: booking.seats,
        onSuccess: () => {
          setPaid(true);
          setBooking(prev => prev ? { ...prev, payment_status: 'paid', status: 'confirmed' } : prev);
        },
      });
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Помилка оплати');
    } finally {
      setPaying(false);
    }
  };

  const renderBody = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 0' }}>
          <Spinner size="lg" />
          <p style={{ color: '#64748b' }}>Завантаження бронювання...</p>
        </div>
      );
    }

    if (loadError || !booking) {
      return (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '32px 24px' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Посилання недоступне</h3>
            <p style={{ color: '#64748b', marginBottom: 16 }}>{loadError || 'Бронювання не знайдено'}</p>
            <Button color="primary" onClick={() => window.location.href = '/'}>На головну</Button>
          </CardBody>
        </Card>
      );
    }

    const isPaid = paid || booking.payment_status === 'paid';
    const isCancelled = booking.status === 'cancelled';

    return (
      <Card>
        <CardHeader style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{booking.tour_title}</h2>
            <Chip
              color={isPaid ? 'success' : isCancelled ? 'danger' : 'warning'}
              variant="flat"
              startContent={isPaid ? <CheckCircle size={14} /> : isCancelled ? <XCircle size={14} /> : <AlertCircle size={14} />}
            >
              {isPaid ? 'Оплачено' : isCancelled ? 'Скасовано' : 'Очікує оплату'}
            </Chip>
          </div>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>Бронювання #{booking.id} — {booking.customer_name}</p>
        </CardHeader>
        <Divider />
        <CardBody style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#334155' }}>
            <CalendarDays size={18} style={{ color: '#6366f1' }} />
            <span>{formatDate(booking.date_from)} – {formatDate(booking.date_to)}</span>
          </div>
          {(booking.from_location || booking.to_location) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#334155' }}>
              <MapPin size={18} style={{ color: '#6366f1' }} />
              <span>{booking.from_location} → {booking.to_location}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#334155' }}>
            <Users size={18} style={{ color: '#6366f1' }} />
            <span>{booking.seats} {booking.seats === 1 ? 'місце' : booking.seats <= 4 ? 'місця' : 'місць'}</span>
          </div>
          <Divider />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontWeight: 600 }}>До оплати</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{formatPrice(booking.total_price)}</span>
          </div>

          {isPaid ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle size={24} style={{ color: '#10b981', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#065f46', margin: '0 0 2px' }}>Оплату отримано</p>
                <p style={{ color: '#047857', fontSize: 14, margin: 0 }}>Підтвердження надіслано на ваш email.</p>
              </div>
            </div>
          ) : isCancelled ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <XCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#991b1b', margin: '0 0 2px' }}>Бронювання скасовано</p>
                <p style={{ color: '#b91c1c', fontSize: 14, margin: 0 }}>Оплата більше неможлива.</p>
              </div>
            </div>
          ) : (
            <>
              {payError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 12, color: '#b91c1c', fontSize: 14 }}>
                  {payError}
                </div>
              )}
              <Button
                color="primary"
                size="lg"
                startContent={<CreditCard size={18} />}
                isLoading={paying}
                isDisabled={paying}
                onClick={handlePay}
              >
                Оплатити {formatPrice(booking.total_price)}
              </Button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12, justifyContent: 'center' }}>
                <ShieldCheck size={14} /> Оплата через LiqPay — захищено SSL
              </div>
            </>
          )}
        </CardBody>
      </Card>
    );
  };

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px 64px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: '#0f172a' }}>Оплата бронювання</h1>
        {renderBody()}
      </div>
      <Footer />
    </>
  );
};
