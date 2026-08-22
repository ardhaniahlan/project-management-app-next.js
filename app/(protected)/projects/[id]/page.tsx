import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { projects, boards, tasks, organizationMembers } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Kanban, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateTaskModal } from '@/features/task/components/CreateTaskModal';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const resolvedParams = await params;
  const projectId = parseInt(resolvedParams.id);
  if (isNaN(projectId)) notFound();

  const token = (await cookies()).get('auth_token')?.value;
  const { payload } = await jwtVerify(token!, SECRET_KEY);
  const userId = payload.userId as number;

  const userOrg = await db.select()
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId))
    .limit(1);

  if (userOrg.length === 0) notFound();
  const orgId = userOrg[0].organizationId;

  const currentProject = await db.select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (currentProject.length === 0 || currentProject[0].organizationId !== orgId) {
    notFound();
  }

  const project = currentProject[0];

  const projectBoards = await db.select()
    .from(boards)
    .where(eq(boards.projectId, projectId))
    .orderBy(asc(boards.position));

  const projectTasks = await db.select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position));

  return (
    <div className="p-8 h-screen flex flex-col bg-gray-50">

      <div className="flex flex-col gap-2 mb-6">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit">
          <ArrowLeft size={16} />
          Kembali ke Daftar Proyek
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
              <span className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-700 shrink-0">
                <Kanban size={16} />
              </span>
              {project.title}
            </h1>
            <p className="text-gray-500 text-sm mt-1.5 ml-11">{project.description || 'Tidak ada deskripsi.'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-5 overflow-x-auto pb-6 items-start">
        {projectBoards.map((board) => {
          const boardTasks = projectTasks.filter((task) => task.boardId === board.id);

          return (
            <div
              key={board.id}
              className="w-72 shrink-0 bg-gray-100 rounded-lg p-3 flex flex-col max-h-full border border-gray-200"
            >
              <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wide">{board.name}</h3>
                  <span className="w-5 h-5 bg-gray-200 text-gray-600 text-[11px] font-bold rounded-full flex items-center justify-center">
                    {boardTasks.length}
                  </span>
                </div>
                <button className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded-md transition-colors">
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {boardTasks.length === 0 ? (
                  <div className="h-20 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400">
                    Belum ada tugas
                  </div>
                ) : (
                  boardTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3.5 rounded-md border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-medium text-gray-900 text-sm leading-snug">{task.title}</h4>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{task.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>

              <CreateTaskModal projectId={projectId} boardId={board.id} />
            </div>
          );
        })}
      </div>

    </div>
  );
}