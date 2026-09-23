import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <p className="eyebrow">AI Sana · Практические задачи</p>
      <h1>Хорошее описание задачи помогает командам начать работу</h1>
      <p>Дополните бизнес-задачу, посмотрите её рейтинг и получите предложения от команд.</p>
      <div className="actions">
        <Link className="button" href="/business/new">Создать задачу</Link>
        <Link className="button button-secondary" href="/catalog">Открыть каталог</Link>
      </div>
    </section>
  );
}
