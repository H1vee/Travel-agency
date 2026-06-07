import React, { useState } from 'react';
import { carService } from '../../services/CarService';
import { REQUEST_TYPE_LABELS, RequestType } from '../../types/cars';
import './InquiryModal.scss';

interface InquiryModalProps {
  open: boolean;
  onClose: () => void;
  requestType: RequestType;
  carId?: number;
  carLabel?: string;
}

const CONTACT_METHODS = ['Телефон', 'Telegram', 'Viber', 'WhatsApp'];

export const InquiryModal: React.FC<InquiryModalProps> = ({
  open,
  onClose,
  requestType,
  carId,
  carLabel,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState(CONTACT_METHODS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reset = () => {
    setName('');
    setPhone('');
    setContactMethod(CONTACT_METHODS[0]);
    setMessage('');
    setDone(false);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Вкажіть номер телефону');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await carService.createInquiry({
        carId,
        requestType,
        contactMethod,
        phone: phone.trim(),
        name: name.trim() || undefined,
        message: message.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося надіслати заявку');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="inquiry-overlay" onClick={handleClose}>
      <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
        <button className="inquiry-close" onClick={handleClose} aria-label="Закрити">
          ×
        </button>

        {done ? (
          <div className="inquiry-success">
            <div className="inquiry-success__icon">✓</div>
            <h3>Дякуємо за заявку!</h3>
            <p>Ми зв'яжемося з вами найближчим часом.</p>
            <button className="inquiry-btn" onClick={handleClose}>
              Закрити
            </button>
          </div>
        ) : (
          <form className="inquiry-form" onSubmit={handleSubmit}>
            <h3>{REQUEST_TYPE_LABELS[requestType]}</h3>
            {carLabel && <p className="inquiry-car">{carLabel}</p>}

            <label>
              Ім'я
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше ім'я"
              />
            </label>

            <label>
              Як з вами зв'язатися?
              <select value={contactMethod} onChange={(e) => setContactMethod(e.target.value)}>
                {CONTACT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Номер телефону *
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+380 __ ___ __ __"
                required
              />
            </label>

            <label>
              Повідомлення
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Додаткова інформація (необов'язково)"
                rows={3}
              />
            </label>

            {error && <div className="inquiry-error">{error}</div>}

            <button className="inquiry-btn" type="submit" disabled={submitting}>
              {submitting ? 'Надсилаємо…' : 'Надіслати заявку'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
