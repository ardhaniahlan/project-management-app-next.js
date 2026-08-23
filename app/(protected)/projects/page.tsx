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
    <div className="p-8 w-full max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
            <KanbanSquare size={18} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Daftar Proyek
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola dan pantau seluruh proyek aktif dalam ruang kerja Anda.
            </p>
          </div>
        </div>

        {canCreate && <CreateProjectModal />}
      </div>

      {projectList.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Folder size={22} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Belum ada proyek</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Mulai buat proyek pertama Anda untuk mulai mengatur tugas dan berkolaborasi dengan tim.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectList.map((project) => {
            const isCompleted = project.status === 'completed';

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white p-5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Folder size={16} />
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide rounded-md ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {isCompleted ? 'Selesai' : 'Aktif'}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base mb-1.5 leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                    {project.description || 'Tidak ada deskripsi.'}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between text-sm font-semibold text-indigo-600">
                  <span>Buka Papan Kanban</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}