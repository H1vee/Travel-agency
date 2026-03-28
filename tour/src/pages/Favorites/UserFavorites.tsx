import React, { useState } from 'react';
import './UserFavorites.scss';
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Spinner,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Chip,
  Divider,
  useDisclosure,
} from "@heroui/react";
import { addToast, ToastProvider } from "@heroui/react";
import { useAuth } from '../../context/AuthContext';
import { useFavoritesWithDetails } from '../../hooks/useFavorites';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '../../components/Navbar/Navbar';
import { FavoriteButton } from '../../components/FavoriteButton/FavoriteButton';
import { Footer } from '../Main/components/Footer/Footer';
import {
  Heart,
  AlertCircle,
  ShoppingBag,
  Star,
  MapPin,
  Eye,
  CreditCard,
  Users,
  User,
  Phone,
  Mail,
  CheckCircle,
} from 'lucide-react';

// ─── Booking modal ────────────────────────────────────────────────────────────

interface BookingModalProps {
  tourId: number;
  tourTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

interface TourSeatData {
  id: number;
  tour_date_id: number;
  available_seats: number;
  price: number;
}

const BookingModal: React.FC<BookingModalProps> = ({ tourId, tourTitle, isOpen, onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+380',
    seats: '1',
  });
  const [errors, setErrors] = useState({ name: '', phone: '', seats: '' });

