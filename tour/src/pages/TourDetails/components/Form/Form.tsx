import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  Input,
} from "@heroui/react";
import { addToast, ToastProvider } from "@heroui/react";
import { useQuery } from '@tanstack/react-query';
import { useParams } from "react-router-dom";
import { useState, ChangeEvent } from "react";
import "./Form.scss";


interface FormDataType {
  name: string;
  email: string;
  phone: string;
  seats: string;
}


interface FormErrorsType {
  name: string;
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
  
  // Form state
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    phone: "+380",
    seats: "1"
  });
  

  const [formErrors, setFormErrors] = useState<FormErrorsType>({
    name: "",
    phone: "",
    seats: ""
  });

  const { isPending, error, data: tourData } = useQuery({
    queryKey: ["tourSeats", id],
    queryFn: async () => {
      const response = await fetch(`/api/tour-seats/${id}`);
      if (!response.ok) throw new Error("Tour not found");
      const data = await response.json();
      return data as TourData[];
    },
    enabled: !!id,
  });


  const availableSeats = tourData?.[0]?.available_seats ?? 1;
  const tourPrice = tourData?.[0]?.price ?? 0;
  

  const totalPrice = tourPrice * parseInt(formData.seats || "1", 10);

  const updateFormData = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const hasError = !/^[a-zA-Zа-яА-ЯіІєЄґҐїЇ'' ]*$/.test(value);
    
    setFormErrors(prev => ({
      ...prev,
      name: hasError ? "Ім'я може містити тільки літери та пробіли" : ""
    }));
    
    updateFormData("name", value);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateFormData("email", e.target.value);
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith("+380")) {
      value = "+380";
    }

    const digitsOnly = value.replace(/\D/g, "").slice(3);
    const formattedPhone = "+380" + digitsOnly.slice(0, 9);
    const hasError = digitsOnly.length < 9;

    setFormErrors(prev => ({
      ...prev,
      phone: hasError ? "Номер повинен містити 9 цифр після +380" : ""
    }));

    updateFormData("phone", formattedPhone);
  };

  const handleSeatsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const intSeats = parseInt(value, 10) || 1;
    let seatsError = "";

    if (intSeats < 1) {
      seatsError = "Мінімальна кількість місць — 1";
    } else if (intSeats > availableSeats) {
      seatsError = `Максимальна кількість місць — ${availableSeats}`;
    }

    setFormErrors(prev => ({
      ...prev,
      seats: seatsError
    }));

    updateFormData("seats", intSeats.toString());
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "+380",
      seats: "1"
    });
    
    setFormErrors({
      name: "",
      phone: "",
      seats: ""
    });
  };


  const handleConfirm = async (onClose: () => void) => {
    const bookingData = {
      tour_date_id: Number(id),
      customer_name: formData.name.trim(),
      customer_email: formData.email.trim(),
      customer_phone: formData.phone.trim(),
      seats: parseInt(formData.seats, 10),
      total_price: Number(totalPrice.toFixed(2)),
    };

    try {
      const response = await fetch("http://127.0.0.1:1323/tour/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      addToast({
        title: "Бронювання підтверджено",
        description: "Ваше замовлення було підтверджено",
        color: "success",
        variant: "solid",
      });
      
      onClose();
      resetForm();
    } catch (error) {
      console.error("Booking error:", error);
      
      addToast({
        title: "Бронювання не вдалося",
        description: "Виникла проблема з вашим бронюванням. Будь ласка, спробуйте ще раз.",
        color: "danger",
      });
    }
  };

  const isFormValid = (): boolean => {
    const { name, phone, seats } = formData;
    const hasErrors = Object.values(formErrors).some(error => !!error);
    const hasRequiredFields = !!(name.trim() && phone.trim() && seats.trim()); 
    
    return hasRequiredFields && !hasErrors && parseInt(seats, 10) >= 1;
  };
  

  if (isPending) return <div className="booking-form__loading">Loading...</div>;
  if (error) return <div className="booking-form__error">Error: {(error as Error).message}</div>;
  if (!tourData) return <div className="booking-form__not-found">Tour not found</div>;

  return (
    <div className="booking-form">
      <ToastProvider placement="top-center" />
      
      <div className="booking-form__button-container">
        <Button color="primary" variant="shadow" onPress={onOpen} className="booking-form__purchase-button">
          Придбати
        </Button>
        
        <Modal 
          isOpen={isOpen} 
          placement="top-center" 
          onOpenChange={(open: boolean) => {
            if (!open) resetForm();
            onOpenChange();
          }}
        >
          <ModalContent>
            {(onClose: () => void) => (
              <>
                <ModalHeader className="booking-form__modal-header">
                  Замовлення
                </ModalHeader>
                
                <ModalBody className="booking-form__modal-body">
                  <Input 
                    isRequired 
                    placeholder="Ваше ім'я" 
                    label="Ім'я" 
                    value={formData.name}
                    onChange={handleNameChange}
                    isInvalid={!!formErrors.name}  
                    errorMessage={formErrors.name}
                    className="booking-form__input"
                  />
                  
                  <Input
                    isRequired
                    label="Номер телефону"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    isInvalid={!!formErrors.phone}  
                    errorMessage={formErrors.phone}
                    className="booking-form__input"
                  />
                  
                  <Input 
                    label="Email" 
                    placeholder="Enter your email" 
                    variant="bordered" 
                    value={formData.email}
                    onChange={handleEmailChange}
                    className="booking-form__input"
                  />
                  
                  <Input
                    isRequired
                    label="Кількість місць"
                    value={formData.seats}
                    onChange={handleSeatsChange}
                    isInvalid={!!formErrors.seats}  
                    errorMessage={formErrors.seats}
                    className="booking-form__input"
                  />
                  
                  <div className="booking-form__price-summary">
                    <span className="booking-form__price-label">Вартість:</span>
                    <span className="booking-form__price-value">
                      {totalPrice.toFixed(2)} UAH
                    </span>
                  </div>
                </ModalBody>
                
                <ModalFooter className="booking-form__modal-footer">
                  <Button 
                    color="danger" 
                    variant="flat" 
                    onPress={onClose}
                    className="booking-form__cancel-button"
                  >
                    Відмінити
                  </Button>
                  
                  <Button 
                    color="primary" 
                    onPress={() => handleConfirm(onClose)}
                    isDisabled={!isFormValid()}
                    className="booking-form__confirm-button"
                  >
                    Підтвердити
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
