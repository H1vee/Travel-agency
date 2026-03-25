import React from "react";
import {
  Button, Skeleton, Chip, Progress,
  Modal, ModalContent, ModalHeader, ModalBody, useDisclosure
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  Calendar, Clock, Users, Star, MapPin, Info,
  Heart, Share2, AlertTriangle, CheckCircle, XCircle, Timer
} from "lucide-react";
import { useAuth } from '../../../../context/AuthContext';
import { useToggleFavorite, useIsFavorite } from '../../../../hooks/useFavorites';
import { Form } from "../Form/Form";
import "./InfoSide.scss";

interface TourData {
  id: string;
  title: string;
  country?: string;
  location?: string;
  rating: number;
  status: string;
  date_from: Date | undefined;
  date_to: Date | undefined;
  duration: number;
  availableSeats: number;
  totalSeats: number;
  detailedDescription: string;
  datefrom: string | undefined;
  dateto: string | undefined;
  price: number;
}

export const InfoSide = () => {
  const { id } = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isAuthenticated } = useAuth();
  const tourId = id ? parseInt(id) : 0;
  const isFavorite = useIsFavorite(tourId);
  const { toggleFavorite, isLoading: favLoading } = useToggleFavorite();

  const { isPending, error, data, refetch } = useQuery({
    queryKey: ["tourData", id],
    queryFn: async () => {
      const res = await fetch(`http://127.0.0.1:1323/tours/${id}`);
      if (!res.ok) throw new Error("Tour not found");
      const raw: any = await res.json();
      return {
        ...raw,
        date_from: raw.datefrom ? new Date(Date.parse(raw.datefrom)) : undefined,
        date_to: raw.dateto ? new Date(Date.parse(raw.dateto)) : undefined,
        country: raw.location || raw.country || "Україна",
        location: raw.location || "Не вказано",
        price: raw.price || 0,
      } as TourData;
    },
    enabled: !!id,
    retry: 3,
  });

  const handleFavorite = () => {
    if (!isAuthenticated) { alert('Увійдіть, щоб додавати в обране'); return; }
    if (tourId > 0) toggleFavorite(tourId);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: data?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDates = (from: Date | undefined, to: Date | undefined) => {
    if (!from || !to) return 'Дати уточнюються';
    const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return `${from.toLocaleDateString('uk-UA', o)} — ${to.toLocaleDateString('uk-UA', o)}`;
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(p);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        fill={i < Math.floor(rating) ? '#f59e0b' : 'none'}
        color={i < Math.floor(rating) ? '#f59e0b' : '#d1d5db'}
        strokeWidth={2}
      />
    ));
  };

  if (isPending) return (
    <div className="is is--loading">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="is__sk" />
      ))}
    </div>
  );

  if (error || !data || !data.id) return (
    <div className="is is--error">
      <AlertTriangle size={36} color="#ef4444" />
      <p>Не вдалося завантажити тур</p>
      <Button size="sm" color="primary" onClick={() => refetch()}>Спробувати знову</Button>
    </div>
  );

  const seatsUsed = data.totalSeats > 0
    ? Math.round(((data.totalSeats - data.availableSeats) / data.totalSeats) * 100)
    : 0;
  const almostFull = data.availableSeats <= 3 && data.availableSeats > 0;
  const full = data.availableSeats === 0;

  return (
    <div className="is">
      {/* ── Header ── */}
      <div className="is__head">
        <div className="is__head-top">
          <div>
            <h1 className="is__title">{data.title}</h1>
            <div className="is__location">
              <MapPin size={14} />
              <span>{data.country}</span>
            </div>
          </div>
          <div className="is__head-actions">
            <button
              className={`is__icon-btn ${isFavorite ? 'is__icon-btn--active' : ''}`}
              onClick={handleFavorite}
              disabled={favLoading || !isAuthenticated}
              title="Обране"
            >
              <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button className="is__icon-btn" onClick={handleShare} title="Поділитись">
              <Share2 size={17} />
            </button>
          </div>
        </div>

        {/* Rating + Status row */}
        <div className="is__head-meta">
          {data.rating > 0 && (
            <div className="is__rating">
              <div className="is__stars">{renderStars(data.rating)}</div>
              <span className="is__rating-val">{data.rating.toFixed(1)}</span>
            </div>
          )}
          <Chip
            size="sm"
            variant="flat"
            color={data.status === 'active' ? 'success' : 'default'}
            startContent={data.status === 'active' ? <CheckCircle size={12} /> : <Timer size={12} />}
          >
            {data.status === 'active' ? 'Доступний' : data.status}
          </Chip>
        </div>
      </div>

      {/* ── Info rows ── */}
      <div className="is__info">
        <div className="is__row">
          <div className="is__row-icon"><Calendar size={16} /></div>
          <div className="is__row-body">
            <span className="is__row-label">Дати</span>
            <span className="is__row-val">{formatDates(data.date_from, data.date_to)}</span>
          </div>
        </div>

        <div className="is__row">
          <div className="is__row-icon"><Clock size={16} /></div>
          <div className="is__row-body">
            <span className="is__row-label">Тривалість</span>
            <span className="is__row-val">
              {data.duration > 0 ? `${data.duration} днів` : 'Уточнюється'}
            </span>
          </div>
        </div>

        <div className="is__row">
          <div className="is__row-icon"><Users size={16} /></div>
          <div className="is__row-body">
            <span className="is__row-label">Місця</span>
            <div className="is__seats">
              <div className="is__seats-top">
                <span className="is__seats-nums">
                  <strong>{data.availableSeats}</strong>
                  <span>/ {data.totalSeats} вільних</span>
                </span>
                {almostFull && <Chip size="sm" color="warning" variant="flat">Майже зайнято</Chip>}
                {full && <Chip size="sm" color="danger" variant="flat">Немає місць</Chip>}
              </div>
              <Progress
                value={seatsUsed}
                size="sm"
                color={full ? 'danger' : almostFull ? 'warning' : 'success'}
                className="is__seats-bar"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Price + CTA ── */}
      <div className="is__purchase">
        <div className="is__price-block">
          <span className="is__price-label">Ціна за особу</span>
          <span className="is__price">{formatPrice(data.price)}</span>
        </div>
        <div>
          <Form />
        </div>
      </div>

      {/* ── Description ── */}
      {data.detailedDescription && (
        <div className="is__desc">
          <div className="is__desc-header">
            <span>Про тур</span>
            <button className="is__desc-more" onClick={onOpen}>
              <Info size={13} /> Детальніше
            </button>
          </div>
          <p className="is__desc-text">{data.detailedDescription}</p>
        </div>
      )}

      {/* ── Full desc modal ── */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{data.title}</ModalHeader>
          <ModalBody className="pb-6">
            <p style={{ lineHeight: 1.7, color: '#374151' }}>{data.detailedDescription}</p>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};