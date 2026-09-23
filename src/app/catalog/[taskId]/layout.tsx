import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-db";

export default async function TaskActionLayout({ children }: { children: React.ReactNode }) {
  const session = (await cookies()).get("ai_sana_session")?.value;
  if (!getSessionUser(session)) redirect("/auth");
  return children;
}
