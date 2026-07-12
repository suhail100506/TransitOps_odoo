# TransitOps — Frontend Developer Complete Briefing
**For: Jai (Frontend)**
**Stack: React + Vite + Tailwind CSS + shadcn/ui + TanStack Query + Axios**

---

## 0. Quick Start

```bash
# Clone & install
cd frontend
npm install

# Start dev server
npm run dev          # → http://localhost:5173

# Backend must also be running
cd ../backend
npm run dev          # → http://localhost:5000

# Demo login (seed DB first: npm run seed in /backend)
Email:    manager@transitops.com
Password: password
```

---

## 1. Repo Structure You Own

```
frontend/src/
├── context/
│   └── AuthContext.jsx          ← Session state, login/logout/signup functions
├── services/
│   └── api.js                   ← Axios instance + all typed API helper functions
├── components/
│   ├── Layout.jsx               ← Sidebar + main area shell (already done)
│   └── ui/                      ← shadcn/ui components (button, card, table, etc.)
├── pages/
│   ├── Login.jsx                ← ✅ Done
│   ├── Signup.jsx               ← ✅ Done
│   ├── Dashboard.jsx            ← ✅ Done (6 KPI cards, alert banner, fleet status)
│   ├── Vehicles.jsx             ← ✅ Done (filter, retire, cost panel)
│   ├── Drivers.jsx              ← ✅ Done (expiry highlights, status change)
│   ├── Trips.jsx                ← ✅ Done (create/dispatch/complete/cancel)
│   ├── Maintenance.jsx          ← ✅ Done (open/close tickets)
│   ├── Expenses.jsx             ← ✅ Done (fuel logs + expenses, tabbed)
│   └── Reports.jsx              ← ✅ Done (3 Recharts + CSV export)
├── App.jsx                      ← Routes + ProtectedRoute guard (already done)
├── main.jsx                     ← React root + QueryClientProvider + BrowserRouter
└── index.css                    ← Tailwind + shadcn CSS vars (already configured)
```

> **Rule:** All pages live under the `ProtectedRoute` wrapper — if there's no JWT token in `localStorage`, the user is redirected to `/login` automatically.

---

## 2. Tech Stack Reference

| Tool | Purpose | Import from |
|---|---|---|
| `@tanstack/react-query` | Data fetching, caching, mutations | `@tanstack/react-query` |
| `axios` | HTTP client | already configured in `api.js` |
| `react-router-dom` | Routing & navigation | `react-router-dom` |
| `recharts` | Charts (bar, pie, line) | `recharts` |
| `lucide-react` | Icons | `lucide-react` |
| shadcn/ui | UI components | `@/components/ui/...` |

---

## 3. API Service Layer — Use These, Not Raw URLs

All API calls go through `frontend/src/services/api.js`. Import the domain helper objects:

```js
import { authAPI, vehicleAPI, driverAPI, tripAPI, dashboardAPI,
         maintenanceAPI, fuelAPI, expenseAPI, reportsAPI } from '../services/api';
```

**Base URL:** `http://localhost:5000/api`
All protected routes automatically include `Authorization: Bearer <token>` via Axios interceptor.

---

## 4. Complete API Reference

### 🔐 Auth Endpoints

#### POST `/auth/login`
```
Request body: { email: string, password: string }
Success 200:  { user: { id, name, email, role, status }, token: "eyJhbGci..." }
Error 401:    { error: "Invalid credentials" }
Error 403:    { error: "User account is inactive" }
```

#### POST `/auth/signup`
```
Request body: { name, email, password, role }
role values:  "fleet_manager" | "driver" | "safety_officer" | "financial_analyst"
Success 201:  { user: { id, name, email, role, status }, token: "..." }
Error 400:    { error: "User already exists with this email" }
```

#### GET `/auth/me`
```
Headers:      Authorization: Bearer <token>
Success 200:  { user: { id, name, email, role, status } }
```

#### PUT `/auth/profile`
```
Headers:      Authorization: Bearer <token>
Request body: { name?: string, password?: string }  (at least one required)
Success 200:  { user: { id, name, email, role, status } }
```