  const { data: tourSeats, isPending: seatsLoading } = useQuery({
    queryKey: ['tourSeats', tourId.toString()],
    queryFn: async (): Promise<TourSeatData[]> => {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/tour-seats/${tourId}`);
      if (!res.ok) throw new Error('Failed to fetch seats');
      return res.json();
    },
    enabled: isOpen && tourId > 0,
    staleTime: 0,
  });

  const seatData = tourSeats?.[0];
  const availableSeats = seatData?.available_seats ?? 0;
  const tourPrice = seatData?.price ?? 0;
  const tourDateId = seatData?.tour_date_id ?? 0;
  const totalPrice = tourPrice * parseInt(formData.seats || '1', 10);

  const handleClose = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '+380',
      seats: '1',
    });
    setErrors({ name: '', phone: '', seats: '' });
    onClose();
  };

  const validate = () => {
    const newErrors = { name: '', phone: '', seats: '' };
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Введіть ваше ім'я";
    }
    if (!formData.phone.startsWith('+380') || formData.phone.replace(/\D/g, '').slice(3).length !== 9) {
      newErrors.phone = 'Формат: +380XXXXXXXXX';
    }
    const seats = parseInt(formData.seats, 10);
    if (!seats || seats < 1) newErrors.seats = 'Мінімум 1 місце';
    if (seats > availableSeats) newErrors.seats = `Максимум ${availableSeats} місць`;
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!tourDateId) {
      addToast({ title: 'Помилка', description: 'Дату туру не знайдено', color: 'danger' });
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('tour_auth_token');
      if (token && isAuthenticated) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('${process.env.REACT_APP_API_URL}/tour/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tour_date_id: tourDateId,
          customer_name: formData.name.trim(),
          customer_email: formData.email.trim(),
          customer_phone: formData.phone.trim(),
          seats: parseInt(formData.seats, 10),
          total_price: Number(totalPrice.toFixed(2)),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Booking failed');
      }

      await queryClient.invalidateQueries({ queryKey: ['tourSeats', tourId.toString()] });

      addToast({
        title: '🎉 Бронювання підтверджено!',
        description: 'Ваше замовлення прийнято. Менеджер зв\'яжеться з вами найближчим часом.',
        color: 'success',
        variant: 'solid',
      });
      handleClose();
    } catch (err) {
      addToast({
        title: '❌ Помилка бронювання',
        description: err instanceof Error ? err.message : 'Спробуйте ще раз',
        color: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+380')) val = '+380';
    const digits = val.replace(/\D/g, '').slice(3);
    setFormData(prev => ({ ...prev, phone: '+380' + digits.slice(0, 9) }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" scrollBehavior="inside" placement="center">
      <ModalContent>
        <ModalHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Бронювання туру</span>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>{tourTitle}</span>
          </div>
        </ModalHeader>

        <ModalBody>
          {seatsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Spinner size="lg" />
            </div>
          ) : !seatData ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 1rem' }} />
              <p>Інформація про місця недоступна</p>
            </div>
          ) : availableSeats === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 1rem' }} />
              <p>На жаль, вільних місць немає</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Stats */}
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
                borderRadius: '12px',
                border: '1px solid rgba(99,102,241,0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Users size={16} color="#6366f1" />
                  {availableSeats} вільних місць
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>
                  <CreditCard size={16} color="#6366f1" />
                  {tourPrice.toFixed(2)} UAH/особа
                </div>
              </div>

              {/* Fields */}
              <Input
                isRequired
                label="Повне ім'я"
                placeholder="Введіть ваше ім'я"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
                variant="bordered"
                startContent={<User size={16} className="text-default-400" />}
              />
              <Input
                isRequired
                label="Телефон"
                placeholder="+380XXXXXXXXX"
                value={formData.phone}
                onChange={handlePhoneChange}
                isInvalid={!!errors.phone}
                errorMessage={errors.phone}
                variant="bordered"
                startContent={<Phone size={16} className="text-default-400" />}
              />
              <Input
                label="Email (необов'язково)"
                placeholder="example@email.com"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                variant="bordered"
                startContent={<Mail size={16} className="text-default-400" />}
              />
              <Input
                isRequired
                label="Кількість місць"
                placeholder="1"
                value={formData.seats}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, seats: val || '1' }));
                }}
                isInvalid={!!errors.seats}
                errorMessage={errors.seats}
                variant="bordered"
                description={`Доступно ${availableSeats} місць`}
                startContent={<Users size={16} className="text-default-400" />}
              />

              {/* Price summary */}
              <div style={{
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.03), rgba(5,150,105,0.03))',
                borderRadius: '12px',
                border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: '#374151', fontWeight: 600 }}>Загальна сума:</span>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {totalPrice.toFixed(2)} UAH
                </span>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={isSubmitting}>
            Скасувати
          </Button>
          {availableSeats > 0 && seatData && (
            <Button
              color="primary"
              variant="shadow"
              onPress={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || seatsLoading}
              startContent={!isSubmitting && <CheckCircle size={16} />}
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {isSubmitting ? 'Обробка...' : 'Підтвердити бронювання'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// ─── UserFavorites ─────────────────────────────────────────────────────────────

export const UserFavorites: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: favorites, isLoading, error, isEmpty } = useFavoritesWithDetails();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [bookingTour, setBookingTour] = useState<{ id: number; title: string } | null>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(price);

  const handleViewTour = (tourId: number) => {
    window.location.href = `/TourDetails/${tourId}`;
  };

  const handleBookTour = (tourId: number, tourTitle: string) => {
    setBookingTour({ id: tourId, title: tourTitle });
    onOpen();
  };

  const handleModalClose = () => {
    onClose();
    setBookingTour(null);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="user-favorites">
          <div className="user-favorites__access-denied">
            <Card className="access-card">
              <CardBody>
                <Heart size={64} className="access-icon" />
                <h2>Доступ заборонено</h2>
                <p>Увійдіть у свій акаунт для перегляду обраних турів</p>
                <Button color="primary" className="btn-home" onClick={() => window.location.href = '/'}>
                  На головну
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastProvider placement="top-center" />
      <Navbar />
      <div className="user-favorites">
        <div className="user-favorites__container">
          <div className="user-favorites__header">
            <div className="user-favorites__header-content">
              <h1>
                <Heart className="header-icon" size={32} />
                Обране
              </h1>
              <p>Ваші збережені тури для майбутніх подорожей</p>
            </div>
            <div className="user-favorites__header-avatar">
              <Avatar src={user?.avatar_url} name={user?.name} size="lg" />
            </div>
          </div>

          {!isLoading && !isEmpty && (
            <div className="user-favorites__stats">
              <Card className="stats-card">
                <CardBody>
                  <div className="stats-content">
                    <div className="stats-icon"><Heart size={24} /></div>
                    <div className="stats-info">
                      <span className="stats-number">{favorites.length}</span>
                      <span className="stats-label">
                        {favorites.length === 1 ? 'обраний тур' : 'обраних турів'}
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          <div className="user-favorites__content">
            {isLoading ? (
              <div className="user-favorites__loading">
                <Card className="loading-card">
                  <CardBody>
                    <Spinner size="lg" />
                    <h3>Завантаження обраного</h3>
                    <p>Отримуємо ваші улюблені тури...</p>
                  </CardBody>
                </Card>
              </div>
            ) : error ? (
              <div className="user-favorites__error">
                <Card className="error-card">
                  <CardBody>
                    <AlertCircle size={48} />
                    <h3>Помилка завантаження</h3>
                    <p>Не вдалося завантажити обране. Спробуйте пізніше.</p>
                    <Button color="primary" onClick={() => window.location.reload()}>
                      Спробувати знову
                    </Button>
                  </CardBody>
                </Card>
              </div>
            ) : isEmpty ? (
              <div className="user-favorites__empty">
                <Card className="empty-card">
                  <CardBody>
                    <Heart size={64} className="empty-icon" />
                    <h3>Немає обраних турів</h3>
                    <p>Ви ще не додали жодного туру до обраного. Знайдіть цікаві тури та збережіть їх тут!</p>
                    <Button
                      color="primary"
                      size="lg"
                      startContent={<MapPin size={20} />}
                      onClick={() => window.location.href = '/Tours'}
                    >
                      Переглянути тури
                    </Button>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <div className="user-favorites__grid">
                {favorites.map((favorite) => (
                  <Card key={favorite.tour_id} className="favorite-card">
                    {favorite.tour ? (
                      <>
                        <div className="favorite-card__image">
                          <img
                            src={favorite.tour.imageSrc || '/no-image.jpg'}
                            alt={favorite.tour.title}
                            loading="lazy"
                          />
                          <div className="favorite-card__overlay">
                            <FavoriteButton
                              tourId={favorite.tour_id}
                              size="md"
                              className="favorite-card__favorite-btn"
                            />
                          </div>
                        </div>

                        <CardBody className="favorite-card__body">
                          <div className="favorite-card__content">
                            <h3 className="favorite-card__title">{favorite.tour.title}</h3>
                            <div className="favorite-card__price">
                              <span className="price-label">Від</span>
                              <span className="price-value">{formatPrice(favorite.tour.price)}</span>
                            </div>
                            <div className="favorite-card__rating">
                              <Star size={16} className="rating-icon" />
                              <span className="rating-value">
                                {favorite.tour.rating > 0 ? favorite.tour.rating.toFixed(1) : 'Немає оцінок'}
                              </span>
                            </div>
                          </div>
                        </CardBody>

                        <CardFooter className="favorite-card__footer">
                          <div className="favorite-card__actions">
                            <Button
                              variant="bordered"
                              startContent={<Eye size={16} />}
                              onClick={() => handleViewTour(favorite.tour_id)}
                              className="action-btn view-btn"
                            >
                              Переглянути
                            </Button>
                            <Button
                              color="primary"
                              startContent={<ShoppingBag size={16} />}
                              onClick={() => handleBookTour(favorite.tour_id, favorite.tour!.title)}
                              className="action-btn book-btn"
                            >
                              Забронювати
                            </Button>
                          </div>
                        </CardFooter>
                      </>
                    ) : (
                      <CardBody className="favorite-card__body">
                        <div className="favorite-card__unavailable">
                          <AlertCircle size={32} />
                          <h4>Тур недоступний</h4>
                          <p>Інформація про цей тур тимчасово недоступна</p>
                          <FavoriteButton
                            tourId={favorite.tour_id}
                            variant="bordered"
                            showText
                            isIconOnly={false}
                          />
                        </div>
                      </CardBody>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {bookingTour && (
        <BookingModal
          tourId={bookingTour.id}
          tourTitle={bookingTour.title}
          isOpen={isOpen}
          onClose={handleModalClose}
        />
      )}

      <Footer />
    </>
  );
};