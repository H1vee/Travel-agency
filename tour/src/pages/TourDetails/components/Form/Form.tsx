import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Button,
  Input
} from "@nextui-org/react";
import { useQuery } from '@tanstack/react-query';
import { useParams } from "react-router-dom"; 
import { useState } from "react";

export const Form = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [email, setEmail] = useState("");

  
  const [phone, setPhone] = useState("+380");
  const [phoneError, setPhoneError] = useState("");

  const [seats, setSeats] = useState("1");
  const [seatsError, setSeatsError] = useState("");
  const { id } = useParams(); 
  console.log("Tour ID from URL:", id);
  const { isPending, error, data } = useQuery({
    queryKey: ["tourSeats", id], 
    queryFn: async () => {
      const fetched = await fetch(`/api/tour-seats/${id}`);
      if (!fetched.ok) throw new Error("Tour not found");
      const rawTour: any = await fetched.json();
      console.log("Raw tour data:", rawTour);
      return {
        ...rawTour
      };
    },
    enabled: !!id, 
  });

  if (isPending) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data) return <p>Tour not found</p>;

  const handleEmailChange = (e:React.ChangeEvent<HTMLInputElement>)=>{
    setEmail(e.target.value)
  }


  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/^[a-zA-Zа-яА-ЯіІєЄґҐїЇ'’ ]*$/.test(value)) {
      setNameError("Ім'я може містити тільки літери та пробіли");
    } else {
      setNameError("");
    }
    setName(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith("+380")) {
      value = "+380";
    }

    const digitsOnly = value.replace(/\D/g, "").slice(3); 
    const formattedPhone = "+380" + digitsOnly.slice(0, 9); 

    if (digitsOnly.length < 9) {
      setPhoneError("Номер повинен містити 9 цифр після +380");
    } else {
      setPhoneError("");
    }

    setPhone(formattedPhone);
  };

  const handleSeatsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); 
    const intSeats = parseInt(value, 10) || 1;
    const maxSeats = data?.[0]?.available_seats ?? 1;
    console.log("Max seats:", maxSeats);
    if (intSeats < 1) {
      setSeatsError("Мінімальна кількість місць — 1");
    } else if (intSeats > maxSeats) {
      setSeatsError(`Максимальна кількість місць — ${maxSeats}`);
    } else {
      setSeatsError("");
    }
    console.log("Seats input value:", value, "Parsed intSeats:", intSeats);
    setSeats(intSeats.toString());
  };

  const resetForm = () => {
    setName("");
    setNameError("");
    setPhone("+380");
    setPhoneError("");
    setSeats("1");
    setSeatsError("");
    console.log("Resetting form");
  };


 

  const handleConfirm = async () => {

    const bookingData = {
      tour_date_id: Number(id), 
      customer_name: name.trim(),
      customer_email: email.trim(),  
      customer_phone: phone.trim(),
      seats: parseInt(seats, 10),
      total_price: Number(data?.[0]?.price ? (data[0].price * parseInt(seats, 10)).toFixed(2) : 0),
    };
    
    console.log("BookingData being sent:", bookingData);

    try {
      console.log("BookingData being sent:", bookingData);
      console.log(JSON.stringify(bookingData))
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
  
      const result = await response.json();
      alert(result.message || "Booking successful");
      resetForm();
    } catch (error) {
      console.error("Booking error:", error);
      alert("Помилка при бронюванні. Спробуйте ще раз.");
    }
  };
  console.log("BookingData being sent:", {
    tour_date_id: id, 
    customer_name: name.trim(),
    customer_email: email.trim(),  
    customer_phone: phone.trim(),
    seats: parseInt(seats, 10),
    total_price: data?.[0]?.price ? (data[0].price * parseInt(seats, 10)).toFixed(2) : 0,
  });
  

  return (
    <div className="Form">
      <div className="Form-Button">
        <Button color="primary" variant="shadow" onPress={onOpen}>
          Придбати
        </Button>
        <Modal isOpen={isOpen} placement="top-center" onOpenChange={(open) => {
          if (!open) resetForm(); 
          onOpenChange();
        }}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Замовлення</ModalHeader>
                <ModalBody>
                  <Input 
                    isRequired 
                    placeholder="Ваше ім'я" 
                    label="Ім'я" 
                    value={name}
                    onChange={handleNameChange}
                    isInvalid={!!nameError}
                    errorMessage={nameError}
                  />
                  <Input
                    isRequired
                    label="Номер телефону"
                    value={phone}
                    onChange={handlePhoneChange}
                    isInvalid={!!phoneError}
                    errorMessage={phoneError}
                  />
                  <Input 
                  label="Email" 
                  placeholder="Enter your email" 
                  variant="bordered" 
                  value={email}
                  onChange={handleEmailChange}
                  />
                  <Input
                    isRequired
                    label="Кількість місць"
                    value={seats}
                    onChange={handleSeatsChange}
                    isInvalid={!!seatsError}
                    errorMessage={seatsError}
                  />
                  <p>Вартість: {data?.[0]?.price ? `${(data[0].price * parseInt(seats, 10)).toFixed(2)} UAH` : "N/A"}</p>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    Відмінити
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={handleConfirm} 
                    isDisabled={!name.trim() || !phone.trim() || !seats.trim() || !!nameError || !!phoneError || !!seatsError || parseInt(seats, 10) < 1}
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
