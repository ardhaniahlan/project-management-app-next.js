import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { db } from "@/db";
import { organizationMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  FolderKanban,
  Users,
  AlertCircle,
  Timer,
  LayoutDashboard,
} from "lucide-react";
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
        <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 mb-5">
          <Clock size={24} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
          Menunggu Undangan
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Saat ini Anda belum tergabung dalam Ruang Kerja manapun. Mintalah
          manajer untuk mengundang email <b className="text-gray-700">{payload.email as string}</b>.
        </p>

        <div className="flex items-center gap-3 w-full">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Atau
          </span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-3">
            Ingin membuat Ruang Kerja Anda sendiri sebagai Pemilik?
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors"
          >
            <Briefcase size={16} />
            Buat Ruang Kerja Baru
          </Link>
        </div>
      </div>
    );
  }

  const userRole = userOrgs[0].role;

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

      {userRole === "owner" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Proyek Aktif"
              value="0"
              icon={<FolderKanban className="text-blue-700" size={16} />}
              bg="bg-blue-100"
            />
            <StatCard
              title="Anggota Tim"
              value="1"
              icon={<Users className="text-violet-700" size={16} />}
              bg="bg-violet-100"
            />
            <StatCard
              title="Rata-rata Penyelesaian"
              value="0%"
              icon={<CheckCircle2 className="text-emerald-700" size={16} />}
              bg="bg-emerald-100"
            />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Aktivitas Terkini (Seluruh Tim)
            </h2>
            <div className="text-center py-10 text-gray-400 text-sm">
              Belum ada aktivitas terekam.
            </div>
          </div>
        </>
      )}

      {userRole === "project_manager" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Proyek Dikelola"
              value="0"
              icon={<LayoutDashboard className="text-blue-700" size={16} />}
              bg="bg-blue-100"
            />
            <StatCard
              title="Menunggu Review"
              value="0"
              icon={<Timer className="text-amber-700" size={16} />}
              bg="bg-amber-100"
            />
            <StatCard
              title="Tugas Macet (Blocker)"
              value="0"
              icon={<AlertCircle className="text-red-700" size={16} />}
              bg="bg-red-100"
            />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Timeline Proyek Terdekat
            </h2>
            <div className="text-center py-10 text-gray-400 text-sm">
              Belum ada proyek yang dikelola.
            </div>
          </div>
        </>
      )}

      {userRole === "member" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Tugas Saya Hari Ini"
              value="0"
              icon={<CheckCircle2 className="text-emerald-700" size={16} />}
              bg="bg-emerald-100"
            />
            <StatCard
              title="Tugas Mendatang"
              value="0"
              icon={<Clock className="text-blue-700" size={16} />}
              bg="bg-blue-100"
            />
            <StatCard
              title="Tugas Terlambat"
              value="0"
              icon={<AlertCircle className="text-red-700" size={16} />}
              bg="bg-red-100"
            />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Daftar Pekerjaan Saya (To-Do)
            </h2>
            <div className="text-center py-10 text-gray-400 text-sm">
              Hore! Belum ada tugas yang ditugaskan kepada Anda.
            </div>
          </div>
        </>
      )}
    </div>
  );
}