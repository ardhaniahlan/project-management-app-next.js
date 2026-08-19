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
      <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <Clock size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Menunggu Undangan
        </h1>
        <p className="text-gray-500 mb-8 text-lg">
          Saat ini Anda belum tergabung dalam Ruang Kerja manapun. Mintalah
          manajer untuk mengundang email <b>{payload.email as string}</b>.
        </p>

        <div className="flex items-center gap-4 w-full">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-sm font-medium text-gray-400 uppercase">
            Atau
          </span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="mt-8">
          <p className="text-gray-600 mb-4">
            Ingin membuat Ruang Kerja Anda sendiri sebagai Pemilik?
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            <Briefcase size={20} />
            Buat Ruang Kerja Baru
          </Link>
        </div>
      </div>
    );
  }

  const userRole = userOrgs[0].role;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Halo, {userName}! 👋
        </h1>
        <p className="text-gray-500 mt-2">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Proyek Aktif"
              value="0"
              icon={<FolderKanban className="text-blue-600" />}
              bg="bg-blue-50"
            />
            <StatCard
              title="Anggota Tim"
              value="1"
              icon={<Users className="text-purple-600" />}
              bg="bg-purple-50"
            />
            <StatCard
              title="Rata-rata Penyelesaian"
              value="0%"
              icon={<CheckCircle2 className="text-green-600" />}
              bg="bg-green-50"
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Aktivitas Terkini (Seluruh Tim)
            </h2>
            <div className="text-center py-12 text-gray-500 text-sm">
              Belum ada aktivitas terekam.
            </div>
          </div>
        </>
      )}

      {userRole === "project_manager" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Proyek Dikelola"
              value="0"
              icon={<LayoutDashboard className="text-indigo-600" />}
              bg="bg-indigo-50"
            />
            <StatCard
              title="Menunggu Review"
              value="0"
              icon={<Timer className="text-orange-600" />}
              bg="bg-orange-50"
            />
            <StatCard
              title="Tugas Macet (Blocker)"
              value="0"
              icon={<AlertCircle className="text-red-600" />}
              bg="bg-red-50"
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Timeline Proyek Terdekat
            </h2>
            <div className="text-center py-12 text-gray-500 text-sm">
              Belum ada proyek yang dikelola.
            </div>
          </div>
        </>
      )}

      {userRole === "member" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Tugas Saya Hari Ini"
              value="0"
              icon={<CheckCircle2 className="text-green-600" />}
              bg="bg-green-50"
            />
            <StatCard
              title="Tugas Mendatang"
              value="0"
              icon={<Clock className="text-blue-600" />}
              bg="bg-blue-50"
            />
            <StatCard
              title="Tugas Terlambat"
              value="0"
              icon={<AlertCircle className="text-red-600" />}
              bg="bg-red-50"
            />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Daftar Pekerjaan Saya (To-Do)
            </h2>
            <div className="text-center py-12 text-gray-500 text-sm">
              Hore! Belum ada tugas yang ditugaskan kepada Anda.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
