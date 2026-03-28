import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Input, Chip, Divider, Spinner, Avatar,
} from "@heroui/react";
import { addToast, ToastProvider } from "@heroui/react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from "react-router-dom";
import { useState, ChangeEvent, useEffect } from "react";
import { useAuth } from '../../../../context/AuthContext';
import {
  User, Mail, Phone, CreditCard, CheckCircle, AlertCircle,
  Minus, Plus, ShieldCheck,
} from 'lucide-react';
import { openLiqPayWidget } from '../../../../hooks/useLiqPay';
import "./Form.scss";

interface TourSeatData {
  id: number;
  tour_date_id: number;
  available_seats: number;
  price: number;
}

const API = process.env.REACT_APP_API_URL!;

const formatPrice = (p: number) =>
  new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(p);

interface FormProps { tourTitle?: string; }

export const Form = ({ tourTitle = "Тур" }: FormProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+380');
  const [seats, setSeats] = useState(1);
  const [errors, setErrors] = useState({ name: '', email: '', phone: '' });

  // Step: 'form' | 'submitting' | 'paying' | 'paid'
  const [step, setStep] = useState<'form' | 'submitting' | 'paying' | 'paid'>('form');

  const { isPending, data: tourSeats } = useQuery({
    queryKey: ['tourSeats', id],
    queryFn: async (): Promise<TourSeatData[]> => {
      const r = await fetch(`${API}/tour-seats/${id}`);
      if (!r.ok) throw new Error('Tour not found');
      return r.json();
    },
    enabled: !!id,
    staleTime: 0,
  });

  const seatData = tourSeats?.[0];
  const available = seatData?.available_seats ?? 0;
  const price = seatData?.price ?? 0;
  const tourDateId = seatData?.tour_date_id ?? 0;
  const total = price * seats;

  useEffect(() => {
    if (isAuthenticated && user && isOpen) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '+380');
    }
  }, [isAuthenticated, user, isOpen]);

  const validateName = (v: string) => {
    if (!v.trim()) return "Ім'я обов'язкове";
    if (v.trim().length < 2) return 'Мінімум 2 символи';
    return '';
  };
  const validateEmail = (v: string) => {
    if (!v.trim()) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Некоректний email';
  };
  const validatePhone = (v: string) => {
    if (!v.trim()) return 'Телефон обов\'язковий';
    if (!v.startsWith('+380')) return 'Починається з +380';
    if (v.replace(/\D/g, '').slice(3).length !== 9) return '9 цифр після +380';
    return '';
  };

  const handlePhone = (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (!v.startsWith('+380')) v = '+380';
    const digits = v.replace(/\D/g, '').slice(3);
    const formatted = '+380' + digits.slice(0, 9);
    setPhone(formatted);
    setErrors(p => ({ ...p, phone: validatePhone(formatted) }));
  };

  const isFormValid = () =>
    name.trim().length >= 2 &&
    validatePhone(phone) === '' &&
    !errors.name && !errors.email && !errors.phone &&
    seats >= 1 && seats <= available;

  const resetForm = () => {
    setName(isAuthenticated ? user?.name || '' : '');
    setEmail(isAuthenticated ? user?.email || '' : '');
    setPhone(isAuthenticated ? user?.phone || '+380' : '+380');
    setSeats(1);
    setErrors({ name: '', email: '', phone: '' });
    setStep('form');
  };

  const handleBookAndPay = async (onClose: () => void) => {
    // Validate
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    setErrors({ name: nameErr, email: emailErr, phone: phoneErr });
    if (nameErr || phoneErr) return;
    if (!tourDateId) { addToast({ title: 'Помилка', description: 'Не вдалося визначити дату туру', color: 'danger' }); return; }

    setStep('submitting');

    try {
      // Step 1: create booking
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('tour_auth_token');
      if (token && isAuthenticated) headers.Authorization = `Bearer ${token}`;

      const bookingRes = await fetch(`${API}/tour/bookings`, {
        method: 'POST', headers,
        body: JSON.stringify({
          tour_date_id: tourDateId,
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.trim(),
          seats,
          total_price: Number(total.toFixed(2)),
        }),
      });

      if (!bookingRes.ok) {
        const e = await bookingRes.json();
        throw new Error(e.error || 'Booking failed');
      }

      const { booking_id } = await bookingRes.json();

      // Step 2: get LiqPay payment data
      const payRes = await fetch(`${API}/liqpay/create-payment`, {
        method: 'POST', headers,
        body: JSON.stringify({ booking_id }),
      });

      if (!payRes.ok) {
        const e = await payRes.json();
        throw new Error(e.error || 'Payment init failed');
      }

      const { data, signature } = await payRes.json();

      setStep('paying');
      onClose(); // close our modal — LiqPay widget will open

      // Step 3: open LiqPay widget
      await openLiqPayWidget({
        data,
        signature,
        amount: total,
        tourTitle,
        seats,
        onSuccess: async () => {
          setStep('paid');
          await queryClient.invalidateQueries({ queryKey: ['tourSeats', id] });
          await queryClient.invalidateQueries({ queryKey: ['tourData', id] });
          addToast({
            title: '🎉 Оплата успішна!',
            description: 'Бронювання підтверджено. Дякуємо!',
            color: 'success',
          });
          resetForm();
        },
        onClose: () => {
          // Widget closed without payment — booking stays pending
          addToast({
            title: 'Оплату скасовано',
            description: 'Бронювання збережено. Ви можете оплатити пізніше в особистому кабінеті.',
            color: 'warning',
          });
          setStep('form');
        },
      });

    } catch (err) {
      setStep('form');
      addToast({
        title: 'Помилка',
        description: err instanceof Error ? err.message : 'Спробуйте ще раз',
        color: 'danger',
      });
    }
  };

  const getAvatarUrl = (u: any) =>
    u?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || '')}&background=6366f1&color=fff&size=128`;

  if (isPending) return <div className="bf__loading"><Spinner size="sm" /><span>Завантаження...</span></div>;
  if (!tourSeats?.length) return null;

  return (
    <div className="bf">
      <ToastProvider placement="top-center" />

      {/* ── Seat counter + live price ── */}
      <div className="bf__preview">
        <div className="bf__counter">
          <button className="bf__counter-btn" onClick={() => setSeats(s => Math.max(1, s - 1))} disabled={seats <= 1}>
            <Minus size={14} />
          </button>
          <div className="bf__counter-val">
            <span className="bf__counter-num">{seats}</span>
            <span className="bf__counter-lbl">{seats === 1 ? 'особа' : seats <= 4 ? 'особи' : 'осіб'}</span>
          </div>
          <button className="bf__counter-btn" onClick={() => setSeats(s => Math.min(available, s + 1))} disabled={seats >= available}>
            <Plus size={14} />
          </button>
        </div>
        <div className="bf__preview-price">
          <span className="bf__preview-total">{formatPrice(total)}</span>
          {seats > 1 && <span className="bf__preview-per">{formatPrice(price)} × {seats}</span>}
        </div>
      </div>

      {/* ── Book button ── */}
      <button className="bf__book-btn" onClick={onOpen} disabled={available === 0}>
        {available === 0
          ? 'Місць немає'
          : <><CreditCard size={16} /> {isAuthenticated ? 'Забронювати та оплатити' : 'Забронювати'}</>}
      </button>

      {/* ── Modal ── */}
      <Modal
        isOpen={isOpen}
        placement="center"
        size="lg"
        scrollBehavior="inside"
        classNames={{ base: 'bf__modal', backdrop: 'bf__backdrop' }}
        onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(); }}
      >
        <ModalContent>
          {(onClose: () => void) => (
            <>
              <ModalHeader className="bf__modal-hd">
                <div className="bf__modal-hd-inner">
                  <div className="bf__modal-title-row">
                    <h2 className="bf__modal-title">Бронювання туру</h2>
                    <Chip size="sm" variant="flat" color={isAuthenticated ? 'success' : 'warning'}
                      startContent={isAuthenticated ? <CheckCircle size={12} /> : <AlertCircle size={12} />}>
                      {isAuthenticated ? 'Авторизований' : 'Гість'}
                    </Chip>
                  </div>

                  {isAuthenticated && user && (
                    <div className="bf__user">
                      <Avatar src={getAvatarUrl(user)} name={user.name} size="sm" />
                      <div>
                        <p className="bf__user-name">{user.name}</p>
                        <p className="bf__user-email">{user.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </ModalHeader>

              <Divider />

              <ModalBody className="bf__modal-body">

                {/* ── Seats + price ── */}
                <div className="bf__summary">
                  <div className="bf__summary-left">
                    <span className="bf__summary-label">Кількість осіб</span>
                    <div className="bf__counter">
                      <button className="bf__counter-btn" onClick={() => setSeats(s => Math.max(1, s - 1))} disabled={seats <= 1 || step === 'submitting'}>
                        <Minus size={14} />
                      </button>
                      <div className="bf__counter-val">
                        <span className="bf__counter-num">{seats}</span>
                      </div>
                      <button className="bf__counter-btn" onClick={() => setSeats(s => Math.min(available, s + 1))} disabled={seats >= available || step === 'submitting'}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="bf__summary-avail">{available} вільних місць</span>
                  </div>
                  <div className="bf__summary-right">
                    <div className="bf__summary-breakdown">
                      <div className="bf__summary-row">
                        <span>{formatPrice(price)}</span>
                        <span>× {seats}</span>
                      </div>
                      <div className="bf__summary-total">
                        <span>Разом</span>
                        <span className="bf__summary-total-val">{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* ── Contact ── */}
                <div className="bf__fields">
                  <p className="bf__fields-title"><User size={15} /> Контактна інформація</p>

                  <Input isRequired label="Повне ім'я" placeholder="Введіть ім'я"
                    value={name}
                    onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: validateName(e.target.value) })); }}
                    isInvalid={!!errors.name} errorMessage={errors.name}
                    isDisabled={step === 'submitting'}
                    variant="bordered" startContent={<User size={16} className="text-default-400" />} />

                  <Input isRequired label="Номер телефону" placeholder="+380XXXXXXXXX"
                    value={phone} onChange={handlePhone}
                    isInvalid={!!errors.phone} errorMessage={errors.phone}
                    isDisabled={step === 'submitting'}
                    variant="bordered" startContent={<Phone size={16} className="text-default-400" />} />

                  <Input label="Email (необов'язково)" placeholder="example@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: validateEmail(e.target.value) })); }}
                    isInvalid={!!errors.email} errorMessage={errors.email}
                    isDisabled={step === 'submitting'}
                    variant="bordered" startContent={<Mail size={16} className="text-default-400" />} />
                </div>

                {/* ── LiqPay badge ── */}
                <div className="bf__liqpay-note">
                  <ShieldCheck size={14} />
                  <span>Оплата через LiqPay — захищено SSL</span>
                  <img src="https://static.liqpay.ua/buttons/logo-small.png" alt="LiqPay" className="bf__liqpay-logo" />
                </div>
              </ModalBody>

              <Divider />

              <ModalFooter className="bf__modal-footer">
                <button className="bf__cancel" onClick={onClose} disabled={step === 'submitting'}>
                  Скасувати
                </button>
                <button className="bf__confirm" onClick={() => handleBookAndPay(onClose)}
                  disabled={!isFormValid() || step === 'submitting'}>
                  {step === 'submitting'
                    ? <><Spinner size="sm" color="white" /> Обробка...</>
                    : <><CreditCard size={15} /> Оплатити {formatPrice(total)}</>}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};
