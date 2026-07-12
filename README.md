# <img src="https://img.shields.io/badge/🚌-TransitOps-pink?style=flat-square" alt="TransitOps"> TransitOps

<div align="center">
---

## 👥 Team Contributors

| Name | Role | College | Graduation Year | Email / Phone | GitHub |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **[Darshan Buddhdev]** | Team Leader | [Nirma University] | 2028 | [24bce233@nirmauni.ac.in](mailto:24bce233@nirmauni.ac.in) / [9328325601] | [@darshanNhb](https://github.com/darshanNhb) |
| **[Jash Patel]** | Backend Engineer | [Nirma University] | 2028 | [24bce222@nirmauni.ac.in](mailto:24bce222@nirmauni.ac.in) / [7984203594] | [@JashPatel29](https://github.com/JashPatel29) |
| **[Darshit Kamdar]** | Frontend Engineer | [Nirma University] | 2028 | [24bce231@nirmauni.ac.in](mailto:24bce231@nirmauni.ac.in) / [9313760374] | [@Dak-03](https://github.com/Dak-03) |
| **[Yash Pipaliya]** | Frontend Engineer | [Nirma University] | 2028 | [24bam039@nirmauni.ac.in](mailto:24bam039@nirmauni.ac.in) / [6352625236] | [@yashpipaliya07](https://github.com/yashpipaliya07) |

---

<h3>⚡ Smart Transport Operations & Fleet Management System</h3>

<p><em>From scattered spreadsheets to unified intelligence — keep your fleet running at peak performance.</em></p>

[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)
[![SQLite](https://img.shields.io/badge/SQLite-Enabled-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)

<br/>

> **TransitOps** is an end-to-end fleet management platform that transforms raw vehicle, driver, and trip data into **actionable maintenance insights, revenue analytics, and operational efficiency** — helping transport companies optimize their daily workflows.

</div>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Dashboard Pages](#-dashboard-pages)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Future Roadmap](#-future-roadmap)

---

## ⚡ Problem Statement

Transport and logistics companies manage vast amounts of data — vehicle maintenance schedules, driver profiles, fuel logs, and trip dispatching. Despite this data abundance, many systems remain heavily reliant on manual tracking, fragmented tools, and reactive planning.

| Challenge | Impact |
|---|---|
| 🔴 Reactive maintenance | Vehicles break down unexpectedly, causing delays |
| 🔴 Fragmented data silos | Hard to track fuel costs, driver performance, and ROI |
| 🔴 Manual license tracking | Risk of compliance violations due to expired licenses |
| 🔴 No real-time analytics | Poor financial visibility and operational bottlenecks |

**TransitOps** solves all of these by providing a **centralized, automated dashboard**, shifting fleet management from reactive firefighting to **predictive, data-driven operations**.

---

## 🚀 Key Features

### 🔍 Fleet & Vehicle Management
Track vehicle lifecycles, purchase costs, odometers, and active statuses all in one place. Includes automated ROI calculations for each vehicle based on its revenue vs operating costs.

### ⏱ Driver Compliance & Scheduling
Manage driver profiles, experience, safety scores, and salaries. Includes an automated background cron job that sends **7-day email reminders** before driver licenses expire.

### 🧠 Advanced Analytics & ROI Breakdown
Comprehensive charts providing insights into:
- Monthly Revenue (formatted with Indian Rupee compact notation)
- Fuel Efficiency & Total Operating Expenses
- Top Costliest Vehicles
- Vehicle ROI Breakdown Tables

### 📊 Trip Dispatch & Tracking
End-to-end trip lifecycle management: Schedule, Dispatch, Cancel, or Complete trips. Log planned vs actual distances, revenues, and automated status tracking.

### 🔧 Maintenance & Expense Logging
Log fuel entries, tolls, service costs, and maintenance records. Automatically associates expenses with specific vehicles and calculates profitability in real-time.

### 📄 Report Generation
One-click downloadable analytics reports (PDF/CSV) for management, compliance audits, and financial records.

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)                   │
│    (Tailwind CSS · Recharts · React Hook Form · Lucide)     │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (JSON)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)               │
│                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │   Auth   │  │ Drivers  │  │ Vehicles │  │ Expenses │  │
│   │ & Users  │  │ & Trips  │  │ & Maint. │  │ & Fuel   │  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│        └─────────────┴──────────────┴──────────────┘        │
│                Service Layer & Business Logic               │
└──────────────────────────┬──────────────────────────────────┘
                           │ Prisma ORM
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 SQLite Database Layer                   │
│   (Relational Schema with Cascading Deletes & Indexing)     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 Background Cron Services                    │
│    (Nodemailer + Node-Cron for License Expiry Alerts)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React.js 18** | UI framework |
| **Tailwind CSS** | Styling and responsive layout |
| **React Hook Form** | Form validation and state management |
| **Zod** | Schema validation |
| **Recharts** | Analytics visualizations |
| **jsPDF & autoTable** | PDF Report Generation |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | REST API server |
| **Prisma ORM** | Database access layer & Schema migrations |
| **JWT** | Secure session authentication |
| **Bcrypt** | Password hashing |
| **Node-Cron** | Automated background tasks |
| **Nodemailer** | SMTP email notifications |

### Database
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary relational database |
### Database Schema (ER Diagram)

```mermaid
erDiagram
    %% 1. TENANCY MODULE
    ORGANIZATION {
        String id PK
        String name
        String slug
        String currency
    }

    %% 2. AUTHENTICATION & RBAC
    USER {
        String id PK
        String email
        String status
        String roleId FK
        String organizationId FK
    }
    ROLE {
        String id PK
        String name
        String organizationId FK
    }
    PERMISSION {
        String id PK
        String resource
        String action
    }
    ROLE_PERMISSION {
        String roleId PK, FK
        String permissionId PK, FK
    }
    REFRESH_TOKEN {
        String id PK
        String token
        String userId FK
    }

    %% 3. FLEET & DRIVER
    VEHICLE {
        String id PK
        String registrationNumber
        String status
        Int currentOdometer
        String organizationId FK
    }
    DRIVER {
        String id PK
        String employeeCode
        String status
        Float safetyScore
        String organizationId FK
    }
    TRIP {
        String id PK
        String tripNumber
        String status
        String vehicleId FK
        String driverId FK
        String organizationId FK
    }

    %% 4. MAINTENANCE & FUEL
    MAINTENANCE {
        String id PK
        String serviceType
        String status
        String vehicleId FK
    }
    FUEL_LOG {
        String id PK
        Float fuelQuantity
        Decimal totalCost
        String vehicleId FK
    }

    %% 5. FINANCE
    EXPENSE {
        String id PK
        String category
        Decimal amount
        String vehicleId FK
        String tripId FK
        String maintenanceId FK
    }

    %% 6. GLOBAL
    ATTACHMENT {
        String id PK
        String fileName
        String fileUrl
    }
    ACTIVITY_LOG {
        String id PK
        String action
        String resource
    }
    NOTIFICATION {
        String id PK
        String type
        String status
    }

    %% ==========================================
    %% RELATIONSHIPS
    %% ==========================================

    %% Tenancy Links
    ORGANIZATION ||--o{ USER : "has"
    ORGANIZATION ||--o{ ROLE : "has"
    ORGANIZATION ||--o{ VEHICLE : "owns"
    ORGANIZATION ||--o{ DRIVER : "employs"
    ORGANIZATION ||--o{ TRIP : "manages"
    ORGANIZATION ||--o{ MAINTENANCE : "tracks"
    ORGANIZATION ||--o{ EXPENSE : "records"

    %% RBAC & Auth Links
    ROLE ||--o{ USER : "assigned to"
    ROLE ||--o{ ROLE_PERMISSION : "grants"
    PERMISSION ||--o{ ROLE_PERMISSION : "included in"
    USER ||--o{ REFRESH_TOKEN : "authenticates via"

    %% Operations Links
    VEHICLE ||--o{ TRIP : "dispatched on"
    DRIVER ||--o{ TRIP : "drives"
    VEHICLE ||--o{ MAINTENANCE : "undergoes"
    VEHICLE ||--o{ FUEL_LOG : "consumes"

    %% Finance Links
    VEHICLE ||--o{ EXPENSE : "incurs"
    TRIP ||--o{ EXPENSE : "incurs"
    MAINTENANCE ||--o{ EXPENSE : "incurs"

    %% Global Links
    USER ||--o{ ACTIVITY_LOG : "generates"
    USER ||--o{ NOTIFICATION : "receives"
    VEHICLE ||--o{ ATTACHMENT : "has"
    DRIVER ||--o{ ATTACHMENT : "has"
    TRIP ||--o{ ATTACHMENT : "has"
```

---

## 📂 Project Structure

```
TransitOps/
│
├── backend/                        # Node.js + Express API Server
│   ├── prisma/
│   │   ├── migrations/             # Auto-generated database migration history
│   │   ├── schema.prisma           # Core Database schema (Models & Relations)
│   │   └── seed.js                 # Script to inject initial mock/admin data
│   │
│   ├── src/                        # Main backend source code
│   │   ├── config/                 # Configurations (Env vars, Logger, Prisma client)
│   │   ├── constants/              # Global constants and enum values
│   │   ├── controllers/            # HTTP Handlers (Extracts request data & sends responses)
│   │   ├── helpers/                # Reusable helper functions (e.g., date formats)
│   │   ├── middleware/             # Express middlewares (Auth, Error handling, File upload)
│   │   ├── repositories/           # Data Access Layer (Direct database queries/mutations)
│   │   ├── routes/                 # API endpoint routing (e.g., /api/v1/vehicles)
│   │   ├── services/               # Business Logic, Email sending, and Cron Jobs
│   │   ├── utils/                  # Utility wrappers (ApiError, ApiResponse, Crypto, JWT)
│   │   ├── validations/            # Zod validation schemas for request bodies
│   │   ├── app.js                  # Express app initialization & middleware injection
│   │   └── server.js               # Main Entry Point (Starts the HTTP server)
│   │
│   ├── tests/                      # Integration and Unit tests
│   ├── .env                        # Environment variables (DB URL, JWT, SMTP)
│   ├── dev.db                      # SQLite local database file
│   └── package.json                # Backend dependencies and scripts
│
├── frontend/                       # React.js + Vite Web Application
│   ├── public/                     # Static assets (Favicons, external images)
│   ├── src/                        # Main frontend source code
│   │   ├── api/                    # Axios client config and HTTP interceptors
│   │   ├── components/             # Reusable UI elements (Sidebar, Topbar, Modals, Inputs)
│   │   ├── context/                # React Context Providers (AuthContext, ThemeContext)
│   │   ├── layouts/                # Page wrappers (e.g., MainLayout for protected pages)
│   │   ├── pages/                  # Full-screen views (Dashboard, Trips, Analytics, etc.)
│   │   ├── routes/                 # React Router setup (Protected vs Public routes)
│   │   ├── App.jsx                 # Root component handling routing logic
│   │   ├── index.css               # Global Tailwind CSS directives and custom styles
│   │   └── main.jsx                # React DOM rendering entry point
│   │
│   ├── vite.config.js              # Vite bundler configuration
│   ├── .env                        # Frontend env variables (e.g., VITE_API_URL)
│   └── package.json                # Frontend dependencies and scripts
│
├── .gitignore                      # Git ignore rules (ignores node_modules, .env, dev.db)
└── README.md                       # Main project documentation
```

---

## 📊 Dashboard Pages

| Page | Description |
|---|---|
| **Login** | Secure JWT-authenticated access |
| **Dashboard** | High-level metrics, active vehicles, recent trips |
| **Fleet / Vehicles** | Vehicle registry, acquisition costs, odometer tracking |
| **Drivers** | Driver profiles, safety scores, licensing, automated expiry checks |
| **Trips** | Dispatch routing, revenue logging, status updates |
| **Maintenance** | Service logs, preventive maintenance tracking |
| **Fuel & Expenses** | Fuel logging, toll records, miscellaneous operational costs |
| **Analytics** | Comprehensive ROI tables, revenue charts, CSV/PDF exports |
| **Settings** | Global preferences, Currency formatting (INR), RBAC overview |

---

## 📦 Installation

### Prerequisites

- Node.js `v18+`
- SQLite database

### Clone the Repository

```bash
git clone https://github.com/MLinej/TransitOps.git
cd TransitOps
```

### Backend Setup

```bash
cd backend
npm install
npx prisma db push         # Sync database schema
npx prisma db seed         # (Optional) Seed database with mock data
npm run dev                # Start backend server
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                # Start React app (Vite)
```

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/transitops

# Authentication
JWT_SECRET=your_jwt_secret_here

# Email SMTP (For License Reminders)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 🔮 Future Roadmap

- [ ] **Live GPS Tracking** — Real-time vehicle location monitoring
- [ ] **Mobile App** — Companion app for drivers to log fuel and trip statuses
- [ ] **Automated Maintenance Scheduling** — Work order generation based on odometers
- [ ] **AI-Powered Route Optimization** — ML models to predict most efficient delivery routes
- [ ] **Advanced RBAC** — Dynamic role creation and fine-grained permissions


---

<div align="center">

**Built to power a smarter, safer, and more efficient transport future.**

*TransitOps — Track. Optimize. Perform.*

</div>
