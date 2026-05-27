# Vendora — E-Commerce Platform

A full-stack e-commerce web application for managing products, customers, orders, and payments.

**Frontend:** React 19 · Vite 8 · React Router 7  
**Backend:** ASP.NET Core 10 · C# 14 · Entity Framework Core  
**Database:** MySQL 8.4  
**Payments:** Stripe Checkout (test mode)  
**Tests:** NUnit 4.x (32 automated tests)

---

## Prerequisites

| Tool | Version |
|------|---------|
| .NET SDK | 10.0+ |
| Node.js | 20+ |
| npm | 10+ |
| MySQL Server | 8.4+ |

---

## Configuration

### 1. Database

Make sure MySQL is running on `localhost:3306`. Then edit the connection string in [`Vendora.Api/appsettings.json`](Vendora.Api/appsettings.json):

```json
"ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=VendoraDB;User=root;Password=YOUR_PASSWORD;"
}
```

### 2. Stripe (optional — for payment processing)

Set your Stripe **test mode** secret key in the same file:

```json
"Stripe": {
    "SecretKey": "sk_test_..."
}
```

> Use [Stripe Test Mode](https://docs.stripe.com/testing) with card `4242 4242 4242 4242`, any future expiry, and any CVC.

---

## Build & Run

### Backend (ASP.NET Core API)

```bash
# Navigate to the API project
cd Vendora.Api

# Apply database migrations (creates VendoraDB and seeds data automatically)
dotnet ef database update

# Build and run the API (http://localhost:5169)
dotnet run
```

### Frontend (React SPA)

```bash
# From the repository root
npm install
npm run dev
# → Opens at http://localhost:5173
```

> Both the backend and frontend must be running simultaneously.

### Default Admin Account

| Field | Value |
|-------|-------|
| Email | `admin@vendora.com` |
| Password | `adminvendora` |

---

## Testing

The project includes **32 automated tests** using the **NUnit** framework (C# dedicated test framework).

```bash
# Run all tests from the repository root
dotnet test

# Run with detailed output
dotnet test --verbosity normal
```

### Test Breakdown

| Category | Count | Description |
|----------|-------|-------------|
| Internal Algorithm Tests | 7 | BCrypt hashing/verification, password validation, timestamp generation |
| Model & Business Rule Tests | 9 | Entity defaults, soft-delete, audit log fields, category hierarchy |
| Integration Tests (API + DB) | 16 | Registration, login, JWT, product CRUD, SKU uniqueness, view counter |
| **Total** | **32** | All passing ✅ |

### Test Files

```
Vendora.Tests/
├── UnitTests/
│   ├── AuthenticationTests.cs    # BCrypt algorithm tests (6 tests)
│   └── ModelTests.cs             # Model default/business rule tests (9 tests)
├── IntegrationTests/
│   ├── AuthControllerTests.cs    # Registration & login flow (5 tests)
│   ├── DatabaseIntegrityTests.cs # Seed data & schema integrity (6 tests)
│   └── ProductsControllerTests.cs# Product API endpoint tests (6 tests)
└── Helpers/
    └── TestDbContextFactory.cs   # In-memory DB factory for integration tests
```

---

## Project Structure

```
Vendora/
├── src/                            # React 19 frontend (Vite)
│   ├── components/                 # Layout, Navbar, Footer, ProductCard, etc.
│   ├── context/                    # AuthContext, CartContext, WishlistContext, ToastContext
│   ├── pages/                      # Customer pages (Home, Products, Cart, Checkout, etc.)
│   │   └── admin/                  # Admin pages (Dashboard, Products, Orders, Reviews)
│   └── utils/                      # API client, constants, formatters
├── Vendora.Api/                    # ASP.NET Core 10 REST API
│   ├── Controllers/                # 9 API controllers
│   ├── Models/                     # 14 entity/request models
│   ├── Data/                       # DbContext + DataSeeder
│   ├── Services/                   # Background workers
│   └── Migrations/                 # 16 EF Core migrations
├── Vendora.Tests/                  # NUnit test suite (32 tests)
├── scripts/                        # Database backup script
└── docs/                           # SRS documentation
```

---

## Features

### Customer Features
- **Registration & Login** — email uniqueness validation, BCrypt password hashing, JWT authentication, account lockout (5 attempts / 15 min)
- **Product Browsing** — search, category/price/rating filters, sorting, pagination (20/page)
- **Shopping Cart** — per-user persistence, stock validation, real-time totals, free shipping progress
- **Checkout** — saved addresses, promo code (`SALE10` for 10% off ≥$50), Stripe payment
- **Order Tracking** — status timeline, order history
- **Wishlist** — save products, move to cart
- **Reviews** — 1–5 star rating (delivered orders only), average rating display
- **Profile** — edit info, manage addresses, change password, GDPR account deletion

### Admin Features
- **Dashboard** — real-time revenue, orders today, top 5 customers/products, CSV export
- **Product Management** — CRUD, multi-image upload, soft-delete, SKU enforcement
- **Order Management** — status workflow, order cancellation with stock replenishment
- **Review Moderation** — soft-delete inappropriate reviews
- **Audit Logging** — tracks all admin actions with Admin ID, timestamp, and details

---

## Tech Stack Details

### Backend Packages

| Package | Version | Purpose |
|---------|---------|---------|
| Entity Framework Core | 10.0.7 | ORM (LINQ to SQL) |
| MySql.EntityFrameworkCore | 10.0.7 | MySQL provider |
| BCrypt.Net-Next | 4.1.0 | Password hashing |
| JwtBearer Authentication | 10.0.7 | JWT token auth |
| Stripe.net | 51.1.0 | Payment processing |

### Frontend Packages

| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.2.4 | UI library |
| React Router DOM | 7.15.0 | Client-side routing |
| Vite | 8.0.4 | Build tool & dev server |

---

## License

This project was developed as part of an academic coursework assignment.
