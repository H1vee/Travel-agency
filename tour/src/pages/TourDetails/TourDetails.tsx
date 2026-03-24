import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Spinner } from '@heroui/react';
import { MapPin, ArrowLeft } from 'lucide-react';
import { Navbar } from '../../components/Navbar/Navbar';
import { TourSwiper } from './components/Swiper/TourSwiper';
import { InfoSide } from './components/InfoSide/InfoSide';
import { TourComments } from '../../components/TourComments/TourComments';
import { Footer } from '../Main/components/Footer/Footer';
import { imageService } from '../../services/ImageService';
import './TourDetails.scss';

export const TourDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tourId = id ? parseInt(id) : 0;

  // Fetch tour to check existence before rendering child components
  const { data: tour, isLoading, isError } = useQuery({
    queryKey: ['tourData', id],
    queryFn: async () => {
      const res = await fetch(`http://127.0.0.1:1323/tours/${id}`);
      if (!res.ok) throw new Error('Tour not found');
      return res.json();
    },
    enabled: !!id && tourId > 0,
    retry: 1,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!id) return;

    const lightPreload = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:1323/tour-carousel/${id}`);
        if (response.ok) {
          const images = await response.json();
          if (Array.isArray(images) && images.length > 0) {
            imageService.preloadImage(images[0].image_src, { priority: 'high' }).catch(() => {});
            setTimeout(() => {
              const remaining = images.slice(1, 4).map((img: any) => img.image_src);
              imageService.preloadImages(remaining, { priority: 'low', concurrency: 1 }).catch(() => {});
            }, 500);
          }
        }
      } catch {
        // silent
      }
    };

    const timer = setTimeout(lightPreload, 200);
    return () => clearTimeout(timer);
  }, [id]);

  // Invalid ID in URL
  if (!id || tourId === 0 || isNaN(tourId)) {
    return (
      <>
        <Navbar />
        <NotFoundPage onBack={() => navigate('/Tours')} />
        <Footer />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '1rem',
          color: '#64748b',
        }}>
          <Spinner size="lg" color="primary" />
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>Завантаження туру...</p>
        </div>
        <Footer />
      </>
    );
  }

  // Tour not found or inactive
  if (isError || !tour || !tour.id || tour.status === 'inactive') {
    return (
      <>
        <Navbar />
        <NotFoundPage onBack={() => navigate('/Tours')} />
        <Footer />
      </>
    );
  }

  return (
    <div className="tour-details">
      <Navbar />
      <main className="tour-details__content">
        <section className="tour-details__main">
          <div className="tour-details__swiper-container">
            <TourSwiper />
          </div>
          <div className="tour-details__info-container">
            <InfoSide />
          </div>
        </section>
        {tourId > 0 && (
          <section className="tour-details__comments">
            <TourComments tourId={tourId} />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

interface NotFoundPageProps {
  onBack: () => void;
}

const NotFoundPage = ({ onBack }: NotFoundPageProps) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    padding: '2rem',
  }}>
    <div style={{
      textAlign: 'center',
      maxWidth: '480px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <MapPin size={36} color="#94a3b8" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#1e293b',
          margin: 0,
        }}>
          Тур не знайдено
        </h1>
        <p style={{
          fontSize: '1.05rem',
          color: '#64748b',
          lineHeight: 1.6,
          margin: 0,
        }}>
          Цей тур більше не доступний або був видалений.<br />
          Перегляньте інші тури — ми впевнені, ви знайдете щось цікаве!
        </p>
      </div>

      <Button
        color="primary"
        variant="shadow"
        startContent={<ArrowLeft size={16} />}
        onClick={onBack}
        style={{
          borderRadius: '12px',
          fontWeight: 600,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        }}
      >
        Повернутися до турів
      </Button>
    </div>
  </div>
);