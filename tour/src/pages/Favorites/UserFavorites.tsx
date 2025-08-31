import React from 'react';
import './UserFavorites.scss';
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Spinner,
  Avatar,
  Chip,
} from "@heroui/react";
import { useAuth } from '../../context/AuthContext';
import { useFavoritesWithDetails } from '../../hooks/useFavorites';
import { Navbar } from '../../components/Navbar/Navbar';
import { FavoriteButton } from '../../components/FavoriteButton/FavoriteButton';
import {Footer} from '../Main/components/Footer/Footer';
import { 
  Heart,
  AlertCircle,
  ShoppingBag,
  Star,
  MapPin,
  Eye
} from 'lucide-react';

export const UserFavorites: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { data: favorites, isLoading, error, isEmpty } = useFavoritesWithDetails();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
    }).format(price);
  };

  const handleViewTour = (tourId: number) => {
    window.location.href = `/TourDetails/${tourId}`;
  };

  const handleBookTour = (tourId: number) => {
    window.location.href = `/TourDetails/${tourId}#booking`;
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

  return (
    <>
      <Navbar />
      <div className="user-favorites">
        <div className="user-favorites__container">
          {/* Header */}
          <div className="user-favorites__header">
            <div className="user-favorites__header-content">
              <h1>
                <Heart className="header-icon" size={32} />
                Обране
              </h1>
              <p>Ваші збережені тури для майбутніх подорожей</p>
            </div>
            <div className="user-favorites__header-avatar">
              <Avatar
                src={user?.avatar_url}
                name={user?.name}
                size="lg"
              />
            </div>
          </div>

          {/* Stats */}
          {!isLoading && !isEmpty && (
            <div className="user-favorites__stats">
              <Card className="stats-card">
                <CardBody>
                  <div className="stats-content">
                    <Heart size={24} className="stats-icon" />
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

          {/* Content */}
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
                    <p>
                      Ви ще не додали жодного туру до обраного. 
                      Знайдіть цікаві тури та збережіть їх тут!
                    </p>
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
                    {favorite.tour && (
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
                            <h3 className="favorite-card__title">
                              {favorite.tour.title}
                            </h3>
                            
                            <div className="favorite-card__price">
                              <span className="price-label">Від</span>
                              <span className="price-value">
                                {formatPrice(favorite.tour.price)}
                              </span>
                            </div>

                            <div className="favorite-card__rating">
                              <Star size={16} className="rating-icon" />
                              <span className="rating-value">4.5</span>
                              <span className="rating-count">(124 відгуки)</span>
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
                              onClick={() => handleBookTour(favorite.tour_id)}
                              className="action-btn book-btn"
                            >
                              Забронювати
                            </Button>
                          </div>
                        </CardFooter>
                      </>
                    )}

                    {!favorite.tour && (
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
      <Footer/>
    </>
  );
};