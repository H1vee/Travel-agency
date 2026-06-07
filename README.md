# AutoBoss — Car Dealership Website

A full-stack catalogue site for selling cars, reworked from a former travel-agency
codebase. Buyers browse and filter cars, view full specs with a photo carousel, and
submit contact requests. Administrators manage the inventory and leads from an admin
panel. Designed to run comfortably on a single server.

- **Backend:** Go (Echo + GORM) on PostgreSQL — `tour-server/`
- **Frontend:** React + TypeScript (Create React App) — `tour/`

> Note: the directory and Go module are still named `tour*` for historical reasons;
> the application itself is the AutoBoss car catalogue.

## Features

- Car catalogue with card grid and a detail page (photo carousel + full spec table)
- Search and filtering: make, body type, year, price, mileage, fuel type,
  engine capacity (l), battery capacity (kW), seats, drive, transmission
- Three contact call-to-action forms — *Get a turnkey quote*,
  *Calculate renovation costs*, *Ask a question* — capturing preferred contact
  method + phone (optionally tied to a specific car)
- Admin panel (JWT auth): add/edit/delete cars with all attributes, upload a main
  photo + gallery, toggle each car's status to control whether it appears on the
  site, and review/triage incoming leads

There is **no** payment processing, user reviews, or public accounts — by design.

## Car data model

Each car stores: make, model, year, VIN, price, mileage, fuel type, engine,
engine capacity (litres), battery capacity (kW, for EVs), transmission/gearbox,
drive, body type, colour, seats, detailed description, and a status (`active`
shows it on the site, `hidden` keeps it private).

## Getting started

### 1. Database (PostgreSQL)

```bash
createdb tourdb            # or your DB name; match tour-server/config/config.yaml
psql -d tourdb -f tour-server/database/schema_cars.sql
psql -d tourdb -f tour-server/database/seed_cars.sql   # optional sample data
```

The seed creates a default admin: `admin@autoboss.local` / `admin123`
(change the password after first login).

Database credentials live in `tour-server/config/config.yaml` (or override with the
`DB_PASSWORD` / `JWT_SECRET` environment variables).

### 2. Backend

```bash
cd tour-server
go run .            # listens on 127.0.0.1:1323 by default
```

### 3. Frontend

```bash
cd tour
cp .env.example .env   # leave REACT_APP_API_URL empty to use the dev proxy
npm install
npm start              # http://localhost:3006
```

The dev server proxies API calls to the backend (`package.json` `proxy`).

### Production (single server)

Build the frontend (`npm run build` in `tour/`) and serve the static `build/`
output, pointing `REACT_APP_API_URL` at the API origin (or serve both from the same
origin so relative URLs work). Run the Go binary behind your reverse proxy of choice.

## Key API endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET  | `/cards` | Active cars (card view) |
| GET  | `/cars/:id` | Full car detail |
| GET  | `/cars/:id/gallery` | Carousel images |
| GET  | `/search` | Filtered, paginated search |
| GET  | `/filter-options` | Distinct filter values from inventory |
| POST | `/inquiries` | Submit a contact request |
| —    | `/admin/*` | Car CRUD, status, inquiries (JWT + admin role) |
