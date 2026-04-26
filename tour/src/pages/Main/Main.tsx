import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../../components/Navbar/Navbar';
import { Swiper } from './components/Swiper/Swiper';
import { Hero } from './components/Hero/Hero';
import { Footer } from './components/Footer/Footer';
import { imageService } from '../../services/ImageService';
import {
  MapPin, Star, Shield, Headphones, CreditCard,
  ArrowRight, ChevronRight,
  Compass, Sparkles, Map, Users, TrendingUp,
} from 'lucide-react';
import './Main.scss';

const API = process.env.REACT_APP_API_URL!;

/* ── Popular tour card ────────────────────────────────────────────── */
interface PopularTour {
  id: number;
  title: string;
  price: number;
  rating: number;
  imageSrc: string | null;
  location?: string;
}

const TourCard: React.FC<{ tour: PopularTour; idx: number }> = ({ tour, idx }) => {
  const imgUrl = imageService.getImageUrl(tour.imageSrc);
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH', minimumFractionDigits: 0 }).format(p);

  return (
    <Link to={`/TourDetails/${tour.id}`} className="hp-tour" style={{ animationDelay: `${idx * 80}ms` }}>
      <div className="hp-tour__img">
        <img src={imgUrl} alt={tour.title} loading="lazy" />
        <div className="hp-tour__img-grad" />
        {tour.rating > 0 && (
          <span className="hp-tour__rating">
            <Star size={11} fill="#fbbf24" color="#fbbf24" /> {tour.rating.toFixed(1)}
          </span>
        )}
      </div>
      <div className="hp-tour__body">
        <h3 className="hp-tour__name">{tour.title}</h3>
        {tour.location && (
          <span className="hp-tour__loc"><MapPin size={12} /> {tour.location}</span>
        )}
        <div className="hp-tour__foot">
          <span className="hp-tour__price">{formatPrice(tour.price)}</span>
          <span className="hp-tour__arrow"><ArrowRight size={14} /></span>
        </div>
      </div>
    </Link>
  );
};

/* ── Animated counter ─────────────────────────────────────────────── */
const AnimCounter: React.FC<{ end: number; suffix?: string; decimals?: number }> = ({
  end, suffix = '', decimals = 0,
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const elId = `counter-${end}-${suffix}`;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    const el = document.getElementById(elId);
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [elId, started]);

  useEffect(() => {
    if (!started) return;
    let frame: number;
    const startTime = performance.now();
    const duration = 2000;
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [started, end]);

  const display = decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString('uk-UA');

  return <span id={elId}>{display}{suffix}</span>;
};

/* ── Main page ────────────────────────────────────────────────────── */
export const Main = () => {
  // Popular tours from real API
  const { data: tours = [] } = useQuery<PopularTour[]>({
    queryKey: ['popularToursHome'],
    queryFn: async () => {
      const res = await fetch(`${API}/cards`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data || [])
        .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6)
        .map((t: any) => ({
          id: t.id,
          title: t.title,
          price: t.price,
          rating: t.rating || 0,
          imageSrc: t.imageSrc || t.image_src,
          location: t.location || '',
        }));
    },
    staleTime: 5 * 60 * 1000,
  });

  // Real stats from public API
  const { data: stats } = useQuery<{
    total_tours: number;
    total_bookings: number;
    total_users: number;
    average_rating: number;
  }>({
    queryKey: ['publicStats'],
    queryFn: async () => {
      const res = await fetch(`${API}/stats`);
      if (!res.ok) throw new Error('Stats unavailable');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="hp">
      <Navbar />
      <Swiper />

      {/* ── Popular tours ──────────────────────────────────────────── */}
      {tours.length > 0 && (
        <section className="hp-popular">
          <div className="hp-popular__inner">
            <div className="hp-popular__head">
              <div>
                <span className="hp-popular__label"><Sparkles size={14} /> Популярне</span>
                <h2 className="hp-popular__title">Тури, які обирають найчастіше</h2>
              </div>
              <Link to="/Tours" className="hp-popular__all">
                Усі тури <ChevronRight size={16} />
              </Link>
            </div>
            <div className="hp-popular__grid">
              {tours.map((t, i) => <TourCard key={t.id} tour={t} idx={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="hp-features">
        <div className="hp-features__inner">
          <span className="hp-features__label"><Compass size={14} /> Чому ми</span>
          <h2 className="hp-features__title">Подорожуйте з впевненістю</h2>

          <div className="hp-features__grid">
            {[
              { icon: Shield, title: 'Безпечні подорожі', desc: 'Перевірені партнери та підтримка на кожному етапі вашої подорожі' },
              { icon: CreditCard, title: 'Онлайн-оплата', desc: 'Зручна оплата через LiqPay прямо на сайті без перенаправлень' },
              { icon: Headphones, title: 'Підтримка', desc: 'Наша команда допоможе з будь-яким питанням щодо бронювання' },
              { icon: Compass, title: 'Зручний пошук', desc: 'Фільтри за ціною, регіоном, тривалістю та рейтингом — знайдіть свій тур' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div className="hp-feat" key={i} style={{ animationDelay: `${i * 100}ms` }}>
                <div className="hp-feat__icon"><Icon size={22} /></div>
                <h3 className="hp-feat__title">{title}</h3>
                <p className="hp-feat__desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats (real data from API) ─────────────────────────────── */}
      {stats && (
        <section className="hp-stats">
          <div className="hp-stats__inner">
            <div className="hp-stat">
              <Map size={24} className="hp-stat__icon" />
              <span className="hp-stat__val">
                <AnimCounter end={stats.total_tours} />
              </span>
              <span className="hp-stat__label">Активних турів</span>
            </div>
            <div className="hp-stat">
              <TrendingUp size={24} className="hp-stat__icon" />
              <span className="hp-stat__val">
                <AnimCounter end={stats.total_bookings} />
              </span>
              <span className="hp-stat__label">Бронювань</span>
            </div>
            <div className="hp-stat">
              <Users size={24} className="hp-stat__icon" />
              <span className="hp-stat__val">
                <AnimCounter end={stats.total_users} />
              </span>
              <span className="hp-stat__label">Користувачів</span>
            </div>
            {stats.average_rating > 0 && (
              <div className="hp-stat">
                <Star size={24} className="hp-stat__icon" />
                <span className="hp-stat__val">
                  <AnimCounter end={stats.average_rating} decimals={1} />
                </span>
                <span className="hp-stat__label">Середній рейтинг</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="hp-cta">
        <div className="hp-cta__inner">
          <div className="hp-cta__text">
            <h2>Готові до подорожі?</h2>
            <p>Оберіть тур, забронюйте онлайн та оплатіть — все на одному сайті</p>
          </div>
          <div className="hp-cta__buttons">
            <Link to="/Tours" className="hp-cta__btn hp-cta__btn--primary">
              <Compass size={18} /> Знайти тур
            </Link>
            <Link to="/AboutUs" className="hp-cta__btn hp-cta__btn--secondary">
              Про нас <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <Hero />
      <Footer />
    </div>
  );
};