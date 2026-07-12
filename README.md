# <img src="https://img.shields.io/badge/🚌-TransitOps-pink?style=flat-square" alt="TransitOps"> TransitOps

<div align="center">
---

## 👥 Team Contributors

| Name | Role | College | Graduation Year | Email / Phone | GitHub |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **[Nirbhay]** | Team Leader | [Nirma University] | 2028 | [24bce268@nirmauni.ac.in](mailto:24bce268@nirmauni.ac.in) / [8320586268] | [@itatshu](https://github.com/itatshu) |
| **[Het]** | Backend Engineer | [Nirma University] | 2028 | [24bce261@nirmauni.ac.in](mailto:24bce261@nirmauni.ac.in) / [9023226077] | [@Het6518](https://github.com/Het6518) |
| **[Darshan]** | Full-Stack Engineer | [Nirma University] | 2028 | [24bce233@nirmauni.ac.in](mailto:24bce233@nirmauni.ac.in) / [9328325601] | [@darshanNhb](https://github.com/darshanNhb) |
| **[Jenil]** | Frontend Engineer | [Nirma University] | 2028 | [24bce267@nirmauni.ac.in](mailto:24bce267@nirmauni.ac.in) / [9316130701] | [@MLinej](https://github.com/MLinej) |

---

<h3>⚡ Smart Transport Operations & Fleet Management System</h3>

<p><em>From scattered spreadsheets to unified intelligence — keep your fleet running at peak performance.</em></p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
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
- [License](#-license)

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
│                 SQLite Database Layer                       │
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
| **SQLite** | Primary relational database |

---

## 📂 Project Structure

```
transitops/
│
├── backend/
│   ├── prisma/               # Database schema and seed data
│   ├── src/
│   │   ├── config/           # Database and env config
│   │   ├── controllers/      # API Request handlers
│   │   ├── middleware/       # Auth and error handling
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic and cron jobs
│   │   └── server.js         # Express server entry point
│   └── .env                  # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios client config
│   │   ├── components/       # Reusable UI components (Sidebar, Topbar)
│   │   ├── context/          # React Context (Auth)
│   │   ├── pages/            # Dashboard, Vehicles, Drivers, Analytics, etc.
│   │   └── App.jsx           # Root router
│   └── .env                  # Frontend environment variables
│
├── package.json
└── README.md
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
- SQLite (via Prisma)

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
DATABASE_URL=file:./dev.db

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

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built to power a smarter, safer, and more efficient transport future.**

*TransitOps — Track. Optimize. Perform.*

</div>
