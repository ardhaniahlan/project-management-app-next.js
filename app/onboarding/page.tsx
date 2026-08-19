"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, ArrowRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  OrganizationInput,
  organizationSchema,
} from "@/features/organization/schema/organizationSchema";
import { createOrganization } from "@/features/organization/actions/organizationActions";
import { InputForm } from "@/features/auth/components/InputForm";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
  });

  const onSubmit = async (data: OrganizationInput) => {
    setServerError(null);

    try {
      const response = await createOrganization(data);
      if (response?.error) {
        setServerError(response.error);
      }

      router.replace("/dashboard");
      router.refresh();
      toast.success("Ruang kerja berhasil dibuat!");
    } catch (error) {
      setServerError("Terjadi kesalahan sistem saat membuat ruang kerja.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-5 top-5 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={18} /> 
        </button>

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-3">
            <Briefcase size={18} />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1 tracking-tight">
            Selamat Datang!
          </h1>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
            Sebelum mulai, mari buat Ruang Kerja (Workspace) pertama Anda untuk
            tim.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <InputForm
            label="Nama Ruang Kerja"
            placeholder="Contoh: Kemas IT, Divisi Marketing, dsb."
            {...register("name")}
            error={errors.name?.message}
          />

          {serverError && (
            <p className="text-xs text-red-500 text-center">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? 'Membangun Ruang Kerja...' : 'Lanjutkan ke Dashboard'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