---

### 🚛 Vehicle Endpoints

#### GET `/vehicles`
```
Query params (all optional):
  ?status=Available|On Trip|In Shop|Retired
  ?type=Van|Flatbed|Semi-Truck|Box Truck
  ?sort=odometer|createdAt

Response 200 — array of vehicle objects:
[{
  _id, regNumber, name, model, type,
  maxLoadCapacity,   // kg (number)
  odometer,          // km (number)
  acquisitionCost,   // $ (number)
  status,            // "Available" | "On Trip" | "In Shop" | "Retired"
  createdAt          // ISO timestamp
}]
```

#### GET `/vehicles/available`
```
Returns only status="Available" vehicles.
Used for: Trip creation dropdown.
Same shape as GET /vehicles.
```

#### GET `/vehicles/:id`
```
Single vehicle object — same shape as GET /vehicles item.
```

#### POST `/vehicles`  *(fleet_manager only)*
```
Request body:
{
  regNumber: string,       // uppercased server-side
  name: string,
  model: string,
  type: "Van"|"Flatbed"|"Semi-Truck"|"Box Truck",
  maxLoadCapacity: number,
  odometer?: number,       // default 0
  acquisitionCost: number
}
Success 201: vehicle object
Error 400: { error: "Vehicle with this registration number already exists" }
```

#### PUT `/vehicles/:id`  *(fleet_manager only)*
```
Request body: any partial fields to update
Response 200: updated vehicle object
```

#### PATCH `/vehicles/:id/retire`  *(fleet_manager only, no body)*
```
Side effects: vehicle.status → "Retired"
Response 200: updated vehicle object
Error 400: { error: "Cannot retire a vehicle that is currently On Trip." }
Error 400: { error: "Cannot retire a vehicle with an open maintenance record." }
Error 400: { error: "Vehicle is already retired." }
```

#### GET `/vehicles/:id/cost-summary`
```
Response 200: { fuelCost: number, maintenanceCost: number, totalCost: number }
All values in dollars (2 decimal places).
```

---

### 👤 Driver Endpoints

#### GET `/drivers`
```
Query params (optional): ?status=Available|On Trip|Off Duty|Suspended

Response 200 — array:
[{
  _id, name, licenseNumber, licenseCategory,
  licenseExpiryDate,  // ISO timestamp
  contactNumber,
  safetyScore,        // 0–100 (number)
  status              // "Available"|"On Trip"|"Off Duty"|"Suspended"
}]
```

#### GET `/drivers/available`
```
Returns: Available drivers with non-expired licenses.
Used for: Trip creation driver dropdown.
Same shape as GET /drivers.
```

#### GET `/drivers/expiring-licenses`
```
Returns: Drivers with licenseExpiryDate within 30 days (not yet expired).
Sorted by licenseExpiryDate ascending.
Same shape as GET /drivers.
```

#### GET `/drivers/:id`
```
Single driver object — same shape as GET /drivers item.
```

#### POST `/drivers`  *(fleet_manager only)*
```
Request body:
{
  name: string,
  licenseNumber: string,        // uppercased server-side
  licenseCategory: string,      // e.g. "Heavy Rig (Class A)"
  licenseExpiryDate: string,    // "YYYY-MM-DD"
  contactNumber: string
}
Success 201: driver object (safetyScore=100, status="Available" by default)
Error 400: { error: "Driver with this license number already exists" }
```

#### PUT `/drivers/:id`  *(fleet_manager only)*
```
Request body: any partial fields to update.
NOTE: If safetyScore < 40 is sent, server auto-sets status="Suspended".
Response 200: updated driver object
```

#### PATCH `/drivers/:id/status`  *(fleet_manager only)*
```
Request body: { status: "Available"|"Off Duty"|"Suspended" }
Response 200: updated driver object
Error 400: { error: "Cannot change status of a driver who is currently On Trip." }
Error 400: { error: "Invalid status." }
```

---

### 📊 Dashboard Endpoint

