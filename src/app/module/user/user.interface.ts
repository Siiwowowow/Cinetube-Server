/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IUpdateUserProfilePayload {
  name?: string;
  email?: string;
  image?: string; // Will store Cloudinary URL
}

// ✅ ADD THESE NEW INTERFACES
export interface IUserProfileResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  emailVerified: boolean;
  status: string;
  createdAt: Date;
  stripeCustomerId?: string | null;
  stats: {
    totalReviews: number;
    totalComments: number;
    totalWatchlist: number;
    totalPurchases: number;
    totalLikesReceived: number;
    averageRating: number;
  };
  recentReviews: any[];
  recentComments: any[];
  activeSubscription: any | null;
}

export interface IUserStats {
  totalReviews: number;
  totalComments: number;
  totalWatchlist: number;
  totalPurchases: number;
  totalLikesReceived: number;
  averageRating: number;
}