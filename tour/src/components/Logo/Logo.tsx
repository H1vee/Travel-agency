import logo from './plane.png';
import './Logo.scss';

interface LogoProps {
  className?: string;
}

export const Logo = ({ className }: LogoProps = {}) => {
  return (
    <div className={`Logo ${className || ''}`}>
      <img src={logo} alt="Plane Logo" />
    </div>
  );
};