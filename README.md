# 🌍 OpenWorld — Travel Agency Platform

> A full-stack travel booking platform built as a university term project. Users can browse tours, book seats, pay via LiqPay, leave reviews, and manage their profile — all in a polished, responsive interface.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Security](#security)
- [Screenshots](#screenshots)

---

## Overview

OpenWorld is a travel agency web application that allows customers to discover, filter, and book tours across the world. The platform supports both guest and authenticated bookings, integrated card payments through LiqPay, email notifications, and a full-featured admin dashboard.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **React Router v6** | Client-side routing |
| **TanStack Query** | Server state & caching |
| **HeroUI (NextUI v2)** | Component library |
| **Swiper.js** | Image carousels |
| **Recharts** | Admin analytics charts |
| **Lucide React** | Icons |
| **SCSS Modules** | Styling |

### Backend
| Technology | Purpose |
|---|---|
| **Go (Golang)** | Backend language |
| **Echo v4** | HTTP framework |
| **GORM** | ORM / database access |
| **PostgreSQL** | Primary database |
| **JWT (golang-jwt)** | Authentication |
| **bcrypt** | Password hashing |
| **LiqPay SDK** | Payment processing |
| **SMTP (net/smtp)** | Email notifications |

---

## Features

### 🧑‍💼 User-Facing
- **Tour catalog** with search, filtering (price, region, duration, rating), and sorting
- **Lazy-loaded images** with an in-memory LRU cache and skeleton loaders
- **Tour detail pages** with gallery carousel, seat availability progress bar, and booking form
- **LiqPay payment integration** — inline widget with sandbox support
- **Guest bookings** — no account required (tracked via anonymous tokens)
- **Authenticated bookings** — linked to user profiles with full history
- **Booking management** — view, cancel (pending only), and rate confirmed tours
- **Favorites** — save and manage preferred tours
- **Comments & replies** — nested comment threads with like/dislike reactions
- **Star ratings** — only verified buyers (confirmed bookings) can rate tours
- **User profile** — editable name, phone, avatar

### 🔐 Authentication
- JWT-based auth (24h expiry, configurable)
- Role-based access: `user` and `admin`
- Optional JWT middleware for guest-friendly endpoints
- Rate limiting on auth endpoints (5 req/min)

### 🛠 Admin Dashboard
- **Analytics overview**: total tours, bookings, users, revenue
- **Charts**: bookings by month (bar), revenue trend (line), status distribution (pie), popular tours (horizontal bar)
- **Booking management**: filter by status, update status (pending/confirmed/cancelled), export CSV
- **Tour management**: create/edit/delete tours with dates, gallery, locations
- **User management**: view profiles and booking history
- **Image upload**: card images and gallery photos (JPG, PNG, WebP, max 5MB)

### 📧 Email Notifications
Transactional emails sent via Gmail SMTP for:
- Booking created (pending)
- Booking confirmed by admin
- Booking cancelled
- Payment received via LiqPay
- Payment reversed

---

## Project Structure

```
.
├── tour/                          # React frontend
│   └── src/
│       ├── components/            # Shared UI components
│       │   ├── Navbar/
│       │   ├── Auth/              # Login & register modals
│       │   ├── FavoriteButton/
│       │   ├── TourComments/      # Threaded comments
│       │   └── OptimizedImage/    # Lazy-loading image wrapper
│       ├── pages/
│       │   ├── Main/              # Home page + hero swiper
│       │   ├── Tours/             # Catalog with filters
│       │   ├── TourDetails/       # Tour page + booking form
│       │   ├── Bookings/          # User booking history
│       │   ├── Favorites/         # Saved tours
│       │   ├── Profile/           # User profile
│       │   └── Admin/             # Admin dashboard
│       ├── hooks/                 # Custom React hooks
│       ├── services/              # API client classes
│       ├── context/               # Auth context
│       └── types/                 # TypeScript types
│
└── tour-server/                   # Go backend
    ├── server.go                  # Entry point & route registration
    ├── config/                    # YAML config + env overrides
    ├── database/                  # DB connection
    ├── middleware/                 # JWT, admin, rate limiter, validation
    ├── email/                     # SMTP service + HTML templates
    ├── liqpay/                    # LiqPay sign/encode/verify
    ├── admin/api/                 # Admin endpoints
    ├── bookings/                  # Booking CRUD
    ├── tour/                      # Tour endpoints
    ├── tourusers/                 # Auth & user profile
    ├── tourcomments/              # Comments & reactions
    ├── tourreviews/               # Legacy reviews
    ├── tourratings/               # Star ratings
    ├── tourseats/                 # Seat availability
    ├── search/                    # Full-text + filtered search
    ├── userfavorites/             # Favorites
    └── liqpay/api/                # Payment endpoints
```

---

## Getting Started

### Prerequisites
- **Go 1.21+**
- **Node.js 18+**
- **PostgreSQL 14+**

### 1. Database

Create the database and user:

```sql
CREATE USER touruser WITH PASSWORD 'tourpass123';
CREATE DATABASE tourdb OWNER touruser;
```

Run your schema migrations (tables: `tours`, `tour_dates`, `tour_seats`, `bookings`, `tour_users`, `tour_reviews`, `tour_review_likes`, `tour_ratings`, `tour_user_favorites`, `tour_card_images`, `tour_gallery_images`, `locations`, `statuses`).

The `bookings` table requires two PostgreSQL triggers:

```sql
-- Decrement seats on INSERT
CREATE TRIGGER trg_decrease_seats
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION decrease_available_seats();

-- Restore seats on DELETE
CREATE TRIGGER trg_restore_seats
  AFTER DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION restore_available_seats();
```

### 2. Backend

```bash
cd tour-server

# Copy and configure environment
cp .env.example .env
# Edit .env with your secrets (see Environment Variables below)

# Run the server
go run server.go
```

The API will be available at `http://127.0.0.1:1323`.

### 3. Frontend

```bash
cd tour

npm install

# Create .env
echo "REACT_APP_API_URL=http://127.0.0.1:1323" > .env

npm start
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

### Backend (`tour-server/.env`)

| Variable | Description | Required |
|---|---|---|
| `JWT_SECRET` | Secret key for signing JWT tokens | ✅ |
| `DB_PASSWORD` | PostgreSQL password override | ✅ |
| `SMTP_USER` | Gmail address for outgoing mail | ☑️ |
| `SMTP_PASSWORD` | Gmail App Password | ☑️ |
| `SMTP_FROM` | Display name + address | ☑️ |
| `LIQPAY_PUBLIC_KEY` | LiqPay public key | ☑️ |
| `LIQPAY_PRIVATE_KEY` | LiqPay private key | ☑️ |
| `LIQPAY_CALLBACK_URL` | Public URL for payment callbacks | ☑️ |

> ☑️ = Optional but required to enable that feature. Email and payments are gracefully disabled if unconfigured.

### Frontend (`tour/.env`)

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend base URL (no trailing slash) |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Login, returns JWT |

### Tours (Public)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/cards` | All active tours (card format) |
| `GET` | `/tours/:id` | Tour detail |
| `GET` | `/search` | Filtered search with pagination |
| `GET` | `/tour-seats/:id` | Available seats by tour |
| `GET` | `/tour-carousel/:id` | Gallery images |
| `GET` | `/tour-reviews/:id` | Reviews |
| `GET` | `/tour-comments/:id` | Paginated comments + replies |

### Bookings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/tour/bookings` | Optional | Create booking (guest or user) |
| `GET` | `/user-bookings` | Required | Current user's bookings |
| `PUT` | `/bookings/:id/cancel` | Required | Cancel pending booking |

### Payments
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/liqpay/create-payment` | Generate LiqPay widget params |
| `POST` | `/liqpay/confirm` | Confirm payment from widget callback |
| `POST` | `/liqpay/callback` | Server-side webhook from LiqPay |

### User
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/profile` | Required | Get profile |
| `PUT` | `/profile` | Required | Update profile |
| `POST/GET/DELETE` | `/user-favorites` | Required | Manage favorites |
| `POST` | `/tour-ratings` | Required | Rate a tour |
| `GET` | `/tour-ratings/:id/my` | Required | Get own rating |

### Admin (requires `admin` role)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/analytics/overview` | Stats summary |
| `GET` | `/admin/analytics/bookings-by-month` | Booking chart data |
| `GET` | `/admin/analytics/revenue-by-month` | Revenue chart data |
| `GET` | `/admin/analytics/popular-tours` | Top tours by bookings |
| `GET/PUT` | `/admin/bookings` | List & update booking status |
| `GET` | `/admin/bookings/export` | Export CSV |
| `GET` | `/admin/users/:id` | User detail + booking history |
| `GET/POST` | `/admin/tours` | List & create tours |
| `GET/PUT/DELETE` | `/admin/tours/:id` | Tour detail, update, deactivate |
| `GET` | `/admin/locations` | Available locations |
| `POST` | `/admin/upload` | Upload image |

---

## Database Schema

### Key relationships

```
tours
  ├── tour_dates (tour_id → tours.id)
  │     └── tour_seats (tour_date_id → tour_dates.id)
  ├── tour_card_images (tour_id)
  ├── tour_gallery_images (tour_id)
  └── tour_ratings (tour_id + user_id)

bookings
  ├── tour_date_id → tour_dates.id
  └── user_id → tour_users.id (nullable for guests)

tour_reviews (comments)
  ├── tour_id, user_id
  ├── parent_id → tour_reviews.id (for replies)
  └── tour_review_likes (review_id, user_id | guest_token)
```

### Seat management

Seat inventory is controlled by PostgreSQL triggers on the `bookings` table:
- `BEFORE INSERT` → decrements `tour_seats.available_seats`
- `AFTER DELETE` → restores `tour_seats.available_seats`

Status changes that affect seat counts (e.g. cancelling a confirmed booking) are handled manually in the application layer since triggers only fire on INSERT/DELETE, not UPDATE.

---

## Security

| Concern | Implementation |
|---|---|
| Password storage | `bcrypt` with default cost |
| Authentication | Signed HS256 JWT, 24h expiry |
| Authorization | Role-based middleware (`user` / `admin`) |
| SQL injection | GORM parameterized queries throughout; raw SQL uses `?` placeholders |
| Input sanitization | HTML tag stripping, control character removal, length enforcement |
| Rate limiting | Token bucket per IP: 5/min auth, 10/min bookings, 5/min payments |
| Price tampering | Total price is **always recalculated server-side** from `DB price × seats`; client-submitted price is ignored |
| Payment verification | LiqPay signatures verified with SHA-1 before any booking state change |
| LiqPay idempotency | `payment_status = 'paid'` check prevents double-confirmation |
| Static files | ETags + `Cache-Control: immutable` for images |
| HTTP headers | XSS protection, nosniff, HSTS, frame options via Echo Secure middleware |

---

## Screenshots

| Page | Description |
|---|---|
| `/` | Home page with hero swiper carousel |
| `/Tours` | Catalog with inline filter panel and sort controls |
| `/TourDetails/:id` | Tour hero, gallery thumbnails, booking card with LiqPay |
| `/bookings` | User booking history with status chips and rating modal |
| `/favorites` | Saved tours grid with quick-book button |
| `/admin` | Analytics dashboard with 4 chart types |
| `/admin/bookings` | Booking table with status filter tabs and CSV export |
| `/admin/tours` | Tour CRUD with date/location/image management |

---

## License

This project was created as a university term paper. All rights reserved.