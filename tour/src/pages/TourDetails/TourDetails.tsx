import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '../../components/Navbar/Navbar';
import { TourSwiper } from './components/Swiper/TourSwiper';
import { InfoSide } from './components/InfoSide/InfoSide';
import { TourComments } from '../../components/TourComments/TourComments';
import { Footer } from '../Main/components/Footer/Footer';
import { imageService } from '../../services/ImageService';
import './TourDetails.scss';

export const TourDetails = () => {
  const { id } = useParams<{ id: string }>();
  const tourId = id ? parseInt(id) : 0;

  // 🚀 ОПТИМІЗОВАНО: Легкий preload БЕЗ блокування UI
  useEffect(() => {
    if (!id) return;

    const lightPreload = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:1323/tour-carousel/${id}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const images = await response.json();
          
          if (Array.isArray(images) && images.length > 0) {
            // Тільки перше зображення негайно
            imageService.preloadImage(images[0].image_src, {
              priority: 'high'
            }).catch(() => {});

            // Решту в фоні з затримкою
            setTimeout(() => {
              const remaining = images.slice(1, 4).map((img: any) => img.image_src); // Тільки 3 наступні
              imageService.preloadImages(remaining, {
                priority: 'low',
                concurrency: 1
              }).catch(() => {});
            }, 500);
          }
        }
      } catch (error) {
        // Тихо ігноруємо помилки preload
      }
    };

    // Запускаємо з затримкою
    const timer = setTimeout(lightPreload, 200);
    return () => clearTimeout(timer);
  }, [id]);

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