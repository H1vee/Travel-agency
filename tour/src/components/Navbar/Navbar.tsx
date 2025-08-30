import './Navbar.scss'
import {
  Navbar as NextNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  User,
  Badge,
  Tooltip,
} from "@heroui/react";
import { Logo } from "../Logo/Logo";
import { AuthModals } from "../Auth/AuthModals";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import { 
  HeartIcon, 
  UserIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/outline';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleLogin = () => {
    setIsLoginOpen(true);
  };

  const handleRegister = () => {
    setIsRegisterOpen(true);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const switchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const switchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const getAvatarUrl = (user: any) => {
    if (user?.avatar_url) return user.avatar_url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=2c7be5&color=fff&size=128`;
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
    setIsMenuOpen(false);
  };

  const renderUserSection = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          <div className="hidden md:block w-20 h-4 bg-gray-200 animate-pulse rounded" />
        </div>
      );
    }

    if (isAuthenticated && user) {
      return (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <div className="navbar-user-trigger">
              <User
                as="button"
                avatarProps={{
                  isBordered: true,
                  src: getAvatarUrl(user),
                  size: "sm",
                  color: "primary",
                  showFallback: true,
                }}
                className="navbar-user-info transition-transform hover:scale-105"
                description={
                  <div className="flex items-center gap-1">
                    <span>{user.email}</span>
                    {user.is_verified && (
                      <Badge color="success" variant="flat" size="sm">
                        ✓
                      </Badge>
                    )}
                  </div>
                }
                name={user.name}
              />
            </div>
          </DropdownTrigger>
          <DropdownMenu 
            aria-label="User Actions" 
            variant="flat" 
            className="w-56"
            onAction={(key) => {
              if (key === 'profile') handleNavigation('/profile');
              else if (key === 'bookings') handleNavigation('/bookings');
              else if (key === 'favorites') handleNavigation('/favorites');
              else if (key === 'settings') handleNavigation('/settings');
              else if (key === 'logout') handleLogout();
            }}
          >
            <DropdownItem
              key="profile"
              className="navbar-dropdown-item"
              startContent={<UserIcon className="w-4 h-4" />}
              description="Переглянути та редагувати профіль"
            >
              <span className="font-medium">Мій профіль</span>
            </DropdownItem>
            <DropdownItem
              key="bookings"
              className="navbar-dropdown-item"
              startContent={<CalendarDaysIcon className="w-4 h-4" />}
              description="Переглянути мої бронювання"
            >
              <span className="font-medium">Мої бронювання</span>
            </DropdownItem>
            <DropdownItem
              key="favorites"
              className="navbar-dropdown-item"
              startContent={<HeartIcon className="w-4 h-4" />}
              description="Обрані тури та місця"
            >
              <span className="font-medium">Обране</span>
            </DropdownItem>
            <DropdownItem
              key="settings"
              className="navbar-dropdown-item"
              startContent={<Cog6ToothIcon className="w-4 h-4" />}
              description="Налаштування акаунту"
            >
              <span className="font-medium">Налаштування</span>
            </DropdownItem>
            <DropdownItem
              key="logout"
              className="navbar-dropdown-item navbar-logout"
              color="danger"
              startContent={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
            >
              <span className="font-medium">Вийти</span>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      );
    }

    return (
      <div className="navbar-auth-buttons">
        <Button
          variant="ghost"
          className="navbar-auth-btn navbar-login-btn"
          onClick={handleLogin}
          size="sm"
        >
          Увійти
        </Button>
        <Button
          color="primary"
          className="navbar-auth-btn navbar-register-btn"
          onClick={handleRegister}
          size="sm"
          variant="shadow"
        >
          Реєстрація
        </Button>
      </div>
    );
  };

  const renderMobileUserSection = () => {
    if (isAuthenticated && user) {
      return (
        <>
          <NavbarMenuItem>
            <div className="navbar-mobile-user-info">
              <Avatar
                src={getAvatarUrl(user)}
                size="md"
                className="navbar-mobile-avatar"
                showFallback
              />
              <div className="navbar-mobile-user-details">
                <div className="flex items-center gap-2">
                  <span className="navbar-mobile-user-name">{user.name}</span>
                  {user.is_verified && (
                    <Badge color="success" variant="flat" size="sm">
                      ✓
                    </Badge>
                  )}
                </div>
                <span className="navbar-mobile-user-email">{user.email}</span>
              </div>
            </div>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <div 
              className="navbar-mobile-link flex items-center gap-2 cursor-pointer" 
              onClick={() => handleNavigation('/profile')}
            >
              <UserIcon className="w-5 h-5" />
              Мій профіль
            </div>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <div 
              className="navbar-mobile-link flex items-center gap-2 cursor-pointer"
              onClick={() => handleNavigation('/bookings')}
            >
              <CalendarDaysIcon className="w-5 h-5" />
              Мої бронювання
            </div>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <div 
              className="navbar-mobile-link flex items-center gap-2 cursor-pointer"
              onClick={() => handleNavigation('/favorites')}
            >
              <HeartIcon className="w-5 h-5" />
              Обране
            </div>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <div 
              className="navbar-mobile-link flex items-center gap-2 cursor-pointer"
              onClick={() => handleNavigation('/settings')}
            >
              <Cog6ToothIcon className="w-5 h-5" />
              Налаштування
            </div>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Button
              variant="light"
              color="danger"
              className="navbar-mobile-logout-btn"
              onClick={handleLogout}
              startContent={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
              fullWidth
            >
              Вийти
            </Button>
          </NavbarMenuItem>
        </>
      );
    }

    return (
      <>
        <NavbarMenuItem>
          <Button
            variant="ghost"
            className="navbar-mobile-auth-btn"
            onClick={handleLogin}
            fullWidth
          >
            Увійти
          </Button>
        </NavbarMenuItem>
        <NavbarMenuItem>
          <Button
            color="primary"
            className="navbar-mobile-auth-btn"
            onClick={handleRegister}
            variant="shadow"
            fullWidth
          >
            Реєстрація
          </Button>
        </NavbarMenuItem>
      </>
    );
  };

  return (
    <>
      <NextNavbar
        onMenuOpenChange={setIsMenuOpen}
        isMenuOpen={isMenuOpen}
        className="navbar-container backdrop-blur-md bg-white/95"
        maxWidth="xl"
        isBordered={false}
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="navbar-menu-toggle sm:hidden"
          />
          <NavbarBrand className="navbar-brand">
            <Tooltip content="OpenWorld - Ваш гід у світі подорожей" placement="bottom">
              <div className="navbar-logo">
                <Logo />
              </div>
            </Tooltip>
            <span className="navbar-brand-text bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              OpenWorld
            </span>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="navbar-links-container" justify="center">
          <NavbarItem isActive={currentPath === "/"}>
            <Link
              className={`navbar-link ${currentPath === "/" ? "active" : ""}`}
              href="/"
              aria-current={currentPath === "/" ? "page" : undefined}
              size="lg"
            >
              ГОЛОВНА
            </Link>
          </NavbarItem>
          <NavbarItem isActive={currentPath === "/Tours"}>
            <Link
              className={`navbar-link ${currentPath === "/Tours" ? "active" : ""}`}
              href="/Tours"
              aria-current={currentPath === "/Tours" ? "page" : undefined}
              size="lg"
            >
              ПОШУК ТУРІВ
            </Link>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem className="navbar-user-section">
            {renderUserSection()}
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu className="navbar-mobile-menu backdrop-blur-md bg-white/95">
          <NavbarMenuItem>
            <Link
              className={`navbar-mobile-link ${currentPath === "/" ? "active" : ""}`}
              href="/"
              size="lg"
            >
              ГОЛОВНА
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link
              className={`navbar-mobile-link ${currentPath === "/Tours" ? "active" : ""}`}
              href="/Tours"
              size="lg"
            >
              ПОШУК ТУРІВ
            </Link>
          </NavbarMenuItem>
          
          <NavbarMenuItem className="navbar-mobile-divider" />
          
          {renderMobileUserSection()}
        </NavbarMenu>
      </NextNavbar>

      <AuthModals
        isLoginOpen={isLoginOpen}
        isRegisterOpen={isRegisterOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onRegisterClose={() => setIsRegisterOpen(false)}
        onSwitchToRegister={switchToRegister}
        onSwitchToLogin={switchToLogin}
      />
    </>
  );
};