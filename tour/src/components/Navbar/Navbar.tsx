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
} from "@heroui/react";
import { Logo } from "../Logo/Logo";
import { useState } from "react";

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("/");
  
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentPath = window.location.pathname;

  const handleLogin = () => {
    console.log("Открыть модальное окно входа");
  };

  const handleRegister = () => {
    console.log("Открыть модальное окно регистрации");
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      console.log("Выход из системы");
      setUser(null);
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileClick = () => {
    console.log("Переход в профиль");
  };

  const toggleUserState = () => {
    if (user) {
      setUser(null);
    } else {
      setUser({
        id: "1",
        name: "Іван Петренко",
        email: "ivan@example.com",
        avatar: "https://i.pravatar.cc/150?u=ivan@example.com"
      });
    }
  };

  const renderUserSection = () => {
    if (user) {
      return (
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <div className="navbar-user-trigger">
              <User
                as="button"
                avatarProps={{
                  isBordered: true,
                  src: user.avatar,
                  size: "sm",
                  color: "primary"
                }}
                className="navbar-user-info"
                description={user.email}
                name={user.name}
              />
            </div>
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions" variant="flat">
            <DropdownItem
              key="profile"
              className="navbar-dropdown-item"
              onClick={handleProfileClick}
            >
              <div className="navbar-dropdown-content">
                <span>Мій профіль</span>
              </div>
            </DropdownItem>
            <DropdownItem
              key="bookings"
              className="navbar-dropdown-item"
            >
              <div className="navbar-dropdown-content">
                <span>Мої бронювання</span>
              </div>
            </DropdownItem>
            <DropdownItem
              key="favorites"
              className="navbar-dropdown-item"
            >
              <div className="navbar-dropdown-content">
                <span>Обране</span>
              </div>
            </DropdownItem>
            <DropdownItem
              key="settings"
              className="navbar-dropdown-item"
            >
              <div className="navbar-dropdown-content">
                <span>Налаштування</span>
              </div>
            </DropdownItem>
            <DropdownItem
              key="logout"
              className="navbar-dropdown-item navbar-logout"
              color="danger"
              onClick={handleLogout}
            >
              <div className="navbar-dropdown-content">
                <span>{isLoading ? "Вихід..." : "Вийти"}</span>
              </div>
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      );
    }

    return (
      <div className="navbar-auth-buttons">
        <Button
          variant="light"
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
        >
          Реєстрація
        </Button>
      </div>
    );
  };

  const renderMobileUserSection = () => {
    if (user) {
      return (
        <>
          <NavbarMenuItem>
            <div className="navbar-mobile-user-info">
              <Avatar
                src={user.avatar}
                size="sm"
                className="navbar-mobile-avatar"
              />
              <div className="navbar-mobile-user-details">
                <span className="navbar-mobile-user-name">{user.name}</span>
                <span className="navbar-mobile-user-email">{user.email}</span>
              </div>
            </div>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="navbar-mobile-link" href="/profile" size="lg">
              Мій профіль
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="navbar-mobile-link" href="/bookings" size="lg">
              Мої бронювання
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="navbar-mobile-link" href="/favorites" size="lg">
              Обране
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Link className="navbar-mobile-link" href="/settings" size="lg">
              Налаштування
            </Link>
          </NavbarMenuItem>
          <NavbarMenuItem>
            <Button
              variant="light"
              color="danger"
              className="navbar-mobile-logout-btn"
              onClick={handleLogout}
              isLoading={isLoading}
              fullWidth
            >
              {isLoading ? "Вихід..." : "Вийти"}
            </Button>
          </NavbarMenuItem>
        </>
      );
    }

    return (
      <>
        <NavbarMenuItem>
          <Button
            variant="light"
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
            fullWidth
          >
            Реєстрація
          </Button>
        </NavbarMenuItem>
      </>
    );
  };

  return (
    <NextNavbar
      onMenuOpenChange={setIsMenuOpen}
      isMenuOpen={isMenuOpen}
      className="navbar-container"
      maxWidth="xl"
      isBordered
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="navbar-menu-toggle sm:hidden"
        />
        <NavbarBrand className="navbar-brand">
          <div className="navbar-logo">
            <Logo />
          </div>
          <span className="navbar-brand-text">OpenWorld</span>
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
        <NavbarItem>
          <Button
            size="sm"
            variant="bordered"
            onClick={toggleUserState}
            className="navbar-demo-btn"
          >
            {user ? "Демо: Выйти" : "Демо: Войти"}
          </Button>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu className="navbar-mobile-menu">
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
  );
};