# TransitOps — Team Developer Log & Change Ledger

This document acts as the central coordinator for the 4-member hackathon team and records all changes made to the codebase by both team members and the AI assistant.

---

## 1. Team Assignments & File Ownership

| Member | Role | Responsibilities | Files Owned / Developed |
|---|---|---|---|
| **Karunesh (You)** | Backend – Core & Identity | Auth, Users, Roles, Vehicle Registry, Driver Management, Dashboard KPI aggregation, Seed script, API integration coordination | `backend/src/routes/auth.js`, `backend/src/routes/vehicles.js`, `backend/src/routes/drivers.js`, `backend/src/routes/dashboard.js`, `backend/src/models/User.js`, `backend/src/models/Vehicle.js`, `backend/src/models/Driver.js`, `backend/src/seed.js` |
| **Suhail** | Backend – Trip Management | Trip lifecycle + cascade rules (Draft→Dispatched→Completed→Cancelled), Maintenance workflow | `backend/src/routes/trips.js`, `backend/src/routes/maintenance.js`, `backend/src/models/Trip.js`, `backend/src/models/Maintenance.js` |
| **Kanishka** | Backend – Fuel & Analytics | Fuel logging, General expense logging, Reports & Analytics, CSV export | `backend/src/routes/fuelLogs.js`, `backend/src/routes/expenses.js`, `backend/src/routes/reports.js`, `backend/src/models/FuelLog.js`, `backend/src/models/Expense.js` |
| **Jai** | Frontend – All Screens | Login, Signup, App Shell Layout, Dashboard, Vehicles, Drivers, Trips, Maintenance, Fuel & Expenses, Reports (Recharts & CSV) | `frontend/src/pages/*`, `frontend/src/components/Layout.jsx`, `frontend/src/context/AuthContext.jsx` |

---

## 2. Environment Configuration

### Backend
- **Port:** `5000` (API Base: `http://localhost:5000/api`)
- **DB:** MongoDB Atlas (`projects.7ozupg6.mongodb.net/transitops`)
- **Key Files:** `backend/.env`, `backend/src/index.js`
- **Commands:**
  - Start Server: `npm run dev`
  - Seed DB: `npm run seed`

### Frontend
- **Port:** `5173` (Base: `http://localhost:5173`)
- **Key Files:** `frontend/.env`, `frontend/src/main.jsx`
- **Commands:**
  - Start Client: `npm run dev`
  - Build Assets: `npm run build`

### Demo Login Credentials
| Role | Email | Password |
|---|---|---|
| Fleet Manager | `manager@transitops.com` | `password` |
| Driver | `alex@transitops.com` | `password` |

---

## 3. Change Ledger (Update with Name/AI on each change)

Please record all manual or AI-assisted updates to the codebase below.

