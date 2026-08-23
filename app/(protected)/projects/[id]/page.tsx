import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/db";
import {
  projects,
  boards,
  tasks,
  organizationMembers,
  taskAssignees,
  users,
  taskChecklists,
} from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Kanban, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { KanbanBoard } from "@/features/project/components/KanbanBoard";
import { ProjectStatusButton } from "@/features/project/components/ProjectStatusButton";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const resolvedParams = await params;
  const projectId = parseInt(resolvedParams.id);
  if (isNaN(projectId)) notFound();

  const token = (await cookies()).get("auth_token")?.value;
  const { payload } = await jwtVerify(token!, SECRET_KEY);
  const userId = payload.userId as number;

  const userOrg = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId))
    .limit(1);

  if (userOrg.length === 0) notFound();
  const orgId = userOrg[0].organizationId;

  const currentProject = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (
    currentProject.length === 0 ||
    currentProject[0].organizationId !== orgId
  ) {
    notFound();
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  const orgMembers = await db
    .select({
      userId: users.id,
      name: users.name,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizationMembers.organizationId, project.organizationId));

  const rawTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position));

  const taskIds = rawTasks.map((t) => t.id);

  let assigneesData: any[] = [];
  let checklistsData: any[] = [];

  if (taskIds.length > 0) {
    assigneesData = await db
      .select({
        taskId: taskAssignees.taskId,
        userId: taskAssignees.userId,
        name: users.name,
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(inArray(taskAssignees.taskId, taskIds));

    checklistsData = await db
      .select({
        id: taskChecklists.id,
        taskId: taskChecklists.taskId,
        title: taskChecklists.title,
        isCompleted: taskChecklists.isCompleted,
      })
      .from(taskChecklists)
      .where(inArray(taskChecklists.taskId, taskIds))
      .orderBy(asc(taskChecklists.createdAt));
  }

  const projectBoards = await db
    .select()
    .from(boards)
    .where(eq(boards.projectId, projectId))
    .orderBy(asc(boards.position));

  const projectTasks = rawTasks.map((task) => ({
    ...task,
    assignees: assigneesData
      .filter((a) => a.taskId === task.id)
      .map((a) => ({ userId: a.userId, name: a.name })),
    checklists: checklistsData
      .filter((c) => c.taskId === task.id)
      .map((c) => ({ id: c.id, title: c.title, isCompleted: c.isCompleted })),
  }));

  return (
  <div className="h-screen flex flex-col bg-gray-50">
    <div className="max-w-[1600px] w-full mx-auto flex flex-col h-full px-6 sm:px-8 py-6">
      <div className="shrink-0 flex flex-col gap-4 pb-5 mb-5 border-b border-gray-200">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Daftar Proyek
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
              <Kanban size={18} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate">
                  {project.title}
                </h1>
                <span
                  className={`shrink-0 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded-md ${
                    project.status === "completed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {project.status === "completed" ? "Selesai" : "Aktif"}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-1">
                {project.description || "Tidak ada deskripsi."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Tim
              </span>
              <div className="flex -space-x-2 overflow-hidden">
                {orgMembers.map((member, index) => (
                  <div
                    key={member.userId}
                    className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700 shadow-sm cursor-pointer"
                    style={{ zIndex: 10 - index }}
                    title={`${member.name} (${member.role})`}
                  >
                    {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                  </div>
                ))}
              </div>
            </div>

            {(userOrg[0].role === "owner" ||
              userOrg[0].role === "project_manager") && (
              <div className="pl-4 border-l border-gray-200">
                <ProjectStatusButton
                  projectId={project.id}
                  organizationId={project.organizationId}
                  currentStatus={project.status}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <KanbanBoard
          projectId={projectId}
          boards={projectBoards}
          initialTasks={projectTasks}
          userRole={userOrg[0].role}
          isReadOnly={project.status === 'completed' || project.status === 'archived'}
        />
      </div>
    </div>
  </div>
);
}
