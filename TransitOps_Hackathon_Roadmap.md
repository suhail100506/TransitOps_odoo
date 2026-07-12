# TransitOps — 6.5 Hour Hackathon Roadmap
**Team size:** 4 | **Duration:** 6.5 hrs | **Model:** 2 Backend + 2 Frontend, feature-vertical split

---

## 1. Pain Points & Solutions

| # | Pain Point | Why It Kills Hackathon Teams | Solution |
|---|---|---|---|
| 1 | Time pressure (6.5 hrs) | Teams try to build all "Bonus Features" and run out of time on core flow | **Hard cut** on day one: PDF export, email reminders, dark mode, document management are OUT OF SCOPE. Only Section 3 (Functional Requirements) + Section 4 (Business Rules) are mandatory. |
| 2 | Frontend/backend blocking each other | FE waits for BE to finish endpoints before building anything → wasted hours | Freeze the **API contract** (below) in the first 30 min. FE builds against mock JSON matching that exact contract from minute 30 — never waits on live BE. |
| 3 | Schema drift between 2 backend devs | Both touch shared tables (Vehicle, Driver) differently → merge hell | One shared `models/` folder committed in first 30 min, before anyone writes route logic. No one edits another's model without a Slack ping. |
| 4 | Business-rule cascades (dispatch flips 2 statuses, maintenance flips 1, etc.) | If this logic lives in frontend, every screen re-implements it inconsistently and bugs multiply | **All state transitions live in backend service functions only.** Frontend never sets status directly — it only calls action endpoints (`/dispatch`, `/complete`, `/cancel`, `/close`) and re-renders whatever the backend returns. |
| 5 | RBAC over-engineering | Teams build granular permission matrices and burn 2 hours | Use a flat `role` field on the JWT + a single `allowRoles(['fleet_manager'])` middleware per route. No permission tables. |
| 6 | No design system → UI looks inconsistent/rushed | Judges notice visual polish fast | Agree on **Tailwind + one component library (shadcn/ui)** up front. Define 4–5 color tokens and font once, everyone reuses them. Don't hand-roll components. |
| 7 | Real-time dashboard temptation (WebSockets) | Massive time sink for marginal demo value | Skip WebSockets. Dashboard **refetches on screen focus/navigation**. That's enough for a live demo. |
| 8 | Empty database at demo time | Judges see a blank app, story doesn't land | Write a **seed script** (2–3 vehicles, 2–3 drivers, 1 trip in progress, 1 completed trip, 1 maintenance record) — run it at hour 5, not at 4:59. |
| 9 | Merge conflicts late in the day | Everyone pushes at 4:45 and nobody can merge | **Mandatory sync/merge checkpoints** at hour 2:30 and hour 4:30 — not just standups, actual `git pull`/merge/resolve moments. |
| 10 | No time left to rehearse the demo | Great app, weak pitch | Last 15 min is a **dry-run demo walkthrough** of the exact workflow in Section 5 of the PS (register → trip → dispatch → complete → maintenance). |

---

## 2. Tech Stack (optimized for speed, not "correctness")