#### GET `/dashboard/kpis`
```
Response 200:
{
  activeVehicles: number,       // vehicles with status="On Trip"
  availableVehicles: number,    // vehicles with status="Available"
  inMaintenance: number,        // vehicles with status="In Shop"
  activeTrips: number,          // trips with status="Dispatched"
  pendingTrips: number,         // trips with status="Draft"
  completedTrips: number,       // trips with status="Completed"
  driversOnDuty: number,        // drivers with status="On Trip"
  fleetUtilization: number,     // percentage (0–100)
  avgFuelEfficiency: number,    // km/L average across completed trips (0 if no data)
  expiringLicenses: number      // drivers with license expiring within 30 days
}
```

---

### 🗺️ Trip Endpoints

#### GET `/trips`
```
Query params (optional): ?status=Draft|Dispatched|Completed|Cancelled

Response 200 — array with POPULATED vehicle and driver refs:
[{
  _id, source, destination,
  vehicleId: { _id, regNumber, name, status },   // populated!
  driverId: { _id, name, status },               // populated!
  cargoWeight,       // kg
  plannedDistance,   // km
  actualDistance,    // km (only set after completion, otherwise 0)
  fuelConsumed,      // liters (only set after completion, otherwise 0)
  status,            // "Draft"|"Dispatched"|"Completed"|"Cancelled"
  createdAt, dispatchedAt, completedAt
}]
```

#### POST `/trips`
```
Request body:
{
  source: string,
  destination: string,
  vehicleId: string,         // ObjectId of an Available vehicle
  driverId: string,          // ObjectId of an Available driver
  cargoWeight: number,       // must be ≤ vehicle.maxLoadCapacity (server enforces)
  plannedDistance: number
}
Success 201: trip object (status="Draft")
Error 400: { error: "Cargo weight exceeds vehicle capacity..." }
Error 400: { error: "Vehicle is not available..." }
Error 400: { error: "Driver is not available..." }
```

#### POST `/trips/:id/dispatch`  *(fleet_manager only, no body)*
```
Server side effects:
  - trip.status → "Dispatched"
  - vehicle.status → "On Trip"
  - driver.status → "On Trip"
Response 200: updated trip object
Error 400: { error: "Only draft trips can be dispatched." }
Error 400: { error: "Driver license has expired..." }
```

#### POST `/trips/:id/complete`  *(fleet_manager only)*
```
Request body: { finalOdometer: number, fuelConsumed: number }
Server side effects:
  - trip.status → "Completed"
  - trip.actualDistance = finalOdometer - vehicle's previous odometer
  - trip.fuelConsumed = provided value
  - vehicle.odometer updated
  - vehicle.status → "Available"
  - driver.status → "Available"
Response 200: updated trip object
Error 400: { error: "Only dispatched trips can be completed." }
```

#### POST `/trips/:id/cancel`  *(fleet_manager only, no body)*
```
Server side effects:
  - trip.status → "Cancelled"
  - vehicle.status → "Available" (if was On Trip)
  - driver.status → "Available" (if was On Trip)
Response 200: updated trip object
Error 400: { error: "Completed trips cannot be cancelled." }
```

---

### 🔧 Maintenance Endpoints

#### GET `/maintenance`
```
Query params (optional): ?vehicleId=<id>  ?status=Open|Closed

Response 200 — array with POPULATED vehicle:
[{
  _id,
  vehicleId: { _id, regNumber, name, status },   // populated!
  description,
  cost,         // $ amount
  status,       // "Open" | "Closed"
  createdAt, closedAt
}]
```

#### POST `/maintenance`  *(fleet_manager only)*
```
Request body: { vehicleId: string, description: string, cost?: number }
Server side effects: vehicle.status → "In Shop"
Success 201: maintenance object (status="Open")
Error 400: { error: "Vehicle is already in shop." }
```

#### POST `/maintenance/:id/close`  *(fleet_manager only, no body)*
```
Server side effects:
  - maintenance.status → "Closed"
  - vehicle.status → "Available" (unless Retired)
Response 200: updated maintenance object
Error 400: { error: "Maintenance ticket is already closed." }
```

---

### ⛽ Fuel & Expense Endpoints

