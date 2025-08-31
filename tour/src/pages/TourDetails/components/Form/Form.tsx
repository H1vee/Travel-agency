import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  Input,
  Chip,
  Card,
  CardBody,
  Divider,
  Spinner,
  Avatar,
  Tooltip,
} from "@heroui/react";
import { addToast, ToastProvider } from "@heroui/react";
import { useQuery } from '@tanstack/react-query';
import { useParams } from "react-router-dom";
import { useState, ChangeEvent, useEffect } from "react";
import { useAuth } from '../../../../context/AuthContext'; 
import { 
  User, 
  Mail, 
  Phone, 
  Users, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import "./Form.scss";

interface FormDataType {
  name: string;
  email: string;
  phone: string;
  seats: string;
}

interface FormErrorsType {
  name: string;
  email: string;
  phone: string;
  seats: string;
}

interface TourData {
  available_seats: number;
  price: number;
  [key: string]: any; 
}

export const Form = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    phone: "+380",
    seats: "1"
  });
  
  const [formErrors, setFormErrors] = useState<FormErrorsType>({
    name: "",
    email: "",
    phone: "",
    seats: ""
  });

  // Update form with user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user && isOpen) {
      setFormData(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "+380",
      }));
    }
  }, [isAuthenticated, user, isOpen]);

  const { isPending, error, data: tourData } = useQuery({
    queryKey: ["tourSeats", id],
    queryFn: async () => {
      const response = await fetch(`http://127.0.0.1:1323/tour-seats/${id}`);
      if (!response.ok) throw new Error("Tour not found");
      const data = await response.json();
      return data as TourData[];
    },
    enabled: !!id,
  });

  const availableSeats = tourData?.[0]?.available_seats ?? 1;
  const tourPrice = tourData?.[0]?.price ?? 0;
  const totalPrice = tourPrice * parseInt(formData.seats || "1", 10);
  const pricePerSeat = tourPrice;

  const updateFormData = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateName = (name: string): string => {
    if (!name.trim()) return "Ім'я є обов'язковим";
    if (name.trim().length < 2) return "Ім'я повинно містити принаймні 2 символи";
    if (!/^[a-zA-Zа-яА-ЯіІєЄґҐїЇ'' -]*$/.test(name)) return "Ім'я може містити тільки літери, пробіли та дефіси";
    return "";
  };

  const validateEmail = (email: string): string => {
    if (!email.trim()) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Некоректний формат email";
    return "";
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return "Номер телефону є обов'язковим";
    if (!phone.startsWith("+380")) return "Номер повинен починатися з +380";
    const digitsOnly = phone.replace(/\D/g, "").slice(3);
    if (digitsOnly.length !== 9) return "Номер повинен містити 9 цифр після +380";
    return "";
  };

  const validateSeats = (seats: string): string => {
    const intSeats = parseInt(seats, 10);
    if (!seats.trim() || isNaN(intSeats)) return "Кількість місць є обов'язковою";
    if (intSeats < 1) return "Мінімальна кількість місць — 1";
    if (intSeats > availableSeats) return `Максимальна кількість місць — ${availableSeats}`;
    return "";
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormErrors(prev => ({ ...prev, name: validateName(value) }));
    updateFormData("name", value);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormErrors(prev => ({ ...prev, email: validateEmail(value) }));
    updateFormData("email", value);
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure it starts with +380
    if (!value.startsWith("+380")) {
      value = "+380";
    }

    // Format the phone number
    const digitsOnly = value.replace(/\D/g, "").slice(3);
    const formattedPhone = "+380" + digitsOnly.slice(0, 9);
    
    setFormErrors(prev => ({ ...prev, phone: validatePhone(formattedPhone) }));
    updateFormData("phone", formattedPhone);
  };

  const handleSeatsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const intSeats = parseInt(value, 10) || 1;
    
    setFormErrors(prev => ({ ...prev, seats: validateSeats(intSeats.toString()) }));
    updateFormData("seats", intSeats.toString());
  };

  const resetForm = () => {
    setFormData({
      name: isAuthenticated ? user?.name || "" : "",
      email: isAuthenticated ? user?.email || "" : "",
      phone: isAuthenticated ? user?.phone || "+380" : "+380",
      seats: "1"
    });
    setFormErrors({ name: "", email: "", phone: "", seats: "" });
  };

  const handleConfirm = async (onClose: () => void) => {
    // Final validation
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.phone);
    const seatsError = validateSeats(formData.seats);

    setFormErrors({
      name: nameError,
      email: emailError,
      phone: phoneError,
      seats: seatsError,
    });

    if (nameError || phoneError || seatsError) {
      addToast({
        title: "Помилка валідації",
        description: "Будь ласка, виправте помилки в формі",
        color: "danger",
      });
      return;
    }

    setIsSubmitting(true);

    const bookingData = {
      tour_date_id: Number(id),
      customer_name: formData.name.trim(),
      customer_email: formData.email.trim(),
      customer_phone: formData.phone.trim(),
      seats: parseInt(formData.seats, 10),
      total_price: Number(totalPrice.toFixed(2)),
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      const token = localStorage.getItem('tour_auth_token');
      if (token && isAuthenticated) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch("http://127.0.0.1:1323/tour/bookings", {
        method: "POST",
        headers,
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Booking failed");
      }

      const result = await response.json();

      addToast({
        title: "🎉 Бронювання підтверджено!",
        description: isAuthenticated 
          ? "Ваше замовлення збережено в особистому кабінеті" 
          : "Ваше замовлення прийнято. Менеджер зв'яжеться з вами найближчим часом",
        color: "success",
        variant: "solid",
      });
      
      console.log("Booking result:", result);
      onClose();
      resetForm();

    } catch (error) {
      console.error("Booking error:", error);
      
      addToast({
        title: "❌ Бронювання не вдалося",
        description: error instanceof Error ? error.message : "Виникла проблема з вашим бронюванням",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = (): boolean => {
    const { name, phone, seats } = formData;
    const hasErrors = Object.values(formErrors).some(error => !!error);
    const hasRequiredFields = !!(name.trim() && phone.trim() && seats.trim()); 
    return hasRequiredFields && !hasErrors && parseInt(seats, 10) >= 1;
  };

  const getAvatarUrl = (user: any) => {
    if (user?.avatar_url) return user.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=2c7be5&color=fff&size=128`;
  };

  if (isPending) return (
    <div className="booking-form__loading">
      <Spinner size="lg" />
      <p>Завантаження даних туру...</p>
    </div>
  );
  
  if (error) return (
    <div className="booking-form__error">
      <AlertCircle size={48} />
      <p>Помилка: {(error as Error).message}</p>
    </div>
  );
  
  if (!tourData) return (
    <div className="booking-form__not-found">
      <AlertCircle size={48} />
      <p>Тур не знайдено</p>
    </div>
  );

  return (
    <div className="booking-form">
      <ToastProvider placement="top-center" />
      
      <div className="booking-form__button-container">
        <Button 
          color="primary" 
          variant="shadow" 
          onPress={onOpen} 
          className="booking-form__purchase-button"
          size="lg"
          startContent={<CreditCard size={20} />}
        >
          {isAuthenticated ? "Забронювати тур" : "Забронювати як гість"}
        </Button>
        
        <Modal 
          isOpen={isOpen} 
          placement="center"
          size="2xl"
          scrollBehavior="inside"
          classNames={{
            wrapper: "booking-modal-wrapper",
            base: "booking-modal-base",
            backdrop: "booking-modal-backdrop"
          }}
          onOpenChange={(open: boolean) => {
            if (!open) resetForm();
            onOpenChange();
          }}
        >
          <ModalContent>
            {(onClose: () => void) => (
              <>
                <ModalHeader className="booking-form__modal-header">
                  <div className="booking-form__header-content">
                    <div className="booking-form__header-main">
                      <h2 className="booking-form__title">
                        {isAuthenticated ? "Бронювання туру" : "Гостьове бронювання"}
                      </h2>
                      
                      {isAuthenticated ? (
                        <div className="booking-form__auth-status">
                          <Chip 
                            color="success" 
                            variant="flat" 
                            size="sm"
                            startContent={<CheckCircle size={14} />}
                          >
                            Авторизований
                          </Chip>
                        </div>
                      ) : (
                        <div className="booking-form__guest-notice">
                          <Chip 
                            color="warning" 
                            variant="flat" 
                            size="sm"
                            startContent={<AlertCircle size={14} />}
                          >
                            Гостьове бронювання
                          </Chip>
                        </div>
                      )}
                    </div>
                    
                    {isAuthenticated && user && (
                      <div className="booking-form__user-info">
                        <Avatar
                          src={getAvatarUrl(user)}
                          name={user.name}
                          size="sm"
                          className="booking-form__user-avatar"
                        />
                        <div className="booking-form__user-details">
                          <span className="booking-form__user-name" style={{
                            color: '#1e293b',
                            fontWeight: '700',
                            fontSize: '1rem',
                            lineHeight: '1.4'
                          }}>
                            {user.name}
                          </span>
                          <span className="booking-form__user-email" style={{
                            color: '#64748b',
                            fontWeight: '500',
                            fontSize: '0.875rem',
                            lineHeight: '1.3'
                          }}>
                            {user.email}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {!isAuthenticated && (
                      <p className="booking-form__guest-description">
                        💡 Увійдіть у акаунт, щоб автоматично заповнити дані та відстежувати бронювання
                      </p>
                    )}
                  </div>
                </ModalHeader>
                
                <Divider />
                
                <ModalBody className="booking-form__modal-body">
                  {/* Booking Summary Card */}
                  <Card className="booking-form__summary-card">
                    <CardBody>
                      <div className="booking-form__summary-header">
                        <h3>Деталі бронювання</h3>
                        <div className="booking-form__summary-stats">
                          <div className="booking-form__stat">
                            <Users size={16} />
                            <span>{availableSeats} вільних місць</span>
                          </div>
                          <div className="booking-form__stat">
                            <CreditCard size={16} />
                            <span>{pricePerSeat.toFixed(2)} UAH/особа</span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* Form Fields */}
                  <div className="booking-form__fields">
                    <div className="booking-form__field-group">
                      <h4 className="booking-form__section-title">
                        <User size={18} />
                        Контактна інформація
                      </h4>
                      
                      <Input 
                        isRequired 
                        placeholder="Введіть ваше повне ім'я" 
                        label="Повне ім'я" 
                        value={formData.name}
                        onChange={handleNameChange}
                        isInvalid={!!formErrors.name}  
                        errorMessage={formErrors.name}
                        className="booking-form__input"
                        variant="bordered"
                        startContent={<User size={18} className="text-default-400" />}
                      />
                      
                      <Input
                        isRequired
                        label="Номер телефону"
                        placeholder="+380XXXXXXXXX"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        isInvalid={!!formErrors.phone}  
                        errorMessage={formErrors.phone}
                        className="booking-form__input"
                        variant="bordered"
                        startContent={<Phone size={18} className="text-default-400" />}
                      />
                      
                      <Input 
                        label="Email (необов'язково)" 
                        placeholder="example@email.com" 
                        variant="bordered" 
                        value={formData.email}
                        onChange={handleEmailChange}
                        isInvalid={!!formErrors.email}
                        errorMessage={formErrors.email}
                        className="booking-form__input"
                        startContent={<Mail size={18} className="text-default-400" />}
                      />
                    </div>
                    
                    <Divider className="booking-form__section-divider" />
                    
                    <div className="booking-form__field-group">
                      <h4 className="booking-form__section-title">
                        <Users size={18} />
                        Деталі бронювання
                      </h4>
                      
                      <Input
                        isRequired
                        label="Кількість місць"
                        placeholder="1"
                        value={formData.seats}
                        onChange={handleSeatsChange}
                        isInvalid={!!formErrors.seats}  
                        errorMessage={formErrors.seats}
                        className="booking-form__input"
                        variant="bordered"
                        startContent={<Users size={18} className="text-default-400" />}
                        description={`Доступно ${availableSeats} місць`}
                      />
                    </div>
                  </div>
                  
                  {/* Price Summary */}
                  <Card className="booking-form__price-card">
                    <CardBody>
                      <div className="booking-form__price-breakdown">
                        <div className="booking-form__price-row">
                          <span>Ціна за 1 місце:</span>
                          <span>{pricePerSeat.toFixed(2)} UAH</span>
                        </div>
                        <div className="booking-form__price-row">
                          <span>Кількість місць:</span>
                          <span>× {formData.seats}</span>
                        </div>
                        <Divider className="my-2" />
                        <div className="booking-form__price-row booking-form__price-total">
                          <span>Загальна сума:</span>
                          <span className="booking-form__total-amount">
                            {totalPrice.toFixed(2)} UAH
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </ModalBody>
                
                <Divider />
                
                <ModalFooter className="booking-form__modal-footer">
                  <Button 
                    color="danger" 
                    variant="light" 
                    onPress={onClose}
                    className="booking-form__cancel-button"
                    isDisabled={isSubmitting}
                  >
                    Скасувати
                  </Button>
                  
                  <Button 
                    color="primary" 
                    onPress={() => handleConfirm(onClose)}
                    isDisabled={!isFormValid() || isSubmitting}
                    isLoading={isSubmitting}
                    className="booking-form__confirm-button"
                    variant="shadow"
                    size="lg"
                    startContent={!isSubmitting && <CheckCircle size={18} />}
                  >
                    {isSubmitting ? "Обробка..." : "Підтвердити бронювання"}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};