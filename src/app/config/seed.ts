/* eslint-disable @typescript-eslint/no-explicit-any */
import { Role } from "@prisma/client";
import { envVars } from "../config/env.js";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export const seedSuperAdmin = async () => {
  try {
    // 🧹 CLEANUP: Delete duplicate/broken accounts (temporary)
    const cleanup = await prisma.account.deleteMany({
      where: {
        providerId: "credential",
        OR: [
          { password: null },
          { id: { startsWith: "account_" } }
        ]
      }
    });
    if (cleanup.count > 0) {
      console.log(`🧹 Cleaned up ${cleanup.count} broken account records.`);
    }

    // Seeding Super Admin
    await seedSuperAdminUser();

    // Seeding Admin
    await seedAdminUser();

    // Seeding Regular User
    await seedRegularUser();

  } catch (error) {
    console.error("❌ Error during database seeding:", error);
  }
};

const seedSuperAdminUser = async () => {
  try {
    const exists = await prisma.admin.findFirst({
      where: {
        email: envVars.SUPER_ADMIN_EMAIL,
      },
    });

    if (exists) {
      console.log("Super admin already exists. Skipping...");
      return;
    }

    const superAdminUser = await auth.api.signUpEmail({
      body: {
        email: envVars.SUPER_ADMIN_EMAIL,
        password: envVars.SUPER_ADMIN_PASSWORD,
        name: "Super Admin",
        role: Role.SUPER_ADMIN,
        needPasswordChange: false,
      } as any,
    });

    if (!superAdminUser?.user?.id) {
      throw new Error("Failed to create super admin user");
    }

    const result = await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: {
          id: superAdminUser.user.id,
        },
        data: {
          emailVerified: true,
          status: "ACTIVE",
        },
      });

      const admin = await tx.admin.create({
        data: {
          name: "Super Admin",
          email: envVars.SUPER_ADMIN_EMAIL,
          userId: superAdminUser.user.id,
        },
      });

      return admin;
    });

    console.log("🔥 Super Admin Created Successfully:", result.email);
  } catch (error) {
    console.error("❌ Error seeding super admin:", error);
  }
};

const seedAdminUser = async () => {
  try {
    const exists = await prisma.admin.findFirst({
      where: {
        email: envVars.ADMIN_EMAIL,
      },
    });

    if (exists) {
      console.log("Admin already exists. Skipping...");
      return;
    }

    const adminUser = await auth.api.signUpEmail({
      body: {
        email: envVars.ADMIN_EMAIL,
        password: envVars.ADMIN_PASSWORD,
        name: "Admin",
        role: Role.ADMIN,
        needPasswordChange: false,
      } as any,
    });

    if (!adminUser?.user?.id) {
      throw new Error("Failed to create admin user");
    }

    const result = await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: {
          id: adminUser.user.id,
        },
        data: {
          emailVerified: true,
          status: "ACTIVE",
        },
      });

      const admin = await tx.admin.create({
        data: {
          name: "Admin",
          email: envVars.ADMIN_EMAIL,
          userId: adminUser.user.id,
        },
      });

      return admin;
    });

    console.log("🔥 Admin Created Successfully:", result.email);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  }
};

const seedRegularUser = async () => {
  try {
    const exists = await prisma.user.findUnique({
      where: {
        email: envVars.USER_EMAIL,
      },
    });

    if (exists) {
      console.log("Regular user already exists. Skipping...");
      return;
    }

    const regularUser = await auth.api.signUpEmail({
      body: {
        email: envVars.USER_EMAIL,
        password: envVars.USER_PASSWORD,
        name: "Regular User",
        role: Role.USER,
        needPasswordChange: false,
      } as any,
    });

    if (!regularUser?.user?.id) {
      throw new Error("Failed to create regular user");
    }

    const result = await prisma.user.update({
      where: {
        id: regularUser.user.id,
      },
      data: {
        emailVerified: true,
        status: "ACTIVE",
      },
    });

    console.log("🔥 Regular User Created Successfully:", result.email);
  } catch (error) {
    console.error("❌ Error seeding regular user:", error);
  }
};