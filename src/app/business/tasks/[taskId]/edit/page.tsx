import { TaskEditor } from "@/features/tasks/TaskEditor";

type EditTaskPageProps = { params: Promise<{ taskId: string }> };

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { taskId } = await params;
  return <TaskEditor taskId={taskId} />;
}
