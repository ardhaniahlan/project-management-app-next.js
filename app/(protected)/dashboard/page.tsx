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
} from "lucide-react";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function DashboardPage() {
  const token = (await cookies()).get("auth_token")?.value;
  const { payload } = await jwtVerify(token!, SECRET_KEY);
  const userId = payload.userId as number;

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
          Saat ini Anda belum tergabung dalam Ruang Kerja (Workspace) manapun.
          Mintalah manajer atau rekan tim Anda untuk mengundang email{" "}
          <b className="text-gray-700">{payload.email as string}</b>.
        </p>

        <div className="flex items-center gap-3 w-full">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Atau
          </span>
          <div className="h-px bg-gray-200 flex-1" />
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

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-6 tracking-tight">
        Ikhtisar Kinerja
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-700 mb-3">
            <CheckCircle2 size={16} />
          </div>
          <h3 className="text-gray-500 text-xs font-medium">Tugas Selesai</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-700 mb-3">
            <FolderKanban size={16} />
          </div>
          <h3 className="text-gray-500 text-xs font-medium">Proyek Aktif</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-700 mb-3">
            <Users size={16} />
          </div>
          <h3 className="text-gray-500 text-xs font-medium">Anggota Tim</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">1</p>
        </div>
      </div>
    </div>
  );
}
