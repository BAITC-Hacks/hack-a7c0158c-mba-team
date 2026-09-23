import Link from "next/link";
import { ProposalForm } from "@/features/proposals/ProposalForm";

type RespondPageProps = { params: Promise<{ taskId: string }> };

export default async function RespondPage({ params }: RespondPageProps) {
  const { taskId } = await params;

  return (
    <section>
      <p className="eyebrow">Для команд · Отклик</p>
      <h1>Предложите решение</h1>
      <p className="muted">Опишите идею, план и срок. Бизнес сам рассмотрит предложение.</p>
      <ProposalForm taskId={taskId} />
      <p><Link className="text-link" href="/catalog">Вернуться в каталог</Link></p>
    </section>
  );
}