| Date / Time | Author | Component / Area | Description of Changes | Impacted Files |
|---|---|---|---|---|
| 2026-07-12 10:39 | **Antigravity (AI)** | Frontend Setup | Enabled Tailwind CSS Vite compilation & fixed syntax warning | `frontend/vite.config.js`, `frontend/src/index.css` |
| 2026-07-12 10:42 | **Antigravity (AI)** | Frontend Setup | Configured path aliases `@/*` and initialized shadcn/ui Nova preset | `frontend/jsconfig.json`, `frontend/vite.config.js` |
| 2026-07-12 10:43 | **Antigravity (AI)** | Frontend Setup | Installed Shadcn UI components (button, card, dialog, input, label, select, table, tabs, dropdown-menu) | `frontend/src/components/ui/*` |
| 2026-07-12 10:48 | **Antigravity (AI)** | Backend Setup | Initialized Node project, installed dependencies, configured database connection and index router | `backend/package.json`, `backend/.env`, `backend/src/index.js`, `backend/src/config/db.js` |
| 2026-07-12 10:50 | **Antigravity (AI)** | Backend Setup | Implemented all Mongoose Schemas (User, Vehicle, Driver, Trip, Maintenance, FuelLog, Expense) | `backend/src/models/*` |
| 2026-07-12 10:52 | **Antigravity (AI)** | Backend Setup | Created Authentication and Role-Based Access Control middleware | `backend/src/middleware/auth.js` |
| 2026-07-12 10:55 | **Antigravity (AI)** | Backend Setup | Built API route controllers matching all required end-to-end endpoints | `backend/src/routes/*` |
| 2026-07-12 10:58 | **Antigravity (AI)** | Backend Setup | Wrote sample database seeder script containing mock users, active/completed trips, and logs | `backend/src/seed.js` |
| 2026-07-12 11:02 | **Antigravity (AI)** | Frontend Code | Implemented Axios interceptor client and Global Auth Context for session persistence | `frontend/src/services/api.js`, `frontend/src/context/AuthContext.jsx` |
| 2026-07-12 11:05 | **Antigravity (AI)** | Frontend Code | Configured React Router routes, Protected Route guards, and layout sidebar navigation | `frontend/src/App.jsx`, `frontend/src/components/Layout.jsx` |
| 2026-07-12 11:10 | **Antigravity (AI)** | Frontend Code | Programmed complete page shells and interactive modals for all application screens | `frontend/src/pages/*` |
| 2026-07-12 11:20 | **Antigravity (AI)** | Git Config | Updated root .gitignore to ignore node_modules, dist and .env for both frontend and backend, while tracking .env.example and lockfiles | `.gitignore` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Bug Fix | Fixed `#root` CSS constraint (1126px width + centered text) that broke full-screen sidebar layout | `frontend/src/index.css` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Bug Fix | Removed global `h1 { font-size: 56px }` CSS override that conflicted with Tailwind per-component heading sizes | `frontend/src/index.css` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Backend – Dashboard | Expanded `/api/dashboard/kpis` to return `completedTrips`, `avgFuelEfficiency`, and `expiringLicenses` count | `backend/src/routes/dashboard.js` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Backend – Drivers | Added `GET /api/drivers/:id`, `GET /api/drivers/expiring-licenses`, `PATCH /api/drivers/:id/status` with On-Trip guard; auto-suspend on safety score < 40 | `backend/src/routes/drivers.js` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Backend – Vehicles | Added `GET /api/vehicles/:id`, `PATCH /api/vehicles/:id/retire` with On-Trip and open-maintenance guards, sort query param support | `backend/src/routes/vehicles.js` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Backend – Auth | Added `PUT /api/auth/profile` (self-service name/password update) and `PATCH /api/auth/users/:id/status` (manager deactivation) | `backend/src/routes/auth.js` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Backend – Reports | Extracted shared `buildRoiRows()` helper to eliminate duplicated DB query logic between `/roi` and `/export` endpoints | `backend/src/routes/reports.js` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Backend – Model | Expanded `Expense.type` enum to include `parking`, `incidental`, `fuel` in addition to `toll` and `other` | `backend/src/models/Expense.js` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Frontend – API Service | Refactored `api.js` into fully typed domain helpers (vehicleAPI, driverAPI, tripAPI, dashboardAPI, reportsAPI, etc.) for team-wide consumption | `frontend/src/services/api.js` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Frontend – Dashboard | Expanded from 4 to 6 KPI cards (+ Completed Trips, + Avg Fuel Efficiency); added license expiry alert banner and fleet status live summary | `frontend/src/pages/Dashboard.jsx` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Frontend – Vehicles | Added status filter dropdown, Retire Vehicle action with confirmation dialog, clickable cost summary panel per row | `frontend/src/pages/Vehicles.jsx` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Frontend – Drivers | Added license expiry color highlights (red=expired, amber=≤30 days), status filter dropdown, per-row Change Status dropdown for managers | `frontend/src/pages/Drivers.jsx` |
| 2026-07-12 17:15 | **Antigravity (AI)** | Backend – Seed | Added 4th driver (expiring license demo), 2nd completed trip (fuel efficiency data), fuel logs & expenses for all 3 vehicles (ROI chart demo data) | `backend/src/seed.js` |

---

## 4. Work Coordination Guidelines

1. **No Out-of-Scope Work:** Keep PDF generation, email reminders, and document uploads disabled. Stick strictly to the features listed in Section 5 of the Roadmap.
2. **Status Transitions:** Never write `vehicle.status = 'On Trip'` directly on the frontend. Invoke the `/dispatch` or `/complete` POST actions on the backend, and let the backend cascade the status changes.
3. **Avoid Conflicts:** Coordinate edits to shared folders like `/models` or shared config files before writing changes.
4. **API Service Layer:** Use the typed helpers in `frontend/src/services/api.js` (e.g. `vehicleAPI.getAll()`, `driverAPI.changeStatus()`) instead of raw `api.get(...)` strings in components.

