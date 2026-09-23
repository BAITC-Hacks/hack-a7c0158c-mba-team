type ResponsesPageProps = { params: Promise<{ taskId: string }> };

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  const { taskId } = await params;

  return (
    <section>
      <p className="eyebrow">Бизнес · Отклики</p>
      <h1>Предложения команд</h1>
      <p className="placeholder">Здесь бизнес сравнит отклики и вручную выберет или отклонит команду.</p>
      <p className="muted">Задача: {taskId}</p>
    </section>
  );
}
