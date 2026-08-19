import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { organizationMembers, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
  let activeOrg = null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userId = payload.userId as number;

    const userOrgs = await db
      .select({
        role: organizationMembers.role,
        orgName: organizations.name,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    activeOrg = userOrgs.length > 0 ? userOrgs[0] : null;

    currentUser = {
      name: payload.name as string,
      role: activeOrg ? (activeOrg.role === 'owner' ? 'Workspace Owner' : 'Team Member') : 'Management App',
    };

  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error;
    }
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar user={currentUser} organizationName={activeOrg?.orgName || "Management App"} />
      
      <main className="flex-1 overflow-y-auto text-black">
        {children}
      </main>
    </div>
  );
}