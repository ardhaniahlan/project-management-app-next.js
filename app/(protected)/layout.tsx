import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/features/globals/components/Sidebar';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  let currentUser;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    
    currentUser = {
      name: payload.name as string
    };
  } catch (error) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={currentUser} />
      
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}