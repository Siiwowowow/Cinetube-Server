import { prisma } from "../lib/prisma.js";

/**
 * Resolves the real Admin.id (UUID) from a User.id (passed as userId/adminId from controllers).
 * If the user is not an admin, returns null.
 */
export const getAdminIdByUserId = async (userId: string): Promise<string | null> => {
  const admin = await prisma.admin.findUnique({
    where: { userId }
  });
  return admin ? admin.id : null;
};
