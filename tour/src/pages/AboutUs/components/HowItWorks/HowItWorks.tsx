import './HowItWorks.scss';

export const HowItWorks = () => {
  const steps = [
    'Оберіть напрямок',
    'Забронюйте тур',
    'Отримайте підтвердження',
    'Насолоджуйтеся подорожжю!'
  ];

  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <h2>Як це працює?</h2>
        <div className="steps">
          {steps.map((step, index) => (
            <div key={index} className="step">
              <div className="step-number">{index + 1}</div>
              <div className="step-text">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

