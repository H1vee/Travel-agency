import React from 'react';
import './DescriberHero.scss';
import { Link } from 'react-router-dom';

interface DescriberHeroProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick?: () => void;
  backgroundImage?: string;
  linkTo?: string;  
}

export const DescriberHero: React.FC<DescriberHeroProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
  backgroundImage = './stand.jpg',
  linkTo = '/Tours'  
}) => {

  const renderButton = () => {
    if (onButtonClick) {
      return (
        <button className="btn" onClick={onButtonClick}>
          {buttonText}
        </button>
      );
    } else {
      return (
        <Link to={linkTo} className="btn">
          {buttonText}
        </Link>
      );
    }
  };

  return (
    <section
      className="describer-hero"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="describer-hero-content">
        <h1>{title}</h1>
        <p>{description}</p>
        {renderButton()}
      </div>
    </section>
  );
};