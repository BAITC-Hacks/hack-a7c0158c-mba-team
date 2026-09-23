import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Сформулируйте задачу",
    description: "Начните с короткого описания. Уточните контекст и проверьте карточку перед публикацией.",
  },
  {
    number: "02",
    title: "Откройте её командам",
    description: "Опубликованные задачи доступны в общем каталоге и ранжируются по готовности к работе.",
  },
  {
    number: "03",
    title: "Выберите предложение",
    description: "Команды сами откликаются, а бизнес вручную решает, с кем продолжить работу.",
  },
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <p className="eyebrow">AI Sana · практические проекты</p>
        <h1>Реальные задачи бизнеса.<br />Решения студенческих команд.</h1>
        <p className="home-lead">
          AI Sana помогает превратить краткое описание потребности в понятную задачу для совместной работы.
          Бизнес публикует задачу, команды предлагают решения, а выбор остаётся за бизнесом.
        </p>

        <div className="home-actions" aria-label="Выберите, что хотите сделать">
          <Link className="home-action-card home-action-primary" href="/business/new">
            <span className="home-action-eyebrow">Для бизнеса</span>
            <span className="home-action-title">Создать задачу</span>
            <span className="home-action-description">Опишите потребность и подготовьте карточку</span>
            <span className="home-action-arrow" aria-hidden="true">↗</span>
          </Link>
          <Link className="home-action-card" href="/catalog">
            <span className="home-action-eyebrow">Для студенческих команд</span>
            <span className="home-action-title">Открыть каталог</span>
            <span className="home-action-description">Найдите задачу и предложите свой план</span>
            <span className="home-action-arrow" aria-hidden="true">↗</span>
          </Link>
        </div>

        <p className="home-trust-note">Открытый каталог · прозрачная готовность · ручной выбор команды</p>
      </section>

      <section className="home-process" aria-labelledby="home-process-title">
        <div className="home-section-heading">
          <p className="eyebrow">Как это работает</p>
          <h2 id="home-process-title">От первого описания до совместной работы</h2>
          <p>Простой путь для бизнеса и команд — без сложной регистрации и лишних этапов.</p>
        </div>

        <div className="home-step-grid">
          {steps.map((step) => (
            <article className="home-step-card" key={step.number}>
              <span className="home-step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="home-rating-note">
        <span className="home-rating-mark" aria-hidden="true">✓</span>
        <p><strong>Рейтинг оценивает готовность задачи.</strong> Он показывает, каких деталей не хватает, и помогает командам понять, с чего начать. Низкий балл не скрывает задачу из каталога.</p>
      </aside>
    </div>
  );
}
