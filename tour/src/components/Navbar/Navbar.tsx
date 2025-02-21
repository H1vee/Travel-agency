import './Navbar.scss'
import {
  Navbar as NextNavbar, NavbarBrand, NavbarContent,
  NavbarItem, Link,
} from "@heroui/react";
import {Logo} from "../Logo/Logo";

export const Navbar = () => {
  return (
    <NextNavbar>
      <NavbarBrand >
        <span className={'Nav-Brand'}>OpenWorld</span>
        <Logo />
      </NavbarBrand>
      <NavbarContent justify="end">
        <NavbarItem isActive>
          <Link className={'Nav-Links'} href={'/'} isBlock size="lg" color="foreground" underline="always">
            ГОЛОВНА
          </Link>
          <Link className={'Nav-Links'} href={'/Tours'} isBlock size="lg" color="foreground" >
            ПОШУК ТУРІВ
          </Link>
        </NavbarItem>
      </NavbarContent>
    </NextNavbar>
  );
}
