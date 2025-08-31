import React, { useState } from 'react';
import './UserProfile.scss';
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Button,
  Input,
  Divider,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar/Navbar';
import {Footer} from '../Main/components/Footer/Footer';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Settings, 
  Edit,
  Camera
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="user-profile">
          <div className="user-profile__access-denied">
            <Card className="access-card">
              <CardBody>
                <h2>Доступ заборонено</h2>
                <p>Увійдіть у свій акаунт для перегляду профілю</p>
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

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { authService } = await import('../../services/AuthService');
      const updatedUser = await authService.updateProfile({
        name: editData.name,
        phone: editData.phone || undefined,
      });
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка оновлення профілю');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: user.name,
      phone: user.phone || '',
    });
    setIsEditing(false);
    setError('');
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Не вказано';
    return new Date(dateString).toLocaleDateString('uk-UA');
  };

  return (
    <>
      <Navbar />
      <div className="user-profile">
        <div className="user-profile__container">
          <div className="user-profile__header">
            <h1>Мій профіль</h1>
            <p>Керуйте своїми особистими даними та налаштуваннями</p>
          </div>

          <div className="user-profile__content">
            <div>
              <Card className="user-profile__profile-card">
                <CardBody className="card-body">
                  <div className="user-profile__profile-card-avatar">
                    <Avatar
                      src={user.avatar_url}
                      name={user.name}
                      size="lg"
                      className="avatar w-24 h-24 text-large"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      color="primary"
                      className="camera-btn"
                      onClick={onOpen}
                    >
                      <Camera size={16} />
                    </Button>
                  </div>
                  
                  <h2 className="user-profile__profile-card-name">{user.name}</h2>
                  <p className="user-profile__profile-card-email">{user.email}</p>
                  
                  <div className="user-profile__profile-card-chips">
                    <Chip
                      className={`chip-role ${user.role === 'admin' ? 'admin' : 'user'}`}
                      variant="flat"
                      startContent={<Shield size={16} />}
                    >
                      {user.role === 'admin' ? 'Адміністратор' : 'Користувач'}
                    </Chip>

                    <Chip
                      className={`chip-verified ${user.is_verified ? 'verified' : 'not-verified'}`}
                      variant="flat"
                    >
                      {user.is_verified ? 'Підтверджено' : 'Не підтверджено'}
                    </Chip>
                  </div>

                  <Button
                    color="danger"
                    variant="light"
                    onClick={logout}
                    className="user-profile__profile-card-logout w-full"
                  >
                    Вийти з акаунта
                  </Button>
                </CardBody>
              </Card>
            </div>
            <div>
              <Card className="user-profile__info-card">
                <CardHeader className="card-header flex justify-between items-center">
                  <h3>Особисті дані</h3>
                  <Button
                    color="primary"
                    variant="light"
                    className="user-profile__edit-btn"
                    startContent={<Edit size={16} />}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Скасувати' : 'Редагувати'}
                  </Button>
                </CardHeader>
                <Divider />
                <CardBody className="card-body">
                  {error && (
                    <div className="user-profile__error">
                      {error}
                    </div>
                  )}

                  <div>
                    <div className="user-profile__info-card-field">
                      <User className="user-profile__info-card-field-icon" size={20} />
                      <div className="user-profile__info-card-field-content">
                        <label className="user-profile__info-card-field-label">
                          Ім'я
                        </label>
                        {isEditing ? (
                          <Input
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            placeholder="Введіть ваше ім'я"
                            variant="bordered"
                          />
                        ) : (
                          <p className="user-profile__info-card-field-value">{user.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="user-profile__info-card-field">
                      <Mail className="user-profile__info-card-field-icon" size={20} />
                      <div className="user-profile__info-card-field-content">
                        <label className="user-profile__info-card-field-label">
                          Email
                        </label>
                        <p className="user-profile__info-card-field-value">{user.email}</p>
                        <p className="user-profile__info-card-field-note">
                          Email неможливо змінити
                        </p>
                      </div>
                    </div>
                    <div className="user-profile__info-card-field">
                      <Phone className="user-profile__info-card-field-icon" size={20} />
                      <div className="user-profile__info-card-field-content">
                        <label className="user-profile__info-card-field-label">
                          Телефон
                        </label>
                        {isEditing ? (
                          <Input
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                            placeholder="Введіть ваш телефон"
                            variant="bordered"
                          />
                        ) : (
                          <p className="user-profile__info-card-field-value">{user.phone || 'Не вказано'}</p>
                        )}
                      </div>
                    </div>
                    <div className="user-profile__info-card-field">
                      <Calendar className="user-profile__info-card-field-icon" size={20} />
                      <div className="user-profile__info-card-field-content">
                        <label className="user-profile__info-card-field-label">
                          Дата реєстрації
                        </label>
                        <p className="user-profile__info-card-field-value">
                          {formatDate((user as any).created_at)}
                        </p>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="user-profile__info-card-actions">
                        <Button
                          color="primary"
                          onClick={handleSave}
                          isLoading={isLoading}
                          className="btn-save flex-1"
                        >
                          Зберегти зміни
                        </Button>
                        <Button
                          color="default"
                          variant="bordered"
                          onClick={handleCancel}
                          className="btn-cancel flex-1"
                        >
                          Скасувати
                        </Button>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
              <Card className="user-profile__actions-card">
                <CardHeader className="card-header">
                  <h3>Швидкі дії</h3>
                </CardHeader>
                <Divider />
                <CardBody className="card-body">
                  <div className="user-profile__actions-card-grid">
                    <Button
                      variant="bordered"
                      startContent={<Calendar size={16} />}
                      onClick={() => window.location.href = '/bookings'}
                      className="user-profile__actions-card-button"
                    >
                      <span className="user-profile__actions-card-button-title">Мої бронювання</span>
                      <span className="user-profile__actions-card-button-subtitle">Переглянути історію</span>
                    </Button>
                    
                    <Button
                      variant="bordered"
                      startContent={<User size={16} />}
                      onClick={() => window.location.href = '/favorites'}
                      className="user-profile__actions-card-button"
                    >
                      <span className="user-profile__actions-card-button-title">Обране</span>
                      <span className="user-profile__actions-card-button-subtitle">Збережені тури</span>
                    </Button>
                    
                    <Button
                      variant="bordered"
                      startContent={<Settings size={16} />}
                      onClick={() => window.location.href = '/settings'}
                      className="user-profile__actions-card-button"
                    >
                      <span className="user-profile__actions-card-button-title">Налаштування</span>
                      <span className="user-profile__actions-card-button-subtitle">Персоналізація</span>
                    </Button>
                    
                    <Button
                      variant="bordered"
                      startContent={<Shield size={16} />}
                      className="user-profile__actions-card-button"
                      disabled
                    >
                      <span className="user-profile__actions-card-button-title">Безпека</span>
                      <span className="user-profile__actions-card-button-subtitle">Скоро</span>
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={onClose} size="sm" className="user-profile__modal">
        <ModalContent className="modal-content">
          <ModalHeader className="modal-header">
            <h3>Змінити фото профілю</h3>
          </ModalHeader>
          <ModalBody className="modal-body">
            <div>
              <Avatar
                src={user.avatar_url}
                name={user.name}
                size="lg"
                className="modal-avatar w-32 h-32 text-large"
              />
              <p className="modal-description">
                Завантажте нове фото профілю
              </p>
              <Input
                type="file"
                accept="image/*"
                variant="bordered"
                disabled
              />
              <p className="modal-note">
                Функція завантаження фото буде доступна незабаром
              </p>
            </div>
          </ModalBody>
          <ModalFooter className="modal-footer">
            <Button 
              color="default" 
              variant="light" 
              onClick={onClose}
              className="btn-close"
            >
              Закрити
            </Button>
            <Button 
              color="primary" 
              disabled
              className="btn-save"
            >
              Зберегти
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
            <Footer/>
    </>
  );
};