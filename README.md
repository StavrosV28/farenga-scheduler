# Farenga Scheduler

A full-stack Progressive Web App built to replace paper-based scheduling at Farenga Funeral Home in Astoria, NY. Used daily by funeral home staff to manage chapel bookings, daily briefings, and vendor contacts.

## Live Demo

**App:** [farenga-scheduler.vercel.app](https://farenga-scheduler.vercel.app)  
**API:** [farenga-scheduler.onrender.com](https://farenga-scheduler.onrender.com/docs)

---

## The Problem

The funeral home was managing chapel scheduling through paper sheets and disorganized Slack messages. There was no shared source of truth, no conflict detection, and no audit trail for changes.

## The Solution

A deployed internal tool that gives staff a real-time view of chapel availability, prevents double bookings, tracks every change, and generates printable daily briefings — all accessible from their iPhones.

---

## Features

- **Weekly grid** — chapel × day view with drag-and-drop rescheduling between chapels
- **Daily view** — default tab showing today's services grouped by chapel with color-coded service types
- **Conflict detection** — backend rejects any booking that overlaps an existing one in the same chapel
- **Booking management** — create, edit, and delete bookings with funeral location, internment, and follow-on funeral date tracking
- **Daily briefing** — directors write and save the next day's briefing in the app; pre-fill pulls tomorrow's bookings automatically; printable as a clean formatted document
- **Contacts directory** — searchable card grid of vendors, clergy, and other contacts
- **Activity log** — last 7 days of changes with field-level diffs showing exactly what was updated and by whom
- **Authentication** — Supabase Auth with session persistence; staff stay logged in across visits
- **Audit logging** — every create, update, and delete is written to an audit table with a before-snapshot
- **PWA** — installable on iPhone via Safari; no App Store required
- **Dark theme** — full dark UI with animations

---

## Tech Stack

**Frontend**
- React + TypeScript
- Vite with vite-plugin-pwa
- @dnd-kit for drag and drop
- Axios for API calls
- Deployed on Vercel

**Backend**
- Python + FastAPI
- Supabase Python client
- Pydantic for request validation
- Deployed on Render

**Database**
- PostgreSQL via Supabase
- Row Level Security policies
- Database trigger for automatic user sync on signup

---

## Data Model

```
chapels        — chapel_id, chapel_name, capacity
users          — user_id, name, email, password_hash, role
bookings       — booking_id, chapel_id, created_by, family_name, date,
                 start_time, end_time, service_type, funeral_location,
                 funeral_date, funeral_time, internment, notes
audit_log      — audit_id, booking_id, user_id, action, previous_values, changed_at
contacts       — contact_id, name, role, company, phone, email, notes
daily_briefings — briefing_id, briefing_date, briefing_text, created_by
```

---

## Running Locally

**Prerequisites:** Python 3.11+, Node.js 18+, a Supabase project

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key
```

```bash
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

```bash
npm run dev
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/chapels` | All chapels |
| GET | `/bookings/week?reference_date=` | Bookings for a week |
| GET | `/bookings/day?date=` | Bookings for a single day |
| GET | `/bookings/funerals?funeral_date=` | Follow-on funerals by date |
| POST | `/bookings` | Create booking with conflict check |
| PUT | `/bookings/{id}` | Update booking with conflict check |
| DELETE | `/bookings/{id}` | Delete booking with audit log entry |
| GET | `/contacts` | All contacts |
| POST | `/contacts` | Create contact |
| PUT | `/contacts/{id}` | Update contact |
| DELETE | `/contacts/{id}` | Delete contact |
| GET | `/briefings/{date}` | Get briefing for a date |
| POST | `/briefings` | Create briefing |
| PUT | `/briefings/{date}` | Update briefing |
| GET | `/audit` | Last 7 days of audit log |

---

## Architecture

```
iPhone/Browser
      ↓ HTTPS
Vercel (React PWA)
      ↓ REST/JSON
Render (FastAPI)
      ↓ SQL
Supabase (PostgreSQL)
```

---

## Author

Stavros Varvatsoulis  
Aspiring Software/Perception Developer
[GitHub](https://github.com/StavrosV28) · [LinkedIn](https://linkedin.com/in/stavrosvarvatsoulis)