import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { projects, organizationMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { KanbanSquare, Folder, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { CreateProjectModal } from '@/features/project/components/CreateProjectModal';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function ProjectsPage() {
  const token = (await cookies()).get('auth_token')?.value;
  const { payload } = await jwtVerify(token!, SECRET_KEY);
  const userId = payload.userId as number;

  const userOrg = await db.select()
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId))
    .limit(1);

  if (userOrg.length === 0) {
    return <div className="p-8">Anda belum memiliki ruang kerja.</div>;
  }

  const orgId = userOrg[0].organizationId;
  const canCreate = userOrg[0].role === 'owner' || userOrg[0].role === 'project_manager';

  const projectList = await db.select()
    .from(projects)
    .where(eq(projects.organizationId, orgId));

  return (
    <div className="p-8 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <KanbanSquare className="text-indigo-600" />
            Daftar Proyek
          </h1>
          <p className="text-gray-500 mt-1">Kelola dan pantau seluruh proyek aktif dalam ruang kerja Anda.</p>
        </div>
        
        {canCreate && <CreateProjectModal />}
      </div>

      {projectList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum ada proyek</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Mulai buat proyek pertama Anda untuk mulai mengatur tugas dan berkolaborasi dengan tim.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectList.map((project) => (
            <Link 
              key={project.id} 
              href={`/projects/${project.id}`}
              className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Folder size={20} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{project.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {project.description || 'Tidak ada deskripsi.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-medium text-indigo-600">
                <span>Buka Papan Kanban</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}