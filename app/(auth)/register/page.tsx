'use client';

import { RegisterFormData, registerSchema } from "@/features/auth/schema/authSchema";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { InputForm } from "@/features/auth/components/InputForm";
import { UserPlus, User, Mail, Lock, ArrowRight } from "lucide-react";
import { registerUser } from "@/features/auth/actions/authActions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await registerUser(data);
      if(result.error) {
        toast.error(result.error, {
          description: 'Silahkan coba lagi',
        });
      } else {
        toast.success('Akun berhasil dibuat!', {
          description: 'Silahkan login untuk melanjutkan',
        });
        router.push('/login');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat registrasi';
      toast.error(errorMessage, {
        description: 'Silahkan coba lagi',
      });
    }
  };

  return (
    <AuthLayout
      title="Buat Akun Baru"
      subtitle="Mulai kelola proyek Anda dengan lebih efisien"
      headerIcon={<UserPlus size={32} />}
      footerText="Sudah punya akun?"
      footerLinkText="Masuk di sini"
      footerHref="/login"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <InputForm
          label="Nama Lengkap"
          icon={<User />}
          placeholder="John Doe"
          {...register('name')}
          error={errors.name?.message}
        />
        
        <InputForm
          label="Alamat Email"
          icon={<Mail />}
          type="email"
          placeholder="nama@perusahaan.com"
          {...register('email')}
          error={errors.email?.message}
        />
        
        <InputForm
          label="Kata Sandi"
          icon={<Lock />}
          type="password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />
        
        <InputForm
          label="Konfirmasi Kata Sandi"
          icon={<Lock />}
          type="password"
          placeholder="••••••••"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
          <ArrowRight size={16} />
        </button>
      </form>
    </AuthLayout>
  );
}