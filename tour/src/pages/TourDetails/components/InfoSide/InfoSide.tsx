import React, { useState } from "react";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Skeleton,
  Chip,
  Progress,
  Divider,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { 
  Calendar,
  Clock,
  Users,
  Star,
  MapPin,
  Info,
  Heart,
  Share2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer
} from "lucide-react";
import { Form } from "../Form/Form";
import "./InfoSide.scss";

interface TourData {
  id: string;
  title: string;
  country?: string;
  location?: string;
  rating: number;
  status: string;
  date_from: Date;
  date_to: Date;
  duration: number;
  availableSeats: number;
  totalSeats: number;
  detailedDescription: string;
  datefrom: string;
  dateto: string;
  price?: number;
  difficulty?: string;
  minAge?: number;
}

export const InfoSide = () => {
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["tourData", id],
    queryFn: async () => {
      const fetched = await fetch(`http://127.0.0.1:1323/tours/${id}`);
      if (!fetched.ok) throw new Error("Tour not found");
      const rawTour: any = await fetched.json();
      console.log("Raw tour data:", rawTour);
      return {
        ...rawTour,
        date_from: new Date(Date.parse(rawTour.datefrom)),
        date_to: new Date(Date.parse(rawTour.dateto)),
        country: rawTour.location || rawTour.country || "Україна",
        location: rawTour.location || "Не вказано",
        price: rawTour.price || 0,
        difficulty: rawTour.difficulty || "Середня",
        minAge: rawTour.minAge || 18
      } as TourData;
    },
    enabled: !!id,
    retry: 3,
  });

  if (isPending) {
    return (
      <div className="info-side">
        <Card className="info-side__card">
          <CardHeader className="info-side__header">
            <Skeleton className="info-side__header-skeleton">
              <div className="h-8 w-3/4 rounded-lg bg-default-200"></div>
            </Skeleton>
          </CardHeader>
          <CardBody className="info-side__body">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="info-side__skeleton-item">
                  <div className="h-16 w-full rounded-lg bg-default-200"></div>
                </Skeleton>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="info-side">
        <Card className="info-side__card error-state">
          <CardBody className="error-content">
            <AlertTriangle size={48} className="error-icon" />
            <h3>Помилка завантаження</h3>
            <p>Не вдалося завантажити інформацію про тур</p>
            <Button color="primary" onClick={() => refetch()}>
              Спробувати знову
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="info-side">
        <Card className="info-side__card not-found-state">
          <CardBody className="not-found-content">
            <XCircle size={48} className="not-found-icon" />
            <h3>Тур не знайдено</h3>
            <p>Можливо, тур був видалений або не існує</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const seatsPercentage = Math.round(((data.totalSeats - data.availableSeats) / data.totalSeats) * 100);
  const isAlmostFull = data.availableSeats <= 3 && data.availableSeats > 0;
  const isFull = data.availableSeats === 0;

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
      case 'active':
        return { color: 'success' as const, icon: CheckCircle, text: 'Доступний' };
      case 'pending':
        return { color: 'warning' as const, icon: Timer, text: 'Очікування' };
      case 'completed':
        return { color: 'primary' as const, icon: CheckCircle, text: 'Завершений' };
      case 'cancelled':
        return { color: 'danger' as const, icon: XCircle, text: 'Скасований' };
      default:
        return { color: 'default' as const, icon: Info, text: status };
    }
  };

  const statusConfig = getStatusConfig(data.status);

  const renderRatingStars = (rating: number): JSX.Element => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={16} fill="currentColor" className="star star--filled" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} size={16} className="star star--half" />);
      } else {
        stars.push(<Star key={i} size={16} className="star star--empty" />);
      }
    }

    return <div className="rating-stars">{stars}</div>;
  };

  const formatDates = (dateFrom: Date, dateTo: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };
    return `${dateFrom.toLocaleDateString("uk-UA", options)} - ${dateTo.toLocaleDateString("uk-UA", options)}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data.title,
        text: `Подивіться на цей чудовий тур: ${data.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You can add a toast notification here
    }
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    // Add API call to save/remove favorite
  };

  return (
    <div className="info-side">
      <Card className="info-side__card">
        <CardHeader className="info-side__header">
          <div className="header-content">
            <div className="header-main">
              <h2 className="tour-title">{data.title}</h2>
              <div className="tour-location">
                <MapPin size={16} />
                <span>{data.country}</span>
              </div>
            </div>
            <div className="header-actions">
              <Tooltip content={isFavorite ? "Видалити з улюблених" : "Додати в улюблені"}>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  className={`favorite-btn ${isFavorite ? 'favorite-btn--active' : ''}`}
                  onClick={handleFavoriteToggle}
                >
                  <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                </Button>
              </Tooltip>
              <Tooltip content="Поділитися">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 size={18} />
                </Button>
              </Tooltip>
            </div>
          </div>
        </CardHeader>

        <CardBody className="info-side__body">
          {/* Rating */}
          <div className="info-item">
            <div className="info-item__icon">
              <Star size={20} />
            </div>
            <div className="info-item__content">
              <div className="info-label">Рейтинг</div>
              <div className="info-value rating-value">
                <span className="rating-number">{data.rating.toFixed(1)}</span>
                {renderRatingStars(data.rating)}
              </div>
            </div>
          </div>

          <Divider className="info-divider" />

          {/* Status */}
          <div className="info-item">
            <div className="info-item__icon">
              <statusConfig.icon size={20} />
            </div>
            <div className="info-item__content">
              <div className="info-label">Статус</div>
              <div className="info-value">
                <Chip 
                  color={statusConfig.color} 
                  variant="flat" 
                  size="sm"
                  startContent={<statusConfig.icon size={14} />}
                >
                  {statusConfig.text}
                </Chip>
              </div>
            </div>
          </div>

          <Divider className="info-divider" />

          {/* Dates */}
          <div className="info-item">
            <div className="info-item__icon">
              <Calendar size={20} />
            </div>
            <div className="info-item__content">
              <div className="info-label">Дати подорожі</div>
              <div className="info-value dates-value">
                {formatDates(data.date_from, data.date_to)}
              </div>
            </div>
          </div>

          <Divider className="info-divider" />

          {/* Duration */}
          <div className="info-item">
            <div className="info-item__icon">
              <Clock size={20} />
            </div>
            <div className="info-item__content">
              <div className="info-label">Тривалість</div>
              <div className="info-value">
                <span className="duration-value">{data.duration} днів</span>
              </div>
            </div>
          </div>

          <Divider className="info-divider" />

          {/* Available Seats */}
          <div className="info-item">
            <div className="info-item__icon">
              <Users size={20} />
            </div>
            <div className="info-item__content">
              <div className="info-label">Місця</div>
              <div className="info-value seats-value">
                <div className="seats-info">
                  <div className="seats-numbers">
                    <span className="available">{data.availableSeats}</span>
                    <span className="separator">/</span>
                    <span className="total">{data.totalSeats}</span>
                  </div>
                  {isAlmostFull && (
                    <Chip color="warning" size="sm" variant="flat">
                      Залишилось мало місць!
                    </Chip>
                  )}
                  {isFull && (
                    <Chip color="danger" size="sm" variant="flat">
                      Місць немає
                    </Chip>
                  )}
                </div>
                <Progress 
                  value={seatsPercentage} 
                  color={isFull ? "danger" : isAlmostFull ? "warning" : "success"}
                  size="sm"
                  className="seats-progress"
                />
              </div>
            </div>
          </div>

          <Divider className="info-divider" />

          {/* Price */}
          {data.price && (
            <>
              <div className="info-item">
                <div className="info-item__content price-content">
                  <div className="info-label">Ціна за особу</div>
                  <div className="price-value">
                    <span className="price-amount">₴{data.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <Divider className="info-divider" />
            </>
          )}

          {/* Description */}
          <div className="description-section">
            <div className="description-header">
              <h4>Опис туру</h4>
              <Button 
                size="sm" 
                variant="light" 
                color="primary"
                onClick={onOpen}
                endContent={<Info size={14} />}
              >
                Детальніше
              </Button>
            </div>
            <div className="description-content">
              <p>{data.detailedDescription}</p>
            </div>
          </div>

          {/* Form */}
          <div className="form-section">
            <Form />
          </div>
        </CardBody>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3>{data.title}</h3>
            <p className="text-small text-default-500">Детальна інформація про тур</p>
          </ModalHeader>
          <ModalBody className="pb-6">
            <div className="modal-content">
              <h4>Повний опис</h4>
              <p>{data.detailedDescription}</p>
              
              <div className="additional-info">
                <div className="info-grid">
                  {data.difficulty && (
                    <div className="info-item-small">
                      <span className="label">Складність:</span>
                      <span className="value">{data.difficulty}</span>
                    </div>
                  )}
                  {data.minAge && (
                    <div className="info-item-small">
                      <span className="label">Мінімальний вік:</span>
                      <span className="value">{data.minAge}+</span>
                    </div>
                  )}
                  <div className="info-item-small">
                    <span className="label">Локація:</span>
                    <span className="value">{data.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};