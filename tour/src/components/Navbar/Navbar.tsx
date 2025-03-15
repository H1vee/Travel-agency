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
} from "@heroui/react";
import { Logo } from "../Logo/Logo";
import { useState } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("/");
  
  const currentPath = window.location.pathname;

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
      <NavbarContent className="navbar-links-container" justify="end">
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
      </NavbarMenu>
    </NextNavbar>
  );
}