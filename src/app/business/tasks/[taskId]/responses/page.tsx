import Link from "next/link";
import { ResponseManager } from "@/features/proposals/ResponseManager";

type ResponsesPageProps = { params: Promise<{ taskId: string }> };

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  const { taskId } = await params;

  return (
    <section>
      <p className="eyebrow">Бизнес · Отклики</p>
      <h1>Предложения команд</h1>
      <p className="muted">Задача: {taskId}</p>
      <ResponseManager taskId={taskId} />
      <p><Link className="text-link" href="/catalog">Вернуться в каталог</Link></p>
    </section>
  );
}
