'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, LogIn } from 'lucide-react';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { InputForm } from '@/features/auth/components/InputForm';
import { loginSchema, LoginFormData } from '@/features/auth/schema/authSchema';
import { loginUser } from '@/features/auth/actions/authActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginUser(data);
      if(result.error) {
        toast.error(result.error, {
          description: 'Silahkan coba lagi',
        });
      } else {
        toast.success('Login berhasil!', {
          description: 'Selamat datang kembali',
        });
        router.replace('/dashboard');
        router.refresh();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat login';
      toast.error(errorMessage, {
        description: 'Silahkan coba lagi',
      });
    }
  };

  return (
    <AuthLayout
      title="Selamat Datang Kembali"
      subtitle="Silakan masuk ke akun Anda untuk melanjutkan"
      footerText="Belum punya akun?"
      footerLinkText="Daftar di sini"
      footerHref="/register"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <InputForm
          label="Email"
          icon={<Mail />}
          type="email"
          placeholder="nama@email.com"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? 'Memproses...' : 'Masuk Sekarang'}
          <LogIn size={16} />
        </button>
      </form>
    </AuthLayout>
  );
}