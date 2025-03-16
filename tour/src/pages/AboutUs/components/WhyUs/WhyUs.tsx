import './WhyUs.scss';

export const WhyUs = () => {
  const benefits = [
    'Великий вибір турів для будь-яких вподобань та бюджету',
    'Прозорі ціни без прихованих комісій',
    'Підтримка 24/7 на всіх етапах подорожі'
  ];

  return (
    <section className="why-us" id="why-us">
      <div className="container">
        <h2>Чому OpenWorld?</h2>
        <ul className="benefits-list">
          {benefits.map((benefit, index) => (
            <li key={index} className="benefit-item">
              <span className="benefit-icon">✅</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

