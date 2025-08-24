// tour/src/components/Auth/AuthModals.tsx
import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Link,
  Divider,
} from "@heroui/react";
import { useAuth } from '../../context/AuthContext';

interface AuthModalsProps {
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  onLoginClose: () => void;
  onRegisterClose: () => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
}

export const AuthModals: React.FC<AuthModalsProps> = ({
  isLoginOpen,
  isRegisterOpen,
  onLoginClose,
  onRegisterClose,
  onSwitchToRegister,
  onSwitchToLogin,
}) => {
  const { login, register, isLoading } = useAuth();
  

  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const [loginError, setLoginError] = useState('');

  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [registerError, setRegisterError] = useState('');

  const resetForms = () => {
    setLoginData({ email: '', password: '' });
    setRegisterData({ email: '', password: '', confirmPassword: '', name: '', phone: '' });
    setLoginError('');
    setRegisterError('');
  };

  const handleLoginClose = () => {
    resetForms();
    onLoginClose();
  };

  const handleRegisterClose = () => {
    resetForms();
    onRegisterClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      await login(loginData.email, loginData.password);
      handleLoginClose();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Помилка входу');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (registerData.password !== registerData.confirmPassword) {
      setRegisterError('Паролі не співпадають');
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterError('Пароль має містити принаймні 6 символів');
      return;
    }

    try {
      await register(
        registerData.email,
        registerData.password,
        registerData.name,
        registerData.phone || undefined
      );
      handleRegisterClose();
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Помилка реєстрації');
    }
  };

  const switchToRegister = () => {
    resetForms();
    onSwitchToRegister();
  };

  const switchToLogin = () => {
    resetForms();
    onSwitchToLogin();
  };

  return (
    <>
      <Modal 
        isOpen={isLoginOpen} 
        onClose={handleLoginClose}
        placement="center"
        size="sm"
      >
        <ModalContent>
          <form onSubmit={handleLogin}>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-2xl font-bold text-center">Вхід</h3>
              <p className="text-sm text-gray-500 text-center">Увійдіть у свій акаунт</p>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Input
                  type="email"
                  label="Email"
                  placeholder="Введіть ваш email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  isRequired
                  variant="bordered"
                />
                <Input
                  type="password"
                  label="Пароль"
                  placeholder="Введіть ваш пароль"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  isRequired
                  variant="bordered"
                />
                {loginError && (
                  <p className="text-red-500 text-sm text-center">{loginError}</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full font-semibold"
                isLoading={isLoading}
                isDisabled={!loginData.email || !loginData.password}
              >
                {isLoading ? 'Вхід...' : 'Увійти'}
              </Button>
              <Divider className="my-2" />
              <div className="text-center">
                <span className="text-sm text-gray-500">Немає акаунту? </span>
                <Link
                  size="sm"
                  className="cursor-pointer font-semibold"
                  onClick={switchToRegister}
                >
                  Зареєструватися
                </Link>
              </div>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <Modal 
        isOpen={isRegisterOpen} 
        onClose={handleRegisterClose}
        placement="center"
        size="sm"
        scrollBehavior="inside"
      >
        <ModalContent>
          <form onSubmit={handleRegister}>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-2xl font-bold text-center">Реєстрація</h3>
              <p className="text-sm text-gray-500 text-center">Створіть новий акаунт</p>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Input
                  type="text"
                  label="Ім'я"
                  placeholder="Введіть ваше ім'я"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  isRequired
                  variant="bordered"
                />
                <Input
                  type="email"
                  label="Email"
                  placeholder="Введіть ваш email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  isRequired
                  variant="bordered"
                />
                <Input
                  type="tel"
                  label="Телефон"
                  placeholder="Введіть ваш телефон (необов'язково)"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  variant="bordered"
                />
                <Input
                  type="password"
                  label="Пароль"
                  placeholder="Введіть пароль (мінімум 6 символів)"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  isRequired
                  variant="bordered"
                />
                <Input
                  type="password"
                  label="Підтвердження пароля"
                  placeholder="Повторіть пароль"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  isRequired
                  variant="bordered"
                />
                {registerError && (
                  <p className="text-red-500 text-sm text-center">{registerError}</p>
                )}
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2">
              <Button
                type="submit"
                color="primary"
                size="lg"
                className="w-full font-semibold"
                isLoading={isLoading}
                isDisabled={!registerData.email || !registerData.password || !registerData.name}
              >
                {isLoading ? 'Реєстрація...' : 'Зареєструватися'}
              </Button>
              <Divider className="my-2" />
              <div className="text-center">
                <span className="text-sm text-gray-500">Вже є акаунт? </span>
                <Link
                  size="sm"
                  className="cursor-pointer font-semibold"
                  onClick={switchToLogin}
                >
                  Увійти
                </Link>
              </div>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};