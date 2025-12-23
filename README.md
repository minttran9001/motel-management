# Motel Management System

A modern Next.js application for managing small motels with room management, hourly pricing, and expense tracking features.

<!-- Auto-deployment test -->

## Features

- **Authentication**: Secure login system using Auth.js (NextAuth.js v5)
- **Room Status Grid**: Visual grid for quick check-in and check-out management
- **Room Management**: Manage rooms with categories (VIP, Regular) and bed configurations
- **Hourly Pricing**: Manage hourly rates with configurable first hours and additional hour prices
- **Expense Management**: Track external fees like electricity, water, maintenance, and staff salaries
- **Price Calculator**: Calculate booking prices based on check-in and check-out times
- **Discount Management**: Create and manage discounts (percentage or fixed amount) for rooms
- **Financial Statistics**: Track total income, expenses, and net profit by day, week, month, or year
- **Multi-language Support**: English and Vietnamese (Tiếng Việt)
- **Modern Sidebar UI**: Streamlined navigation with a responsive sidebar layout
- **MongoDB Database**: Uses MongoDB for robust data storage

## Tech Stack

- Next.js 16 (App Router)
- Auth.js v5 (NextAuth.js)
- TypeScript
- MongoDB with Mongoose
- Tailwind CSS
- next-intl for internationalization

## Getting Started

### Prerequisites

- Node.js 20.19.0 or higher
- MongoDB (local or cloud instance)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your MongoDB connection string and Auth.js secret:
```
MONGODB_URI=mongodb+srv://your-uri
AUTH_SECRET=your-very-secure-secret-here
```

### Initial Admin Setup

After starting the server, you can create the initial admin user by visiting:
[http://localhost:3000/api/seed-admin](http://localhost:3000/api/seed-admin)

**Default Credentials:**
- **Email:** `admin@motel.com`
- **Password:** `admin123`

### Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
motel-management/
├── app/
│   ├── [locale]/          # Internationalized routes
│   │   ├── dashboard/     # Dashboard & Revenue reports
│   │   ├── room-status/   # Visual grid management
│   │   ├── expenses/      # External cost management
│   │   ├── rooms/         # Room configuration
│   │   ├── hourly-pricing/# Hourly rate rules
│   │   ├── discounts/     # Discount management
│   │   └── login/         # Login page
│   └── api/               # API routes
│       ├── auth/          # NextAuth API endpoints
│       ├── rooms/         # Room & Check-in/out endpoints
│       ├── hourly-pricing/# Pricing rule endpoints
│       ├── expenses/      # Expense endpoints
│       └── revenue/       # Financial aggregation endpoints
├── components/            # Shared React components (Sidebar, Modals)
├── lib/                   # Business logic (Price Calculator, DB connection)
├── models/                # MongoDB Mongoose models
├── messages/              # Translation JSON files (en, vi)
└── middleware.ts          # i18n and Auth protection middleware
```

## Usage

### Room Management
- Add rooms with category (VIP/Regular) and bed count
- Track real-time room availability via the Status Grid

### Financial Management
- Configure complex hourly pricing rules with daily caps
- Record external costs in the Expenses section
- Monitor real-time net profit on the Dashboard

### Check-in/Out Process
- Record guest ID and origin during check-in
- Preview calculated bills before checkout
- Manually adjust final amounts for additional fees or discounts

## Language Support

The application supports two languages:
- English (en)
- Vietnamese (vi)

Switch languages using the toggle at the bottom of the sidebar.

## License

MIT
