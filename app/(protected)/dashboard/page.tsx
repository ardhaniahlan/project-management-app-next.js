import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/db";
import { organizationMembers, projects, tasks, taskAssignees, boards} from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Clock, CheckCircle2, FolderKanban,Users, AlertCircle, Timer, LayoutDashboard,} from "lucide-react";
import StatCard from "@/features/globals/components/StatCard";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function DashboardPage() {
  const token = (await cookies()).get("auth_token")?.value;
  const { payload } = await jwtVerify(token!, SECRET_KEY);
  const userId = payload.userId as number;
  const userName = payload.name as string;

  const userOrgs = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId))
    .limit(1);

  const hasOrganization = userOrgs.length > 0;

  if (!hasOrganization) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      </div>
    );
  }

  const userRole = userOrgs[0].role;
  const orgId = userOrgs[0].organizationId;

  const orgProjects = await db.select().from(projects).where(eq(projects.organizationId, orgId));
  const orgMembers = await db.select().from(organizationMembers).where(eq(organizationMembers.organizationId, orgId));
  
  const allOrgTasks = await db.select({
    id: tasks.id,
    boardName: boards.name,
    priority: tasks.priority
  })
  .from(tasks)
  .innerJoin(projects, eq(tasks.projectId, projects.id))
  .innerJoin(boards, eq(tasks.boardId, boards.id))
  .where(eq(projects.organizationId, orgId));

  const totalTasksCount = allOrgTasks.length;
  const completedTasksCount = allOrgTasks.filter(t => t.boardName.toLowerCase() === 'done').length;
  const completionRate = totalTasksCount === 0 ? 0 : Math.round((completedTasksCount / totalTasksCount) * 100);

  const highPriorityTasks = allOrgTasks.filter(t => t.priority === 'high' && t.boardName.toLowerCase() !== 'done').length;

  const myTasks = await db.select({
    id: tasks.id,
    title: tasks.title,
    dueDate: tasks.dueDate,
    boardName: boards.name,
    projectName: projects.title,
  })
  .from(tasks)
  .innerJoin(taskAssignees, eq(tasks.id, taskAssignees.taskId))
  .innerJoin(boards, eq(tasks.boardId, boards.id))
  .innerJoin(projects, eq(tasks.projectId, projects.id))
  .where(eq(taskAssignees.userId, userId));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let myTasksToday = 0;
  let myTasksUpcoming = 0;
  let myTasksOverdue = 0;
  const myUnfinishedTasks = myTasks.filter(t => t.boardName.toLowerCase() !== 'done');

  myUnfinishedTasks.forEach(task => {
    if (task.dueDate) {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() === today.getTime()) myTasksToday++;
      else if (taskDate.getTime() > today.getTime()) myTasksUpcoming++;
      else if (taskDate.getTime() < today.getTime()) myTasksOverdue++;
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Halo, {userName}!</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          {userRole === "owner" && "Berikut adalah ringkasan performa ruang kerja Anda."}
          {userRole === "project_manager" && "Pantau progres proyek dan beban kerja tim Anda di sini."}
          {userRole === "member" && "Fokus pada tugas Anda hari ini dan selesaikan dengan baik."}
        </p>
      </div>

      {userRole === "owner" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Proyek" value={orgProjects.length.toString()} icon={<FolderKanban className="text-blue-700" size={16} />} bg="bg-blue-100" />
            <StatCard title="Anggota Tim" value={orgMembers.length.toString()} icon={<Users className="text-violet-700" size={16} />} bg="bg-violet-100" />
            <StatCard title="Rata-rata Penyelesaian" value={`${completionRate}%`} icon={<CheckCircle2 className="text-emerald-700" size={16} />} bg="bg-emerald-100" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Daftar Proyek Aktif</h2>
            {orgProjects.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">Belum ada proyek.</div>
            ) : (
              <div className="space-y-3">
                {orgProjects.map(proj => (
                  <Link key={proj.id} href={`/projects/${proj.id}`} className="block p-3 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                    <h3 className="font-semibold text-gray-800 text-sm">{proj.title}</h3>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {userRole === "project_manager" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Proyek Dikelola" value={orgProjects.length.toString()} icon={<LayoutDashboard className="text-blue-700" size={16} />} bg="bg-blue-100" />
            <StatCard title="Total Tugas Aktif" value={(totalTasksCount - completedTasksCount).toString()} icon={<Timer className="text-amber-700" size={16} />} bg="bg-amber-100" />
            <StatCard title="Tugas Prioritas Tinggi" value={highPriorityTasks.toString()} icon={<AlertCircle className="text-red-700" size={16} />} bg="bg-red-100" />
          </div>
        </>
      )}

      {userRole === "member" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Tugas Saya Hari Ini" value={myTasksToday.toString()} icon={<CheckCircle2 className="text-emerald-700" size={16} />} bg="bg-emerald-100" />
            <StatCard title="Tugas Mendatang" value={myTasksUpcoming.toString()} icon={<Clock className="text-blue-700" size={16} />} bg="bg-blue-100" />
            <StatCard title="Tugas Terlambat" value={myTasksOverdue.toString()} icon={<AlertCircle className="text-red-700" size={16} />} bg="bg-red-100" />
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Daftar Pekerjaan Saya (Belum Selesai)</h2>
            {myUnfinishedTasks.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">Hore! Tidak ada tugas yang tertunda.</div>
            ) : (
              <div className="space-y-3">
                {myUnfinishedTasks.map(task => (
                  <div key={task.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm">{task.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">Proyek: {task.projectName}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 font-medium rounded-md">
                      Posisi: {task.boardName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}