### Backend
- **Runtime:** Node.js + Express
- **DB:** MongoDB + Mongoose (schema-less iteration — no migrations needed when a field changes mid-hackathon)
- **Auth:** JWT (access token only, no refresh token flow — skip that complexity)
- **Validation:** Zod or simple manual checks in service layer (don't add a heavy validation framework)
- **Password hashing:** bcrypt
- **CORS:** enabled for `localhost:5173` (or your FE dev port)
- **CSV export:** `json2csv` or manual CSV string builder — do NOT build PDF export (bonus, skip)

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS + shadcn/ui components (buttons, tables, modals, form inputs — don't build these from scratch)
- **Charts:** Recharts (bar/line for Fleet Utilization, Fuel Efficiency, Operational Cost)
- **State/data fetching:** React Query (TanStack Query) — handles loading/error/refetch for you, saves huge time vs manual `useEffect` fetching
- **Routing:** React Router
- **HTTP client:** Axios with one shared `api.js` instance (baseURL + auth header interceptor)
- **Forms:** react-hook-form (fast validation, less boilerplate)

### Shared
- Environment variables in `.env` (`VITE_API_URL` on FE, `PORT`, `MONGO_URI`, `JWT_SECRET` on BE)
- Postman/Thunder Client collection shared in repo so both FE devs can test BE endpoints without waiting for UI

---

## 3. Team Roles & Assignments

| Person | Role | Owns |
|---|---|---|
| **P1** | Backend – Core & Identity | Auth, Users/Roles, Vehicle Registry, Driver Management, Dashboard KPI aggregation |
| **P2** | Backend – Operations & Analytics | Trip lifecycle + cascade rules, Maintenance workflow, Fuel/Expense logging, Reports/Analytics + CSV export |
| **P3** | Frontend – Identity & Core Data | Login/Signup, Dashboard screen, Vehicle Registry screen, Driver Management screen |
| **P4** | Frontend – Operations | Trip Management screen, Maintenance screen, Fuel & Expense screen, Reports & Analytics screen (charts) |

**Rule of thumb:** P3 consumes P1's endpoints. P4 consumes P2's endpoints. If your pair is blocked, you're already building against the mocked contract below — never idle.

---

## 4. Data Models (commit in first 30 min, no changes without team ping)

```
User        { name, email, passwordHash, role: enum[fleet_manager, driver, safety_officer, financial_analyst], status }

Vehicle     { regNumber (unique), name, model, type, maxLoadCapacity, odometer,
              acquisitionCost, status: enum[Available, On Trip, In Shop, Retired] }

Driver      { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber,
              safetyScore, status: enum[Available, On Trip, Off Duty, Suspended] }

Trip        { source, destination, vehicleId, driverId, cargoWeight, plannedDistance,
              actualDistance, fuelConsumed, status: enum[Draft, Dispatched, Completed, Cancelled],
              createdAt, dispatchedAt, completedAt }

Maintenance { vehicleId, description, cost, status: enum[Open, Closed], createdAt, closedAt }

FuelLog     { vehicleId, liters, cost, date }

Expense     { vehicleId, type (toll/other), amount, date }
```

---

## 5. API Contract (freeze this at Hour 0:30 — this is the single source of truth)

> Base URL: `http://localhost:5000/api`
> All protected routes require `Authorization: Bearer <token>` header.

### Auth (P1 backend → P3 frontend Login/Signup)
| Method | Endpoint | Body | Response | Used by screen |
|---|---|---|---|---|
| POST | `/auth/signup` | `{name, email, password, role}` | `{user, token}` | Signup |
| POST | `/auth/login` | `{email, password}` | `{user, token}` | Login |
| GET | `/auth/me` | — | `{user}` | App shell (session check) |

### Vehicles (P1 backend → P3 frontend Vehicle Registry, also read by P4 for Trip creation dropdown)
| Method | Endpoint | Body/Query | Response | Used by |
|---|---|---|---|---|
| GET | `/vehicles?status=&type=&region=` | query filters | `[vehicle]` | Vehicle Registry, Trip creation dropdown, Dashboard |
| POST | `/vehicles` | `{regNumber, name, model, type, maxLoadCapacity, odometer, acquisitionCost}` | `vehicle` | Vehicle Registry |
| PUT | `/vehicles/:id` | partial fields | `vehicle` | Vehicle Registry (edit) |
| GET | `/vehicles/available` | — | `[vehicle]` (status=Available only) | Trip Management (dispatch dropdown) |

### Drivers (P1 backend → P3 frontend Driver Management, also read by P4 for Trip creation)
| Method | Endpoint | Body/Query | Response | Used by |
|---|---|---|---|---|
| GET | `/drivers?status=` | query filters | `[driver]` | Driver Management, Trip dropdown, Dashboard |
| POST | `/drivers` | `{name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber}` | `driver` | Driver Management |
| PUT | `/drivers/:id` | partial fields | `driver` | Driver Management (edit) |
| GET | `/drivers/available` | — | `[driver]` (status=Available, license not expired, not Suspended) | Trip Management |

### Dashboard (P1 backend → P3 frontend Dashboard)
| Method | Endpoint | Response |
|---|---|---|
| GET | `/dashboard/kpis` | `{activeVehicles, availableVehicles, inMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilization}` |

### Trips (P2 backend → P4 frontend Trip Management)
| Method | Endpoint | Body | Response | Business rule enforced server-side |
|---|---|---|---|---|
| POST | `/trips` | `{source, destination, vehicleId, driverId, cargoWeight, plannedDistance}` | `trip` (status=Draft) | cargoWeight ≤ vehicle.maxLoadCapacity |
| POST | `/trips/:id/dispatch` | — | `trip` (status=Dispatched) | vehicle & driver must be Available, license valid → both flip to "On Trip" |
| POST | `/trips/:id/complete` | `{finalOdometer, fuelConsumed}` | `trip` (status=Completed) | vehicle & driver flip back to Available |
| POST | `/trips/:id/cancel` | — | `trip` (status=Cancelled) | vehicle & driver flip back to Available |
| GET | `/trips?status=` | query | `[trip]` | Trip Management list, Dashboard |

### Maintenance (P2 backend → P4 frontend Maintenance screen)
| Method | Endpoint | Body | Response | Business rule |
|---|---|---|---|---|
| POST | `/maintenance` | `{vehicleId, description, cost}` | `maintenance` (status=Open) | vehicle status → "In Shop" automatically, excluded from `/vehicles/available` |
| POST | `/maintenance/:id/close` | — | `maintenance` (status=Closed) | vehicle status → Available (unless Retired) |
| GET | `/maintenance?vehicleId=&status=` | query | `[maintenance]` | Maintenance screen |

### Fuel & Expenses (P2 backend → P4 frontend Fuel & Expense screen)
| Method | Endpoint | Body | Response |
|---|---|---|---|
| POST | `/fuel-logs` | `{vehicleId, liters, cost, date}` | `fuelLog` |
| POST | `/expenses` | `{vehicleId, type, amount, date}` | `expense` |
| GET | `/vehicles/:id/cost-summary` | — | `{fuelCost, maintenanceCost, totalCost}` |

### Reports & Analytics (P2 backend → P4 frontend Reports screen)
| Method | Endpoint | Response |
|---|---|---|
| GET | `/reports/fuel-efficiency` | `[{vehicleId, regNumber, distance, fuel, efficiency}]` |
| GET | `/reports/fleet-utilization` | `{utilizationPercent, byType: [...]}` |
| GET | `/reports/roi` | `[{vehicleId, revenue, maintenanceCost, fuelCost, acquisitionCost, roi}]` |
| GET | `/reports/export?type=csv` | CSV file stream |

---

## 6. Timeline (6.5 hrs total)

| Block | Duration | Everyone | P1 (BE) | P2 (BE) | P3 (FE) | P4 (FE) |
|---|---|---|---|---|---|---|
| **0:00–0:30** | 30m | **All together:** finalize schema, freeze API contract above, set up repo + branches, agree Tailwind tokens, set up Postman collection | — | — | — | — |
| **0:30–2:30** | 2h | Sprint 1 | Auth + Vehicle + Driver CRUD, JWT middleware | Trip creation + dispatch/complete/cancel cascade logic, Maintenance create/close | Build Login/Signup/Dashboard UI against **mock JSON** matching contract | Build Trip/Maintenance/Fuel screens UI against **mock JSON** |
| **2:30–2:45** | 15m | **Sync 1:** git pull/merge, BE exposes real endpoints on shared dev server | push routes | push routes | pull, start swapping mocks → real Axios calls | pull, start swapping mocks → real Axios calls |
| **2:45–4:30** | 1h45m | Sprint 2 | Dashboard KPI aggregation, polish validation errors | Fuel/Expense logging, Reports/Analytics endpoints, CSV export | Wire real API + React Query, RBAC-based UI (hide actions by role) | Wire real API, build Recharts visualizations, CSV export button |
| **4:30–4:45** | 15m | **Sync 2:** merge everything, run seed script together | — | — | — | — |
| **4:45–5:45** | 1h | Sprint 3 — Integration | Fix BE bugs found live | Fix BE bugs found live | Full click-through of every screen, fix broken states/loading/empty states | Full click-through, fix chart edge cases |
| **5:45–6:15** | 30m | **Bug bash** — all 4 test each other's screens end-to-end | | | | |
| **6:15–6:30** | 15m | **Demo rehearsal** — run the exact Section 5 workflow from the PS start to finish, assign who talks over which screen | | | | |

---

## 7. Non-Negotiable Guardrails

1. **No one touches another person's files without a 10-second Slack heads-up.** Merge conflicts are the #1 hackathon time sink.
2. **Status transitions are backend-only.** If you catch yourself writing `vehicle.status = 'On Trip'` in frontend code — stop, that belongs in the `/dispatch` endpoint.
3. **Cut ruthlessly at 4:30.** If Reports/Analytics charts aren't done, ship 2 working charts over 5 half-broken ones.
4. **Demo the PS's own example workflow** (Van-05, Alex, 450kg trip) — it's literally scripted for you in Section 5. Use it as your seed data and your live demo script.