#### GET `/fuel-logs`
```
Response 200:
[{
  _id,
  vehicleId: { _id, regNumber, name },   // populated!
  liters, cost, date
}]
```

#### POST `/fuel-logs`
```
Request body: { vehicleId: string, liters: number, cost: number, date?: string }
Success 201: fuel log object
```

#### GET `/expenses`
```
Response 200:
[{
  _id,
  vehicleId: { _id, regNumber, name },   // populated!
  type,    // "toll"|"fuel"|"parking"|"incidental"|"other"
  amount, date
}]
```

#### POST `/expenses`
```
Request body:
{
  vehicleId: string,
  type: "toll"|"fuel"|"parking"|"incidental"|"other",
  amount: number,
  date?: string
}
Success 201: expense object
```

---

### 📈 Reports Endpoints

#### GET `/reports/fuel-efficiency`
```
Response 200 — (only vehicles with at least one completed trip):
[{
  vehicleId, regNumber, name,
  distance,     // total km across all completed trips
  fuel,         // total liters consumed
  efficiency    // km/L, 2 decimal places
}]
Empty array = no completed trips yet — show empty state, don't crash.
```

#### GET `/reports/fleet-utilization`
```
Response 200:
{
  utilizationPercent: number,
  breakdown: { onTrip, inShop, available, totalVehicles },
  byType: [{ type: string, count: number }]
}
```

#### GET `/reports/roi`
```
Response 200 — (one row per non-retired vehicle):
[{
  vehicleId, regNumber, name,
  revenue,           // $ estimated at $3.50/km per completed trip
  maintenanceCost,   // $ total
  fuelCost,          // $ total
  acquisitionCost,   // $ original purchase price
  roi                // % = ((revenue - costs) / acquisitionCost) * 100
}]
```

#### GET `/reports/export`
```
Response: CSV file stream
Content-Type: text/csv
Filename: fleet-roi-report.csv
Use Axios with { responseType: 'blob' }, create object URL, simulate anchor click.
```

---

## 5. RBAC Rules

The `user.role` comes from the JWT, accessible via `useAuth()`. Use it to show/hide action buttons.

| Action | fleet_manager | driver | safety_officer | financial_analyst |
|---|---|---|---|---|
| Register Vehicle | ✅ | ❌ | ❌ | ❌ |
| Retire Vehicle | ✅ | ❌ | ❌ | ❌ |
| Register Driver | ✅ | ❌ | ❌ | ❌ |
| Change Driver Status | ✅ | ❌ | ❌ | ❌ |
| Create Trip | ✅ | ✅ | ✅ | ✅ |
| Dispatch / Complete / Cancel Trip | ✅ | ❌ | ❌ | ❌ |
| Open Maintenance Ticket | ✅ | ❌ | ❌ | ❌ |
| Close Maintenance Ticket | ✅ | ❌ | ❌ | ❌ |
| Log Fuel / Expenses | ✅ | ❌ | ❌ | ✅ |
| View Reports | ✅ | ❌ | ✅ | ✅ |
| Export CSV | ✅ | ❌ | ✅ | ✅ |

```jsx
// Pattern:
const { user } = useAuth();
const isManager = user?.role === 'fleet_manager';

{isManager && <Button onClick={retire}>Retire</Button>}
```

---

## 6. Screen Specifications

### Dashboard (`/`) — Done
- 6 KPI cards in 3-col grid: Fleet Utilization, Active Vehicles, Drivers on Duty, Active Trips, Completed Trips, Avg Fuel Efficiency
- Amber alert banner if `expiringLicenses > 0`
- Fleet Status mini-panel: Available / On Trip / In Shop (live counts)

### Vehicle Registry (`/vehicles`) — Done
- Table with status badge, clickable row → cost summary panel
- Status filter dropdown
- Manager: Register dialog + Retire button (disabled if On Trip)

### Driver Management (`/drivers`) — Done
- Table with license expiry date color-coded (red = expired, amber = ≤30 days)
- Status filter dropdown
- Manager: Add Driver dialog + per-row Change Status dropdown (hidden if On Trip)

