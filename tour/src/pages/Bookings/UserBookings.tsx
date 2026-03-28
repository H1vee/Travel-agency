import React, { useState, useEffect } from 'react';
import './UserBookings.scss';
import {
  Card, CardBody, CardHeader, Button, Chip, Divider, Spinner, Avatar,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
} from "@heroui/react";
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../Main/components/Footer/Footer';
import {
  CalendarDays, MapPin, Users, CreditCard, Clock, Phone, Mail,
  Eye, AlertCircle, CheckCircle, XCircle, User, Star,
} from 'lucide-react';

const API = process.env.REACT_APP_API_URL!;

interface Booking {
  id: number;
  tour_id: number;
  tour_title: string;
  from_location?: string;
  to_location?: string;
  date_from: string;
  date_to: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  seats: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  booked_at: string;
}

// ── Star picker ────────────────────────────────────────────────────────────────
const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <Star
            size={32}
            fill={(hover || value) >= n ? '#f59e0b' : 'none'}
            color={(hover || value) >= n ? '#f59e0b' : '#d1d5db'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
export const UserBookings: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Rating modal state
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const { isOpen: isRatingOpen, onOpen: onRatingOpen, onClose: onRatingClose } = useDisclosure();

  useEffect(() => { if (isAuthenticated) fetchBookings(); }, [isAuthenticated]);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('tour_auth_token')}`,
    'Content-Type': 'application/json',
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/user-bookings`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      const data = await res.json();
      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження бронювань');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    setIsCancelling(true);
    setCancelError('');
    try {
      const res = await fetch(`${API}/bookings/${bookingId}/cancel`, { method: 'PUT', headers: authHeaders() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Не вдалося скасувати'); }
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
      if (selectedBooking?.id === bookingId) setSelectedBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Помилка скасування');
    } finally {
      setIsCancelling(false);
    }
  };

  const openRatingModal = async (booking: Booking) => {
    setRatingBooking(booking);
    setRatingValue(0);
    setRatingSuccess(false);
    setExistingRating(null);
    onRatingOpen();
    // Fetch existing rating
    try {
      const res = await fetch(`${API}/tour-ratings/${booking.tour_id}/my`, { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        if (d.rating) { setExistingRating(d.rating); setRatingValue(d.rating); }
      }
    } catch {}
  };

  const submitRating = async () => {
    if (!ratingBooking || ratingValue === 0) return;
    setRatingLoading(true);
    try {
      const res = await fetch(`${API}/tour-ratings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ tour_id: ratingBooking.tour_id, rating: ratingValue }),
      });
      if (!res.ok) throw new Error('Помилка збереження');
      setRatingSuccess(true);
      setExistingRating(ratingValue);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setRatingLoading(false);
    }
  };

  if (!isAuthenticated) return (
    <>
      <Navbar />
      <div className="user-bookings">
        <div className="user-bookings__access-denied">
          <Card className="access-card">
            <CardBody>
              <h2>Доступ заборонено</h2>
              <p>Увійдіть у свій акаунт для перегляду бронювань</p>
              <Button color="primary" onClick={() => window.location.href = '/'}>На головну</Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed': return { color: 'success' as const, icon: <CheckCircle size={16} />, text: 'Підтверджено' };
      case 'pending':   return { color: 'warning' as const, icon: <Clock size={16} />, text: 'Очікує підтвердження' };
      case 'cancelled': return { color: 'danger' as const, icon: <XCircle size={16} />, text: 'Скасовано' };
      default:          return { color: 'default' as const, icon: <AlertCircle size={16} />, text: status };
    }
  };

  const formatDate     = (s: string) => new Date(s).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
  const formatDateTime = (s: string) => new Date(s).toLocaleString('uk-UA');
  const formatPrice    = (p: number) => new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(p);
  const calcDuration   = (a: string, b: string) => Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

  const stats = {
    confirmed:  bookings.filter(b => b.status === 'confirmed').length,
    pending:    bookings.filter(b => b.status === 'pending').length,
    cancelled:  bookings.filter(b => b.status === 'cancelled').length,
    totalSpent: bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.total_price, 0),
  };

  return (
    <>
      <Navbar />
      <div className="user-bookings">
        <div className="user-bookings__container">
          <div className="user-bookings__header">
            <div className="user-bookings__header-content">
              <h1>Мої бронювання</h1>
              <p>Переглядайте та керуйте своїми бронюваннями турів</p>
            </div>
            <div className="user-bookings__header-avatar">
              <Avatar src={user?.avatar_url} name={user?.name} size="lg" />
            </div>
          </div>

          <div className="user-bookings__stats">
            <Card className="stats-card">
              <CardBody>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-icon confirmed"><CheckCircle size={24} /></div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.confirmed}</span>
                      <span className="stat-label">Підтверджено</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon pending"><Clock size={24} /></div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.pending}</span>
                      <span className="stat-label">Очікують</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon cancelled"><XCircle size={24} /></div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.cancelled}</span>
                      <span className="stat-label">Скасовано</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-icon total"><CreditCard size={24} /></div>
                    <div className="stat-content">
                      <span className="stat-number">{formatPrice(stats.totalSpent)}</span>
                      <span className="stat-label">Витрачено</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="user-bookings__content">
            {loading ? (
              <div className="user-bookings__loading"><Spinner size="lg" /><p>Завантаження бронювань...</p></div>
            ) : error ? (
              <div className="user-bookings__error">
                <Card className="error-card"><CardBody>
                  <AlertCircle size={48} /><h3>Помилка завантаження</h3><p>{error}</p>
                  <Button color="primary" onClick={fetchBookings}>Спробувати знову</Button>
                </CardBody></Card>
              </div>
            ) : bookings.length === 0 ? (
              <div className="user-bookings__empty">
                <Card className="empty-card"><CardBody>
                  <CalendarDays size={64} /><h3>Немає бронювань</h3>
                  <p>Ви ще не здійснили жодного бронювання.</p>
                  <Button color="primary" onClick={() => window.location.href = '/Tours'}>Переглянути тури</Button>
                </CardBody></Card>
              </div>
            ) : (
              <div className="user-bookings__list">
                {bookings.map(booking => {
                  const si = getStatusInfo(booking.status);
                  return (
                    <Card key={booking.id} className="booking-card">
                      <CardHeader className="booking-header">
                        <div className="booking-title">
                          <h3>{booking.tour_title}</h3>
                          <Chip color={si.color} variant="flat" startContent={si.icon} className="status-chip">
                            {si.text}
                          </Chip>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm" variant="flat" color="warning"
                              startContent={<Star size={14} />}
                              onClick={() => openRatingModal(booking)}
                            >
                              Оцінити
                            </Button>
                          )}
                          <Button isIconOnly variant="light" onClick={() => { setSelectedBooking(booking); setCancelError(''); onOpen(); }}>
                            <Eye size={18} />
                          </Button>
                        </div>
                      </CardHeader>
                      <Divider />
                      <CardBody className="booking-body">
                        <div className="booking-info">
                          <div className="info-row"><CalendarDays className="info-icon" size={18} /><span>{formatDate(booking.date_from)} – {formatDate(booking.date_to)}</span></div>
                          {booking.from_location && booking.to_location && (
                            <div className="info-row"><MapPin className="info-icon" size={18} /><span>{booking.from_location} → {booking.to_location}</span></div>
                          )}
                          <div className="info-row"><Users className="info-icon" size={18} /><span>{booking.seats} {booking.seats === 1 ? 'місце' : 'місць'}</span></div>
                          <div className="info-row"><CreditCard className="info-icon" size={18} /><span className="price">{formatPrice(booking.total_price)}</span></div>
                        </div>
                        <div className="booking-meta">
                          <span className="booked-date">Заброньовано: {formatDateTime(booking.booked_at)}</span>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Details modal ── */}
      {selectedBooking && (
        <Modal isOpen={isOpen} onClose={() => { onClose(); setCancelError(''); }} size="3xl" className="booking-modal" scrollBehavior="inside">
          <ModalContent>
            <ModalHeader className="booking-modal__header">
              <div className="booking-modal__header-content">
                <div className="booking-modal__header-main">
                  <div className="booking-modal__title-section">
                    <h2 className="booking-modal__title">{selectedBooking.tour_title}</h2>
                  </div>
                  <Chip color={getStatusInfo(selectedBooking.status).color} variant="solid" size="lg"
                    startContent={getStatusInfo(selectedBooking.status).icon} className="booking-modal__status-chip">
                    {getStatusInfo(selectedBooking.status).text}
                  </Chip>
                </div>
                <div className="booking-modal__quick-info">
                  <div className="booking-modal__quick-item"><CalendarDays size={18} /><span>{formatDate(selectedBooking.date_from)} – {formatDate(selectedBooking.date_to)}</span></div>
                  <div className="booking-modal__quick-item"><Users size={18} /><span>{selectedBooking.seats} {selectedBooking.seats === 1 ? 'місце' : 'місць'}</span></div>
                  <div className="booking-modal__quick-item booking-modal__price-highlight"><CreditCard size={18} /><span>{formatPrice(selectedBooking.total_price)}</span></div>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="booking-modal__body">
              <div className="booking-modal__content">
                <Card className="booking-modal__info-card">
                  <CardHeader className="booking-modal__card-header"><div className="booking-modal__card-icon"><MapPin size={20} /></div><h3>Інформація про тур</h3></CardHeader>
                  <CardBody className="booking-modal__card-body">
                    <div className="booking-modal__grid">
                      <div className="booking-modal__field"><span className="booking-modal__label">Назва туру</span><span className="booking-modal__value">{selectedBooking.tour_title}</span></div>
                      <div className="booking-modal__field"><span className="booking-modal__label">Дата початку</span><span className="booking-modal__value">{formatDate(selectedBooking.date_from)}</span></div>
                      <div className="booking-modal__field"><span className="booking-modal__label">Дата завершення</span><span className="booking-modal__value">{formatDate(selectedBooking.date_to)}</span></div>
                      <div className="booking-modal__field"><span className="booking-modal__label">Тривалість</span><span className="booking-modal__value">{calcDuration(selectedBooking.date_from, selectedBooking.date_to)} днів</span></div>
                      {selectedBooking.from_location && <div className="booking-modal__field"><span className="booking-modal__label">Місце відправлення</span><span className="booking-modal__value">{selectedBooking.from_location}</span></div>}
                      {selectedBooking.to_location && <div className="booking-modal__field"><span className="booking-modal__label">Пункт призначення</span><span className="booking-modal__value">{selectedBooking.to_location}</span></div>}
                    </div>
                  </CardBody>
                </Card>

                <Card className="booking-modal__info-card">
                  <CardHeader className="booking-modal__card-header"><div className="booking-modal__card-icon"><User size={20} /></div><h3>Контактна інформація</h3></CardHeader>
                  <CardBody className="booking-modal__card-body">
                    <div className="booking-modal__grid">
                      <div className="booking-modal__field"><span className="booking-modal__label">Повне ім'я</span><span className="booking-modal__value">{selectedBooking.customer_name}</span></div>
                      <div className="booking-modal__field"><span className="booking-modal__label">Телефон</span><span className="booking-modal__value booking-modal__contact"><Phone size={16} /><a href={`tel:${selectedBooking.customer_phone}`}>{selectedBooking.customer_phone}</a></span></div>
                      {selectedBooking.customer_email && <div className="booking-modal__field"><span className="booking-modal__label">Email</span><span className="booking-modal__value booking-modal__contact"><Mail size={16} /><a href={`mailto:${selectedBooking.customer_email}`}>{selectedBooking.customer_email}</a></span></div>}
                    </div>
                  </CardBody>
                </Card>

                <Card className="booking-modal__summary-card">
                  <CardHeader className="booking-modal__card-header"><div className="booking-modal__card-icon"><CreditCard size={20} /></div><h3>Підсумок бронювання</h3></CardHeader>
                  <CardBody className="booking-modal__card-body">
                    <div className="booking-modal__summary">
                      <div className="booking-modal__summary-row"><span className="booking-modal__summary-label">Кількість місць</span><span className="booking-modal__summary-value">{selectedBooking.seats}</span></div>
                      <div className="booking-modal__summary-row"><span className="booking-modal__summary-label">Ціна за місце</span><span className="booking-modal__summary-value">{formatPrice(selectedBooking.total_price / selectedBooking.seats)}</span></div>
                      <Divider className="booking-modal__divider" />
                      <div className="booking-modal__summary-row booking-modal__summary-total"><span className="booking-modal__summary-label">Загальна сума</span><span className="booking-modal__summary-value booking-modal__total-price">{formatPrice(selectedBooking.total_price)}</span></div>
                      <div className="booking-modal__meta-info"><div className="booking-modal__meta-item"><Clock size={16} /><span>Заброньовано: {formatDateTime(selectedBooking.booked_at)}</span></div></div>
                    </div>
                  </CardBody>
                </Card>

                {selectedBooking.status === 'pending' && (
                  <Card className="booking-modal__actions-card">
                    <CardBody className="booking-modal__actions-body">
                      <div className="booking-modal__actions-content">
                        <div className="booking-modal__actions-info">
                          <AlertCircle size={20} className="booking-modal__actions-icon" />
                          <div>
                            <h4>Очікує підтвердження</h4>
                            <p>Ви можете скасувати бронювання до підтвердження.</p>
                            {cancelError && <p style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.875rem' }}>{cancelError}</p>}
                          </div>
                        </div>
                        <Button color="danger" variant="light" startContent={<XCircle size={16} />}
                          isLoading={isCancelling} isDisabled={isCancelling}
                          onClick={() => handleCancelBooking(selectedBooking.id)}>
                          Скасувати бронювання
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {selectedBooking.status === 'confirmed' && (
                  <Card className="booking-modal__success-card">
                    <CardBody className="booking-modal__success-body">
                      <div className="booking-modal__success-content">
                        <CheckCircle size={24} className="booking-modal__success-icon" />
                        <div>
                          <h4>Бронювання підтверджено</h4>
                          <p>Менеджер зв'яжеться з вами найближчим часом.</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}

                {selectedBooking.status === 'cancelled' && (
                  <Card style={{ border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px' }}>
                    <CardBody style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <XCircle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
                        <div>
                          <h4 style={{ color: '#991b1b', margin: '0 0 0.25rem' }}>Бронювання скасовано</h4>
                          <p style={{ color: '#b91c1c', margin: 0, fontSize: '0.9rem' }}>Місця повернено в доступні.</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </div>
            </ModalBody>
            <ModalFooter className="booking-modal__footer">
              <Button color="default" variant="light" onPress={() => { onClose(); setCancelError(''); }}>Закрити</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* ── Rating modal ── */}
      {ratingBooking && (
        <Modal isOpen={isRatingOpen} onClose={onRatingClose} size="sm">
          <ModalContent>
            <ModalHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Star size={20} color="#f59e0b" fill="#f59e0b" />
                <span>Оцінити тур</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <p style={{ color: '#64748b', marginBottom: 4 }}>{ratingBooking.tour_title}</p>
              {existingRating && !ratingSuccess && (
                <p style={{ fontSize: 13, color: '#6366f1' }}>Ваша поточна оцінка: {existingRating} ★</p>
              )}
              {ratingSuccess ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: 600, color: '#065f46' }}>Оцінку збережено!</p>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={24} fill={ratingValue >= n ? '#f59e0b' : 'none'} color={ratingValue >= n ? '#f59e0b' : '#d1d5db'} />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                  <StarPicker value={ratingValue} onChange={setRatingValue} />
                  <p style={{ fontSize: 13, color: '#94a3b8', minHeight: 20 }}>
                    {ratingValue === 1 ? 'Жахливо' : ratingValue === 2 ? 'Погано' : ratingValue === 3 ? 'Нормально' : ratingValue === 4 ? 'Добре' : ratingValue === 5 ? 'Відмінно!' : 'Оберіть оцінку'}
                  </p>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onRatingClose}>Закрити</Button>
              {!ratingSuccess && (
                <Button color="warning" isLoading={ratingLoading} isDisabled={ratingValue === 0}
                  onClick={submitRating}>
                  Зберегти оцінку
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      <Footer />
    </>
  );
};