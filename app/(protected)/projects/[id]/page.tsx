import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { projects, boards, tasks, organizationMembers } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { Kanban, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { KanbanBoard } from '@/features/project/components/KanbanBoard';

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
    <div className="p-8 h-screen flex flex-col bg-gray-50/50">
      
      <div className="flex flex-col gap-4 mb-6">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-fit">
          <ArrowLeft size={16} />
          Kembali ke Daftar Proyek
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Kanban className="text-indigo-600" />
              {project.title}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{project.description || 'Tidak ada deskripsi.'}</p>
          </div>
        </div>
      </div>

      <KanbanBoard projectId={projectId} boards={projectBoards} initialTasks={projectTasks} />

    </div>
  );
}