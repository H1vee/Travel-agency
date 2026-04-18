import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Input, Button, Spinner } from '@heroui/react';
import { Navbar } from '../../components/Navbar/Navbar';
import { Footer } from '../Main/components/Footer/Footer';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import './ResetPassword.scss';

const API = process.env.REACT_APP_API_URL!;

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Введіть email'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Помилка');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="rp">
        <div className="rp__container">
          <Card className="rp__card">
            <CardBody className="rp__card-body">
              {sent ? (
                <div className="rp__success">
                  <div className="rp__success-icon">
                    <CheckCircle size={48} />
                  </div>
                  <h2>Перевірте пошту</h2>
                  <p>
                    Якщо акаунт з адресою <strong>{email}</strong> існує, ми надіслали лист з інструкціями
                    для скидання пароля.
                  </p>
                  <p className="rp__note">Посилання дійсне 1 годину. Перевірте також папку "Спам".</p>
                </div>
              ) : (
                <>
                  <div className="rp__header">
                    <div className="rp__icon"><Lock size={24} /></div>
                    <h2>Забули пароль?</h2>
                    <p>Введіть email, і ми надішлемо посилання для скидання пароля</p>
                  </div>

                  {error && (
                    <div className="rp__error">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <Input
                    label="Email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    variant="bordered"
                    size="lg"
                    isDisabled={loading}
                  />

                  <Button
                    color="primary"
                    size="lg"
                    className="rp__submit"
                    onClick={handleSubmit}
                    isLoading={loading}
                    isDisabled={loading || !email.trim()}
                  >
                    Надіслати посилання
                  </Button>

                  <Button
                    variant="light"
                    size="sm"
                    className="rp__back"
                    onClick={() => window.history.back()}
                    startContent={<ArrowLeft size={14} />}
                  >
                    Назад до входу
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenError('Посилання невірне — відсутній токен');
      return;
    }

    fetch(`${API}/auth/verify-reset-token?token=${token}`)
      .then(async (res) => {
        const d = await res.json();
        if (res.ok && d.valid === 'true') {
          setTokenValid(true);
        } else {
          setTokenError(d.error || 'Посилання невірне або прострочене');
        }
      })
      .catch(() => setTokenError('Помилка перевірки посилання'))
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async () => {
    setError('');
    if (password.length < 6) { setError('Мінімум 6 символів'); return; }
    if (password !== confirmPassword) { setError('Паролі не збігаються'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Помилка');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="rp">
        <div className="rp__container">
          <Card className="rp__card">
            <CardBody className="rp__card-body">
              {verifying ? (
                <div className="rp__verifying">
                  <Spinner size="lg" />
                  <p>Перевірка посилання...</p>
                </div>
              ) : !tokenValid && !success ? (
                <div className="rp__invalid">
                  <AlertCircle size={48} className="rp__invalid-icon" />
                  <h2>Посилання недійсне</h2>
                  <p>{tokenError}</p>
                  <Button
                    color="primary"
                    onClick={() => navigate('/forgot-password')}
                  >
                    Запросити нове посилання
                  </Button>
                </div>
              ) : success ? (
                <div className="rp__success">
                  <div className="rp__success-icon">
                    <CheckCircle size={48} />
                  </div>
                  <h2>Пароль змінено!</h2>
                  <p>Тепер ви можете увійти з новим паролем.</p>
                  <Button
                    color="primary"
                    size="lg"
                    className="rp__submit"
                    onClick={() => navigate('/')}
                  >
                    Увійти
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rp__header">
                    <div className="rp__icon"><Lock size={24} /></div>
                    <h2>Новий пароль</h2>
                    <p>Введіть новий пароль для вашого акаунту</p>
                  </div>

                  {error && (
                    <div className="rp__error">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}

                  <Input
                    label="Новий пароль"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Мінімум 6 символів"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="bordered"
                    size="lg"
                    isDisabled={loading}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    }
                  />

                  <Input
                    label="Підтвердіть пароль"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Повторіть новий пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    variant="bordered"
                    size="lg"
                    isDisabled={loading}
                    isInvalid={confirmPassword.length > 0 && password !== confirmPassword}
                    errorMessage={confirmPassword.length > 0 && password !== confirmPassword ? 'Паролі не збігаються' : ''}
                  />

                  <Button
                    color="primary"
                    size="lg"
                    className="rp__submit"
                    onClick={handleSubmit}
                    isLoading={loading}
                    isDisabled={loading || password.length < 6 || password !== confirmPassword}
                  >
                    Зберегти новий пароль
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};
