import { Router } from "express";
import { AuthRouters } from "../module/auth/auth.route.js";
import { UserRoutes } from "../module/user/user.route.js";
import { MediaRoutes } from "../module/media/media.route.js";
import { ReviewRoutes } from "../module/review/review.route.js";
import { CommentRoutes } from "../module/comment/comment.route.js";
import { WatchlistRoutes } from "../module/watchlist/watchlist.route.js";
import { PaymentRoutes } from "../module/payment/payment.route.js";
import { AdminDashboardRoutes } from "../module/adminDashboard/adminDashboard.route.js";
import { GenreRoutes } from "../module/genre/genre.route.js";

const router = Router();

// Auth & User routes (existing)
router.use("/auth", AuthRouters);
router.use("/users", UserRoutes);

// ✅ Add these new routes for Movie Portal
router.use("/media", MediaRoutes);           // Movies & Series
router.use("/reviews", ReviewRoutes);         // Reviews
router.use("/comments", CommentRoutes);       // Comments & Likes
router.use("/watchlist", WatchlistRoutes);    // User Watchlist
router.use("/payments", PaymentRoutes);       // Subscriptions & Purchases
router.use("/admin", AdminDashboardRoutes);   // Admin Dashboard
router.use("/genres", GenreRoutes);           // Genres list

export const IndexRoutes = router;