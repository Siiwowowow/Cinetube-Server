# CineTube - Movie and Series Rating & Streaming Portal (Server API)

This is the Express.js & Prisma backend API for CineTube, powering media catalogs, review management, user interactions, watchlist records, and Stripe subscription/payment webhooks.

## 🚀 Live Base API URL
- **Production API:** [https://cinetube-server.vercel.app/api/v1](https://cinetube-server.vercel.app/api/v1)

---



---

## ✨ Features & Architecture

- **Prisma & PostgreSQL:** Fully structured relational schema for `user`, `media`, `genres`, `reviews`, `comments`, `likes`, `watchlist`, and `adminLogs`.
- **Review Verification Flow:** Submitting reviews puts them in a `PENDING` state. Admins review and transition them to `APPROVED` or `REJECTED`. Average ratings of media are automatically updated when a review status changes.
- **Strict Update/Delete Restrictions:**
  - Users can only edit or delete their own reviews **if they are unpublished** (`status !== 'APPROVED'`).
  - Admins can delete or moderate any review at any time.
- **Robust Zod Validation:** Robust schemas validating body types, email parsing, rating limits (1-10 stars), and character lengths.
- **Secure Authentication:** Cookie and header JWT-based verification, password salting with Bcrypt, and path-owner route protection.
- **Stripe Hook Integrations:** Real-time billing triggers, automatic database state synchronization on payment success events.

---

## 🛠️ Backend Stack

- **Runtime:** Node.js v20+ / Bun
- **Framework:** Express.js v5
- **Database ORM:** Prisma with PostgreSQL client
- **Auth & Security:** JSONWebToken, Bcrypt, Cookie-Parser
- **Media Upload:** Cloudinary & Multer Cloudinary storage
- **Email Delivery:** NodeMailer
- **Billing:** Stripe Node SDK

---

## ⚙️ Local Installation & Database Setup

1. **Clone and navigate to the backend:**
   ```bash
   cd B6-A5-Server
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://user:pass@host:port/dbname?sslmode=require"
   BETTER_AUTH_SECRET=yoursecretkey
   BETTER_AUTH_URL=http://localhost:5000
   ACCESS_TOKEN_SECRET=accesssecret
   REFRESH_TOKEN_SECRET=refreshsecret
   EMAIL_SENDER_SMTP_USER=yoursmtp@gmail.com
   EMAIL_SENDER_SMTP_PASS=yoursmtppassword
   EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
   EMAIL_SENDER_SMTP_PORT=465
   CLOUDINARY_CLOUD_NAME=yourcloudname
   CLOUDINARY_API_KEY=yourkey
   CLOUDINARY_API_SECRET=yoursecret
   STRIPE_SECRET_KEY=sk_test_...
   ```

4. **Initialize Database & Seed Data:**
   Push schema migrations to the database and generate Prisma types:
   ```bash
   pnpm prisma db push
   pnpm prisma generate
   ```
   To seed default test data (users, movies, reviews, and associations):
   - Import and execute `prisma/seed.sql` inside your PostgreSQL database instance.

5. **Start Dev Server:**
   ```bash
   pnpm dev
   ```

6. **Production Build:**
   ```bash
   pnpm build
   pnpm start
   ```
