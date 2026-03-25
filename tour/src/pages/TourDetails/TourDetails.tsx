import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Spinner, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure, Chip, Progress } from '@heroui/react';
import { MapPin, ArrowLeft, Heart, Share2, Calendar, Clock, Users, Star, CheckCircle, Timer, Info } from 'lucide-react';
import { Navbar } from '../../components/Navbar/Navbar';
import { TourComments } from '../../components/TourComments/TourComments';
import { Footer } from '../Main/components/Footer/Footer';
import { imageService } from '../../services/ImageService';
import { useAuth } from '../../context/AuthContext';
import { useToggleFavorite, useIsFavorite } from '../../hooks/useFavorites';
import { Form } from './components/Form/Form';
import './TourDetails.scss';

export const TourDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tourId = id ? parseInt(id) : 0;
  const { isAuthenticated } = useAuth();
  const isFavorite = useIsFavorite(tourId);
  const { toggleFavorite, isLoading: favLoading } = useToggleFavorite();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [heroImage, setHeroImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [activeImg, setActiveImg] = useState(0);

  const { data: tour, isLoading, isError } = useQuery({
    queryKey: ['tourData', id],
    queryFn: async () => {
      const res = await fetch(`http://127.0.0.1:1323/tours/${id}`);
      if (!res.ok) throw new Error('Not found');
      const raw: any = await res.json();
      return {
        ...raw,
        date_from: raw.datefrom ? new Date(Date.parse(raw.datefrom)) : undefined,
        date_to:   raw.dateto   ? new Date(Date.parse(raw.dateto))   : undefined,
        country: raw.location || raw.country || 'Україна',
        price: raw.price || 0,
      };
    },
    enabled: !!id && tourId > 0,
    retry: 1,
    staleTime: 60000,
  });

  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:1323/tour-carousel/${id}`)
      .then(r => r.ok ? r.json() : [])
      .then((imgs: any[]) => {
        if (!Array.isArray(imgs) || !imgs.length) return;
        const urls = imgs.map(i => imageService.getImageUrl(i.image_src));
        setGalleryImages(urls);
        setHeroImage(urls[0]);
        imageService.preloadImages(imgs.map(i => i.image_src), { priority: 'high' }).catch(() => {});
      })
      .catch(() => {});
  }, [id]);

  if (!id || tourId === 0 || isNaN(tourId)) return <><Navbar /><NotFound onBack={() => navigate('/Tours')} /><Footer /></>;
  if (isLoading) return (
    <>
      <Navbar />
      <div className="td2-loading"><Spinner size="lg" color="primary" /><p>Завантаження...</p></div>
      <Footer />
    </>
  );
  if (isError || !tour || !tour.id) return <><Navbar /><NotFound onBack={() => navigate('/Tours')} /><Footer /></>;

  const formatDate = (d: Date | undefined) => d
    ? d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
    : '—';

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(p);

  const seatsUsed = tour.totalSeats > 0
    ? Math.round(((tour.totalSeats - tour.availableSeats) / tour.totalSeats) * 100)
    : 0;
  const almostFull = tour.availableSeats <= 3 && tour.availableSeats > 0;
  const full = tour.availableSeats === 0;

  const handleFav = () => {
    if (!isAuthenticated) { alert('Увійдіть, щоб додавати в обране'); return; }
    toggleFavorite(tourId);
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: tour.title, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="td2">
      <Navbar />

      {/* ── Hero ── */}
      <div className="td2__hero">
        {/* Back button */}
        <button className="td2__back" onClick={() => navigate('/Tours')}>
          <ArrowLeft size={18} />
          <span>Назад</span>
        </button>

        {/* Actions */}
        <div className="td2__hero-actions">
          <button className={`td2__action-btn ${isFavorite ? 'td2__action-btn--fav' : ''}`} onClick={handleFav} disabled={favLoading}>
            <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button className="td2__action-btn" onClick={handleShare}>
            <Share2 size={18} />
          </button>
        </div>

        {/* Main photo */}
        <div className="td2__hero-img-wrap">
          {heroImage ? (
            <img src={heroImage} alt={tour.title} className="td2__hero-img" />
          ) : (
            <div className="td2__hero-placeholder"><MapPin size={48} color="#94a3b8" /></div>
          )}
          <div className="td2__hero-grad" />
        </div>

        {/* Hero text */}
        <div className="td2__hero-text">
          <div className="td2__hero-location">
            <MapPin size={14} />
            <span>{tour.country}</span>
          </div>
          <h1 className="td2__hero-title">{tour.title}</h1>
          {tour.rating > 0 && (
            <div className="td2__hero-rating">
              <Star size={15} fill="#fbbf24" color="#fbbf24" />
              <span>{tour.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Thumbnail strip */}
        {galleryImages.length > 1 && (
          <div className="td2__thumbs">
            {galleryImages.slice(0, 5).map((url, i) => (
              <button
                key={i}
                className={`td2__thumb ${activeImg === i ? 'td2__thumb--active' : ''}`}
                onClick={() => { setActiveImg(i); setHeroImage(url); }}
              >
                <img src={url} alt={`${i + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="td2__body">
        <div className="td2__body-inner">

          {/* ── Left: details ── */}
          <div className="td2__details">

            {/* Description */}
            {tour.detailedDescription && (
              <div className="td2__section">
                <h2 className="td2__section-title">Про тур</h2>
                <p className="td2__desc">{tour.detailedDescription}</p>
              </div>
            )}

            {/* Stats grid */}
            <div className="td2__section">
              <h2 className="td2__section-title">Деталі</h2>
              <div className="td2__stats">
                <div className="td2__stat">
                  <div className="td2__stat-icon"><Calendar size={20} /></div>
                  <div>
                    <div className="td2__stat-label">Дати</div>
                    <div className="td2__stat-val">
                      {tour.date_from && tour.date_to
                        ? `${formatDate(tour.date_from)} — ${formatDate(tour.date_to)}`
                        : 'Уточнюються'}
                    </div>
                  </div>
                </div>
                <div className="td2__stat">
                  <div className="td2__stat-icon"><Clock size={20} /></div>
                  <div>
                    <div className="td2__stat-label">Тривалість</div>
                    <div className="td2__stat-val">
                      {tour.duration > 0 ? `${tour.duration} днів` : 'Уточнюється'}
                    </div>
                  </div>
                </div>
                <div className="td2__stat">
                  <div className="td2__stat-icon"><Users size={20} /></div>
                  <div>
                    <div className="td2__stat-label">Місця</div>
                    <div className="td2__stat-val">
                      <strong style={{ color: full ? '#ef4444' : '#10b981' }}>{tour.availableSeats}</strong>
                      {' '}<span style={{ color: '#94a3b8' }}>/ {tour.totalSeats}</span>
                    </div>
                    <Progress value={seatsUsed} size="sm"
                      color={full ? 'danger' : almostFull ? 'warning' : 'success'}
                      style={{ marginTop: 6, width: 120 }} />
                  </div>
                </div>
                <div className="td2__stat">
                  <div className="td2__stat-icon"><CheckCircle size={20} /></div>
                  <div>
                    <div className="td2__stat-label">Статус</div>
                    <div className="td2__stat-val">
                      <Chip size="sm" variant="flat"
                        color={tour.status === 'active' ? 'success' : 'default'}>
                        {tour.status === 'active' ? 'Доступний' : tour.status}
                      </Chip>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            {tourId > 0 && <TourComments tourId={tourId} />}
          </div>

          {/* ── Right: booking card ── */}
          <div className="td2__card">
            <div className="td2__card-inner">
              <div className="td2__card-price-row">
                <div>
                  <div className="td2__card-price-label">Ціна за особу</div>
                  <div className="td2__card-price">{formatPrice(tour.price)}</div>
                </div>
                {almostFull && (
                  <Chip size="sm" color="warning" variant="flat">Поспішайте!</Chip>
                )}
              </div>

              {/* Seat bar */}
              <div className="td2__card-seats">
                <div className="td2__card-seats-row">
                  <span>Вільних місць</span>
                  <span><strong>{tour.availableSeats}</strong> / {tour.totalSeats}</span>
                </div>
                <Progress value={seatsUsed} size="sm"
                  color={full ? 'danger' : almostFull ? 'warning' : 'success'} />
              </div>

              <div className="td2__card-divider" />

              {/* Quick info */}
              <div className="td2__card-info">
                {tour.date_from && (
                  <div className="td2__card-info-row">
                    <Calendar size={14} />
                    <span>{formatDate(tour.date_from)} — {formatDate(tour.date_to)}</span>
                  </div>
                )}
                {tour.duration > 0 && (
                  <div className="td2__card-info-row">
                    <Clock size={14} />
                    <span>{tour.duration} днів</span>
                  </div>
                )}
              </div>

              {/* Form */}
              <Form />

              <p className="td2__card-note">Безкоштовне скасування до підтвердження</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const NotFound = ({ onBack }: { onBack: () => void }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem', minHeight:'70vh', padding:'2rem', textAlign:'center' }}>
    <div style={{ width:72, height:72, borderRadius:'50%', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <MapPin size={36} color="#94a3b8" />
    </div>
    <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:'#1e293b', margin:0 }}>Тур не знайдено</h1>
    <p style={{ color:'#64748b', margin:0 }}>Цей тур більше не доступний.</p>
    <button onClick={onBack}
      style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, border:'none', background:'#1e293b', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
      <ArrowLeft size={16} /> Повернутися до турів
    </button>
  </div>
);