### Trip Dispatch (`/trips`) — Done
- Create Trip dialog: source/dest/cargo/distance, vehicle dropdown (available only), driver dropdown (available only)
- Row actions: Draft → [Dispatch] [Cancel], Dispatched → [Complete] [Cancel]
- Complete dialog: final odometer + fuel consumed

### Maintenance (`/maintenance`) — Done
- Open ticket dialog: all vehicles dropdown (filter Retired), description, cost
- "Close & Release" per Open ticket, shows date when closed

### Fuel & Expenses (`/expenses`) — Done
- Tabbed: Fuel Logs (vehicle/liters/cost) | Road Expenses (vehicle/type/amount)
- Form card + list table in each tab
- Expense types: toll, fuel, parking, incidental, other

### Reports & Analytics (`/reports`) — Done
- Fleet Allocation Donut (utilization %)
- Fuel Efficiency Bar Chart (km/L per vehicle)
- Cost vs Revenue Grouped Bar Chart (revenue/fuel/maintenance per vehicle)
- Export CSV button

---

## 7. TanStack Query Key Conventions

```js
['dashboardKpis']
['vehicles', statusFilter]     // 'All' | 'Available' | 'On Trip' | 'In Shop' | 'Retired'
['vehicleCost', vehicleId]
['drivers', statusFilter]
['trips']
['maintenance']
['fuelLogs']
['expenses']
['fuelEfficiency']
['fleetUtilizationReport']
['roiReport']
['availableVehicles']
['availableDrivers']
```

After mutations, always invalidate related queries:
```js
// After trip lifecycle change:
queryClient.invalidateQueries({ queryKey: ['trips'] });
queryClient.invalidateQueries({ queryKey: ['vehicles'] });
queryClient.invalidateQueries({ queryKey: ['drivers'] });
queryClient.invalidateQueries({ queryKey: ['dashboardKpis'] });
```

---

## 8. UI Component Patterns

### Loading
```jsx
<div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
  <p className="text-muted-foreground text-sm font-medium">Loading...</p>
</div>
```

### Error
```jsx
<div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-lg max-w-xl mx-auto border border-destructive/20 my-8">
  <AlertCircle className="h-5 w-5 shrink-0" />
  <div>
    <h3 className="font-semibold text-sm">Error heading</h3>
    <p className="text-xs opacity-90">{error.response?.data?.error || error.message}</p>
  </div>
</div>
```

### Page Header
```jsx
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold tracking-tight text-foreground">Title</h1>
    <p className="text-muted-foreground">Subtitle.</p>
  </div>
  {isManager && <Button>Action</Button>}
</div>
```

### Status Badge Colors
- Available → `bg-green-100 text-green-800`
- On Trip → `bg-blue-100 text-blue-800`
- In Shop → `bg-amber-100 text-amber-800`
- Retired / Suspended → `bg-destructive/10 text-destructive`
- Off Duty → `bg-muted text-muted-foreground`

---

## 9. Non-Negotiable Rules

1. Never set vehicle/driver/trip status directly in frontend. Always call backend action endpoints.
2. Use `api.js` helper objects (`vehicleAPI.retire(id)`) not raw strings.
3. Invalidate related queries after every mutation.
4. Always show `err.response?.data?.error` — never generic text.
5. No PDF export, no WebSockets, no dark mode toggle. Explicitly out of scope.
6. Recharts charts must handle empty arrays gracefully (show friendly empty state).

---

## 10. Seed Data Reference (for testing)

After `cd backend && npm run seed`:

| Type | Entries |
|---|---|
| Vehicles | VAN-05 (On Trip), TRK-10 (In Shop), BOX-03 (Available) |
| Drivers | Alex Johnson (On Trip, +1yr), Sarah Connor (Available, +6mo), Marcus Wright (EXPIRED license), Diana Prince (expires in 20 days → triggers alert banner) |
| Trips | 2 Completed, 1 Dispatched, 1 Draft |
| Maintenance | 1 Open (TRK-10), 2 Closed |
| Fuel Logs | 6 entries across all vehicles |
| Expenses | 6 entries across all vehicles |

---

*Backend by Karunesh | Frontend by Jai | Updated: 2026-07-12*
