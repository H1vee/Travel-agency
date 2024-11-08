import logo from './plane.png';
import './Logo.scss';

export const Logo = () => {
  return (
    <div className={'Logo'} style={{backgroundImage: `url(${logo})`}} />
  );
};
