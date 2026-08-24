import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/db";
import {
  organizationMembers,
  projects,
  tasks,
  taskAssignees,
  boards,
  activityLogs,
  users,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import {
  Clock,
  FolderKanban,
  Users,
  AlertCircle,
  Timer,
  LayoutDashboard,
  ArrowRightLeft,
  MessageSquare,
  Pencil,
  Plus,
  Activity,
  CheckCircle2,
  Building2,
} from "lucide-react";
import StatCard from "@/features/globals/components/StatCard";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

const avatarPalette = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
];

const avatarColor = (name: string) => {
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarPalette[hash % avatarPalette.length];
};

const actionIcon = (action: string) => {
  const text = action.toLowerCase();

  if (text.includes("pindah")) return { Icon: ArrowRightLeft, className: "bg-blue-50 text-blue-600" };
  if (text.includes("komentar")) return { Icon: MessageSquare, className: "bg-violet-50 text-violet-600" };
  if (text.includes("selesai")) return { Icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600" };
  if (text.includes("edit") || text.includes("ubah") || text.includes("perbarui"))
    return { Icon: Pencil, className: "bg-amber-50 text-amber-600" };
  if (text.includes("buat") || text.includes("tambah"))
    return { Icon: Plus, className: "bg-indigo-50 text-indigo-600" };

  return { Icon: Activity, className: "bg-gray-100 text-gray-500" };
};

const groupLabel = (date: Date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return "Hari ini";
  if (isSameDay(date, yesterday)) return "Kemarin";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 border-8 border-indigo-50/50">
          <Building2 size={36} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          Selamat Datang, {userName}!
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Sepertinya Anda belum tergabung dalam organisasi mana pun. Silakan tunggu admin mengundang Anda ke ruang kerja mereka, atau buat organisasi Anda sendiri untuk memulai.
        </p>
        
        <div className="flex flex-col w-full gap-3">
          <Link
            href="/onboarding"
            className="w-full px-5 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Buat Organisasi Baru
          </Link>
          
          <Link
            href="/dashboard"
            className="w-full px-5 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Muat Ulang Halaman
          </Link>
        </div>
      </div>
    );
  }

  const userRole = userOrgs[0].role;
  const orgId = userOrgs[0].organizationId;

  const orgProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, orgId));
  const orgMembers = await db
    .select()
    .from(organizationMembers)
    .where(eq(organizationMembers.organizationId, orgId));

  const allOrgTasks = await db
    .select({
      id: tasks.id,
      boardName: boards.name,
      priority: tasks.priority,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .innerJoin(boards, eq(tasks.boardId, boards.id))
    .where(eq(projects.organizationId, orgId));

  const totalTasksCount = allOrgTasks.length;
  const completedTasksCount = allOrgTasks.filter(
    (t) => t.boardName.toLowerCase() === "done",
  ).length;
  const completionRate =
    totalTasksCount === 0
      ? 0
      : Math.round((completedTasksCount / totalTasksCount) * 100);

  const highPriorityTasks = allOrgTasks.filter(
    (t) => t.priority === "high" && t.boardName.toLowerCase() !== "done",
  ).length;

  const myTasks = await db
    .select({
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
  const myUnfinishedTasks = myTasks.filter(
    (t) => t.boardName.toLowerCase() !== "done",
  );

  myUnfinishedTasks.forEach((task) => {
    if (task.dueDate) {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() === today.getTime()) myTasksToday++;
      else if (taskDate.getTime() > today.getTime()) myTasksUpcoming++;
      else if (taskDate.getTime() < today.getTime()) myTasksOverdue++;
    }
  });

  const recentActivities = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      createdAt: activityLogs.createdAt,
      userName: users.name,
      projectName: projects.title,
    })
    .from(activityLogs)
    .innerJoin(users, eq(activityLogs.userId, users.id))
    .leftJoin(projects, eq(activityLogs.projectId, projects.id))
    .where(eq(activityLogs.organizationId, orgId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(7);

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Halo, {userName}!
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          {userRole === "owner" &&
            "Berikut adalah ringkasan performa ruang kerja Anda."}
          {userRole === "project_manager" &&
            "Pantau progres proyek dan beban kerja tim Anda di sini."}
          {userRole === "member" &&
            "Fokus pada tugas Anda hari ini dan selesaikan dengan baik."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {userRole === "owner" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Total Proyek"
                  value={orgProjects.length.toString()}
                  icon={<FolderKanban className="text-blue-700" size={16} />}
                  bg="bg-blue-100"
                />
                <StatCard
                  title="Anggota Tim"
                  value={orgMembers.length.toString()}
                  icon={<Users className="text-violet-700" size={16} />}
                  bg="bg-violet-100"
                />
                <StatCard
                  title="Rata-rata Penyelesaian"
                  value={`${completionRate}%`}
                  icon={<CheckCircle2 className="text-emerald-700" size={16} />}
                  bg="bg-emerald-100"
                />
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Daftar Proyek Aktif
                </h2>
                {orgProjects.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Belum ada proyek.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orgProjects.map((proj) => (
                      <Link
                        key={proj.id}
                        href={`/projects/${proj.id}`}
                        className="block p-3 border border-gray-100 rounded-lg hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
                      >
                        <h3 className="font-semibold text-gray-800 text-sm">
                          {proj.title}
                        </h3>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {userRole === "project_manager" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Proyek Dikelola"
                value={orgProjects.length.toString()}
                icon={<LayoutDashboard className="text-blue-700" size={16} />}
                bg="bg-blue-100"
              />
              <StatCard
                title="Total Tugas Aktif"
                value={(totalTasksCount - completedTasksCount).toString()}
                icon={<Timer className="text-amber-700" size={16} />}
                bg="bg-amber-100"
              />
              <StatCard
                title="Tugas Prioritas Tinggi"
                value={highPriorityTasks.toString()}
                icon={<AlertCircle className="text-red-700" size={16} />}
                bg="bg-red-100"
              />
            </div>
          )}

          {userRole === "member" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  title="Tugas Saya Hari Ini"
                  value={myTasksToday.toString()}
                  icon={<CheckCircle2 className="text-emerald-700" size={16} />}
                  bg="bg-emerald-100"
                />
                <StatCard
                  title="Tugas Mendatang"
                  value={myTasksUpcoming.toString()}
                  icon={<Clock className="text-blue-700" size={16} />}
                  bg="bg-blue-100"
                />
                <StatCard
                  title="Tugas Terlambat"
                  value={myTasksOverdue.toString()}
                  icon={<AlertCircle className="text-red-700" size={16} />}
                  bg="bg-red-100"
                />
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Daftar Pekerjaan Saya (Belum Selesai)
                </h2>
                {myUnfinishedTasks.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    Hore! Tidak ada tugas yang tertunda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myUnfinishedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex justify-between items-center p-3 border border-gray-100 rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm">
                            {task.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Proyek: {task.projectName}
                          </p>
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

        {/* Kolom kanan — activity log, sticky */}
        <div className="lg:col-span-1 lg:sticky lg:top-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2 shrink-0">
              Aktivitas Terkini
            </h2>

            {recentActivities.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                Belum ada aktivitas terekam.
              </div>
            ) : (
              (() => {
                let lastGroup = "";

                return (
                  <div className="space-y-0 overflow-y-auto max-h-[calc(100vh-140px)] pr-2">
                    {recentActivities.map((log, index) => {
                      const logDate = new Date(log.createdAt);
                      const currentGroup = groupLabel(logDate);
                      const showGroupHeader = currentGroup !== lastGroup;
                      lastGroup = currentGroup;

                      const color = avatarColor(log.userName || "U");
                      const { Icon, className: iconClass } = actionIcon(log.action);

                      return (
                        <div key={log.id}>
                          {showGroupHeader && (
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3 mt-4 first:mt-0">
                              {currentGroup}
                            </p>
                          )}

                          <div className="flex gap-3 text-sm">
                            <div className="flex flex-col items-center shrink-0">
                              <div
                                className={`w-7 h-7 rounded-full ${color.bg} ${color.text} font-bold flex items-center justify-center text-xs relative`}
                              >
                                {log.userName ? log.userName.charAt(0) : "U"}
                                <span
                                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white ${iconClass}`}
                                >
                                  <Icon size={9} />
                                </span>
                              </div>
                              {index < recentActivities.length - 1 && (
                                <div className="w-px flex-1 bg-gray-100 my-1.5" />
                              )}
                            </div>

                            <div className="flex-1 pb-4 last:pb-0">
                              <p className="text-gray-800 leading-relaxed">
                                <span className="font-semibold">
                                  {log.userName}
                                </span>{" "}
                                {log.action}
                              </p>

                              <div className="flex items-center gap-2 mt-1.5">
                                <p className="text-xs text-gray-400">
                                  {logDate.toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>

                                {log.projectName && (
                                  <>
                                    <span className="text-gray-300 text-xs">•</span>
                                    <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                                      {log.projectName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}