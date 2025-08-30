import React, { useState, useEffect } from 'react';
import './UserBookings.scss';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Spinner,
  Avatar,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar/Navbar';
import { 
  CalendarDays,
  MapPin,
  Users,
  CreditCard,
  Clock,
  Phone,
  Mail,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Booking {
  id: number;
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

export const UserBookings: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tour_auth_token');
      
      const response = await fetch('http://127.0.0.1:1323/user-bookings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження бронювань');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="user-bookings">
          <div className="user-bookings__access-denied">
            <Card className="access-card">
              <CardBody>
                <h2>Доступ заборонено</h2>
                <p>Увійдіть у свій акаунт для перегляду бронювань</p>
                <Button 
                  color="primary" 
                  className="btn-home"
                  onClick={() => window.location.href = '/'}
                >
                  На головну
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          color: 'success' as const,
          icon: <CheckCircle size={16} />,
          text: 'Підтверджено',
        };
      case 'pending':
        return {
          color: 'warning' as const,
          icon: <Clock size={16} />,
          text: 'Очікує підтвердження',
        };
      case 'cancelled':
        return {
          color: 'danger' as const,
          icon: <XCircle size={16} />,
          text: 'Скасовано',
        };
      default:
        return {
          color: 'default' as const,
          icon: <AlertCircle size={16} />,
          text: status,
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
    }).format(price);
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    onOpen();
  };

  const getBookingStats = () => {
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const totalSpent = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.total_price, 0);

    return { confirmed, pending, cancelled, totalSpent };
  };

  const stats = getBookingStats();

  return (
    <>
      <Navbar />
      <div className="user-bookings">
        <div className="user-bookings__container">
          {/* Header */}
          <div className="user-bookings__header">
            <div className="user-bookings__header-content">
              <h1>Мої бронювання</h1>
              <p>Переглядайте та керуйте своїми бронюваннями турів</p>
            </div>
            <div className="user-bookings__header-avatar">
              <Avatar
                src={user?.avatar_url}
                name={user?.name}
                size="lg"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="user-bookings__stats">
            <Card className="stats-card">
              <CardBody>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-icon confirmed">
                      <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.confirmed}</span>
                      <span className="stat-label">Підтверджено</span>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-icon pending">
                      <Clock size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.pending}</span>
                      <span className="stat-label">Очікують</span>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-icon cancelled">
                      <XCircle size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{stats.cancelled}</span>
                      <span className="stat-label">Скасовано</span>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <div className="stat-icon total">
                      <CreditCard size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{formatPrice(stats.totalSpent)}</span>
                      <span className="stat-label">Витрачено</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Content */}
          <div className="user-bookings__content">
            {loading ? (
              <div className="user-bookings__loading">
                <Spinner size="lg" />
                <p>Завантаження бронювань...</p>
              </div>
            ) : error ? (
              <div className="user-bookings__error">
                <Card className="error-card">
                  <CardBody>
                    <AlertCircle size={48} />
                    <h3>Помилка завантаження</h3>
                    <p>{error}</p>
                    <Button color="primary" onClick={fetchBookings}>
                      Спробувати знову
                    </Button>
                  </CardBody>
                </Card>
              </div>
            ) : bookings.length === 0 ? (
              <div className="user-bookings__empty">
                <Card className="empty-card">
                  <CardBody>
                    <CalendarDays size={64} />
                    <h3>Немає бронювань</h3>
                    <p>Ви ще не здійснили жодного бронювання. Почніть з пошуку цікавих турів!</p>
                    <Button 
                      color="primary" 
                      onClick={() => window.location.href = '/Tours'}
                    >
                      Переглянути тури
                    </Button>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <div className="user-bookings__list">
                {bookings.map((booking) => {
                  const statusInfo = getStatusInfo(booking.status);
                  
                  return (
                    <Card key={booking.id} className="booking-card">
                      <CardHeader className="booking-header">
                        <div className="booking-title">
                          <h3>{booking.tour_title}</h3>
                          <Chip
                            color={statusInfo.color}
                            variant="flat"
                            startContent={statusInfo.icon}
                            className="status-chip"
                          >
                            {statusInfo.text}
                          </Chip>
                        </div>
                        <Button
                          isIconOnly
                          variant="light"
                          onClick={() => handleViewDetails(booking)}
                          className="details-btn"
                        >
                          <Eye size={18} />
                        </Button>
                      </CardHeader>
                      
                      <Divider />
                      
                      <CardBody className="booking-body">
                        <div className="booking-info">
                          <div className="info-row">
                            <CalendarDays className="info-icon" size={18} />
                            <span>{formatDate(booking.date_from)} - {formatDate(booking.date_to)}</span>
                          </div>
                          
                          {booking.from_location && booking.to_location && (
                            <div className="info-row">
                              <MapPin className="info-icon" size={18} />
                              <span>{booking.from_location} → {booking.to_location}</span>
                            </div>
                          )}
                          
                          <div className="info-row">
                            <Users className="info-icon" size={18} />
                            <span>{booking.seats} {booking.seats === 1 ? 'місце' : 'місць'}</span>
                          </div>
                          
                          <div className="info-row">
                            <CreditCard className="info-icon" size={18} />
                            <span className="price">{formatPrice(booking.total_price)}</span>
                          </div>
                        </div>
                        
                        <div className="booking-meta">
                          <span className="booked-date">
                            Заброньовано: {formatDateTime(booking.booked_at)}
                          </span>
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

      {selectedBooking && (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" className="booking-modal">
          <ModalContent>
            <ModalHeader className="modal-header">
              <div className="modal-title">
                <h3>Деталі бронювання</h3>
                <Chip
                  color={getStatusInfo(selectedBooking.status).color}
                  variant="flat"
                  startContent={getStatusInfo(selectedBooking.status).icon}
                >
                  {getStatusInfo(selectedBooking.status).text}
                </Chip>
              </div>
            </ModalHeader>
            
            <ModalBody className="modal-body">
              <div className="booking-details">
                <div className="detail-section">
                  <h4>Інформація про тур</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Назва туру:</span>
                      <span className="detail-value">{selectedBooking.tour_title}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Дата початку:</span>
                      <span className="detail-value">{formatDate(selectedBooking.date_from)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Дата завершення:</span>
                      <span className="detail-value">{formatDate(selectedBooking.date_to)}</span>
                    </div>
                    {selectedBooking.from_location && (
                      <div className="detail-item">
                        <span className="detail-label">Місце відправлення:</span>
                        <span className="detail-value">{selectedBooking.from_location}</span>
                      </div>
                    )}
                    {selectedBooking.to_location && (
                      <div className="detail-item">
                        <span className="detail-label">Пункт призначення:</span>
                        <span className="detail-value">{selectedBooking.to_location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Divider className="section-divider" />

                <div className="detail-section">
                  <h4>Контактна інформація</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Ім'я:</span>
                      <span className="detail-value">{selectedBooking.customer_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Телефон:</span>
                      <span className="detail-value">
                        <Phone size={16} className="inline mr-2" />
                        {selectedBooking.customer_phone}
                      </span>
                    </div>
                    {selectedBooking.customer_email && (
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">
                          <Mail size={16} className="inline mr-2" />
                          {selectedBooking.customer_email}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Divider className="section-divider" />

                <div className="detail-section">
                  <h4>Деталі бронювання</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Кількість місць:</span>
                      <span className="detail-value">{selectedBooking.seats}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Загальна сума:</span>
                      <span className="detail-value price-highlight">
                        {formatPrice(selectedBooking.total_price)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Дата бронювання:</span>
                      <span className="detail-value">{formatDateTime(selectedBooking.booked_at)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Номер бронювання:</span>
                      <span className="detail-value">#{selectedBooking.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ModalBody>
            
            <ModalFooter className="modal-footer">
              <Button color="default" variant="light" onPress={onClose}>
                Закрити
              </Button>
              {selectedBooking.status === 'pending' && (
                <Button color="danger" variant="light">
                  Скасувати бронювання
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};