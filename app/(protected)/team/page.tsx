import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { users, organizationMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Users as UsersIcon } from 'lucide-react';
import { InviteMemberButton } from '@/features/team/components/InviteMemberButton';
import { RoleSelector } from '@/features/team/components/RoleSelector';
import { RemoveMemberButton } from '@/features/team/components/RemoveMemberButton';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET);

export default async function TeamPage() {
  const token = (await cookies()).get('auth_token')?.value;
  const { payload } = await jwtVerify(token!, SECRET_KEY);
  const userId = payload.userId as number;

  const userOrg = await db.select()
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId))
    .limit(1);

  if (userOrg.length === 0) {
    return <div>Anda belum memiliki organisasi.</div>;
  }

  const orgId = userOrg[0].organizationId;
  const isOwner = userOrg[0].role === 'owner';

  const teamMembers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(eq(organizationMembers.organizationId, orgId));

  return (
    <div className="w-full p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UsersIcon className="text-indigo-600" />
            Manajemen Tim
          </h1>
          <p className="text-gray-500 mt-1">Kelola anggota yang memiliki akses ke ruang kerja ini.</p>
        </div>
        
        {isOwner && (
          <InviteMemberButton />
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-6 py-4 font-medium">Nama Anggota</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Peran</th>
              {isOwner && <th className="px-6 py-4 font-medium text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teamMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{member.name}</td>
                <td className="px-6 py-4 text-gray-500">{member.email}</td>
                <td className="px-6 py-4">
                  <RoleSelector 
                    memberId={member.id}
                    currentRole={member.role}
                    organizationId={orgId}
                    isOwner={isOwner}
                    isSelf={member.id === userId} 
                  />
                </td>
                
                {isOwner && (
                  <td className="px-6 py-4 text-right">
                    {member.id !== userId ? (
                      <RemoveMemberButton 
                        memberId={member.id} 
                        memberName={member.name || 'Anggota'} 
                        organizationId={orgId} 
                      />
                    ) : (
                      <span className="text-xs text-gray-400 italic">Anda</span>
                    )}
                  </td>
                )}
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}