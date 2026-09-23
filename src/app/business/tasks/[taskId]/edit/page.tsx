import { TaskEditor } from "@/features/tasks/TaskEditor";

export default async function EditBusinessTaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <TaskEditor taskId={taskId} />;
}
