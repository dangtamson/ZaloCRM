import { prisma } from '../../../shared/database/prisma-client.js';

export async function resolveZaloAccountId(orgId: string, rawAccountId: string): Promise<string | null> {
  const accountValue = rawAccountId.trim();
  const account = await prisma.zaloAccount.findFirst({
    where: {
      orgId,
      archivedAt: null,
      OR: [
        { id: accountValue },
        { phone: accountValue },
        { displayName: accountValue },
        { zaloUid: accountValue },
      ],
    },
    select: { id: true },
  });
  return account?.id ?? null;
}
