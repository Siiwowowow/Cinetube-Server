/* eslint-disable @typescript-eslint/no-explicit-any */
//src/app/middleware/checkAuth.ts
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import { envVars } from "../config/env.js";
import AppError from "../errorHelpers/AppError.js";
import { auth } from "../lib/auth.js";
import { CookieUtils } from "../utils/cookie.js";
import { jwtUtils } from "../utils/jwt.js";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { tokenUtils } from "../utils/token.js";

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");
      let accessToken = CookieUtils.getCookie(req, "accessToken");

      if (!accessToken && req.headers.authorization?.startsWith("Bearer ")) {
        accessToken = req.headers.authorization.split(" ")[1];
      }

      let user: any = null;

      // ✅ Session try — fail হলে JWT try করবে
      if (sessionToken) {
        try {
          const session = await auth.api.getSession({
            headers: {
              Cookie: `better-auth.session_token=${sessionToken}`,
            },
          });
          if (session?.user) {
            user = session.user;
          }
        } catch {
          user = null;
        }
      }

      // ✅ Session না পেলে JWT দিয়ে try
      if (!user && accessToken) {
        const verified = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);
        if (verified.success) {
          const data = verified.data as any;
          const dbUser = await prisma.user.findUnique({
            where: { id: data.userId || data.id },
          });
          if (dbUser) {
            user = dbUser;
          }
        }
      }
      // ✅ দুটোই fail হলে Refresh Token দিয়ে try
      if (!user) {
        const refreshToken = CookieUtils.getCookie(req, "refreshToken");
        if (refreshToken) {
          const verified = jwtUtils.verifyToken(refreshToken, envVars.REFRESH_TOKEN_SECRET);
          if (verified.success) {
            const data = verified.data as any;
            const dbUser = await prisma.user.findUnique({
              where: { id: data.userId || data.id },
            });
            if (dbUser && dbUser.status === UserStatus.ACTIVE && !dbUser.isDeleted) {
              user = dbUser;

              // Generate new tokens
              const newAccessToken = tokenUtils.getAccessToken({
                userId: dbUser.id,
                role: dbUser.role,
                name: dbUser.name,
                email: dbUser.email,
                status: dbUser.status,
                isDeleted: dbUser.isDeleted,
                emailVerified: dbUser.emailVerified,
                needPasswordChange: dbUser.needPasswordChange,
              });

              const newRefreshToken = tokenUtils.getRefreshToken({
                userId: dbUser.id,
                role: dbUser.role,
                name: dbUser.name,
                email: dbUser.email,
                status: dbUser.status,
                isDeleted: dbUser.isDeleted,
                emailVerified: dbUser.emailVerified,
                needPasswordChange: dbUser.needPasswordChange,
              });

              // Set the new tokens as cookies
              tokenUtils.setAccessTokenCookie(res, newAccessToken);
              tokenUtils.setRefreshTokenCookie(res, newRefreshToken);

              // Update account tokens in DB
              await prisma.account.updateMany({
                where: {
                  userId: dbUser.id,
                  providerId: "credential",
                },
                data: {
                  accessToken: newAccessToken,
                  refreshToken: newRefreshToken,
                  accessTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
              });
            }
          }
        }
      }

      // ✅ দুটোই (সব) fail
      if (!user) {
        throw new AppError(status.UNAUTHORIZED, "Unauthorized access! Please login again.");
      }

      const isMeRoute = req.originalUrl.endsWith("/me");

      if (
        user.status === UserStatus.BLOCKED ||
        user.status === UserStatus.DELETED ||
        user.isDeleted
      ) {
        throw new AppError(status.UNAUTHORIZED, "User is not active");
      }

      if (!isMeRoute && user.status === UserStatus.PENDING_VERIFICATION) {
        throw new AppError(status.FORBIDDEN, "Account pending verification. Please verify your email.");
      }

      if (!isMeRoute && !user.emailVerified) {
        throw new AppError(status.FORBIDDEN, "Email verification required.");
      }

      if (authRoles.length > 0 && !authRoles.includes(user.role)) {
        throw new AppError(status.FORBIDDEN, "Forbidden access");
      }

      // ✅ IRequestUser এর সব fields
      req.user = {
        userId: user.userId || user.id,
        role: user.role,
        email: user.email,
        isDeleted: user.isDeleted ?? false,
        emailVerified: user.emailVerified ?? false,
        status: user.status,
        image: user.image ?? null,
      };

      next();
    } catch (error: any) {
      next(error);
    }
  };