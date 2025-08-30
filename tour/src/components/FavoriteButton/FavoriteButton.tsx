import React from 'react';
import { Button, Tooltip } from '@heroui/react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToggleFavorite, useIsFavorite } from '../../hooks/useFavorites';
import './FavoriteButton.scss';

interface FavoriteButtonProps {
  tourId: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'bordered' | 'light' | 'flat';
  isIconOnly?: boolean;
  className?: string;
  showText?: boolean;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  tourId,
  size = 'md',
  variant = 'light',
  isIconOnly = true,
  className = '',
  showText = false,
}) => {
  const { isAuthenticated } = useAuth();
  const isFavorite = useIsFavorite(tourId);
  const { toggleFavorite, isLoading, error } = useToggleFavorite();

  const handleClick = () => {
    if (!isAuthenticated) {
      alert('Увійдіть у свій акаунт, щоб додавати тури в обране');
      return;
    }

    toggleFavorite(tourId);
  };

  const buttonContent = (
    <Button
      size={size}
      variant={variant}
      isIconOnly={isIconOnly}
      onPress={handleClick}
      isLoading={isLoading}
      className={`favorite-button ${isFavorite ? 'favorite-button--active' : ''} ${className}`}
      isDisabled={!isAuthenticated}
    >
      <Heart 
        size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
        className={`favorite-icon ${isFavorite ? 'favorite-icon--filled' : ''}`}
      />
      {showText && !isIconOnly && (
        <span className="favorite-text">
          {isFavorite ? 'Видалити з обраного' : 'Додати до обраного'}
        </span>
      )}
    </Button>
  );

  if (!isAuthenticated) {
    return (
      <Tooltip content="Увійдіть, щоб додавати до обраного">
        {buttonContent}
      </Tooltip>
    );
  }

  if (error) {
    return (
      <Tooltip content="Помилка при додаванні до обраного">
        {buttonContent}
      </Tooltip>
    );
  }

  return (
    <Tooltip content={isFavorite ? 'Видалити з обраного' : 'Додати до обраного'}>
      {buttonContent}
    </Tooltip>
  );
};