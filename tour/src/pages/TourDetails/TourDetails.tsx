import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { TourSwiper } from './components/Swiper/TourSwiper';
import { InfoSide } from './components/InfoSide/InfoSide';
import { TourComments } from '../../components/TourComments/TourComments';
import { Footer } from '../Main/components/Footer/Footer';
import { imageService } from '../../services/ImageService';
import { Button, Card, CardBody } from '@heroui/react';
import { XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import './TourDetails.scss';

export const TourDetails = () => {
  const { id } = useParams<{ id: string }>();
  const tourId = id ? parseInt(id) : 0;

  const { data: tourData, isLoading } = useQuery({
    queryKey: ['tourCheck', id],
    queryFn: async () => {
      const res = await fetch(`http://127.0.0.1:1323/tours/${id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id,
  });

  const isUnavailable = !isLoading && (!tourData || !tourData.id || tourData.status === 'inactive');

  useEffect(() => {
    if (!id || isUnavailable) return;

    const lightPreload = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:1323/tour-carousel/${id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const images = await response.json();
          
          if (Array.isArray(images) && images.length > 0) {
            imageService.preloadImage(images[0].image_src, {
              priority: 'high'
            }).catch(() => {});

            setTimeout(() => {
              const remaining = images.slice(1, 4).map((img: any) => img.image_src);
              imageService.preloadImages(remaining, {
                priority: 'low',
                concurrency: 1
              }).catch(() => {});
            }, 500);
          }
        }
      } catch (error) {
        // silent
      }
    };

    const timer = setTimeout(lightPreload, 200);
    return () => clearTimeout(timer);
  }, [id, isUnavailable]);

  if (isUnavailable) {
    return (
      <div className="tour-details">
        <Navbar />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          minHeight: 'calc(100vh - 70px)',
          padding: '2rem',
        }}>
          <Card style={{
            maxWidth: 450,
            width: '100%',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          }}>
            <CardBody style={{
              padding: '3rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1rem',
            }}>
              <XCircle size={64} style={{ color: '#ef4444' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Тур недоступний
              </h2>
              <p style={{ color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                Цей тур більше не доступний або був видалений. Перегляньте інші доступні тури.
              </p>
              <Button
                color="primary"
                size="lg"
                style={{ marginTop: '0.5rem' }}
                onClick={() => window.location.href = '/Tours'}
              >
                Переглянути тури
              </Button>
            </CardBody>
          </Card>
        </div>
        <Footer />
      </div>
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