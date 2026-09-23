import { BusinessResponsesDashboard } from "@/features/proposals/BusinessResponsesDashboard";

export default function BusinessResponsesPage() {
  return (
    <section className="responses-page">
      <p className="eyebrow">Бизнес · Управление откликами</p>
      <h1>Отклики команд</h1>
      <p className="responses-intro">Смотрите предложения по всем опубликованным задачам и принимайте решение по каждой команде.</p>
      <BusinessResponsesDashboard />
    </section>
  );
}
