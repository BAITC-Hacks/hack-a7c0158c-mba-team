import { ProposalStatus } from "@/features/proposals/ProposalStatus";

type ProposalStatusPageProps = { params: Promise<{ taskId: string; proposalId: string }> };

export default async function ProposalStatusPage({ params }: ProposalStatusPageProps) {
  const { taskId, proposalId } = await params;

  return (
    <section>
      <p className="eyebrow">Для команд · Статус отклика</p>
      <h1>Решение бизнеса</h1>
      <ProposalStatus taskId={taskId} proposalId={proposalId} />
    </section>
  );
}
