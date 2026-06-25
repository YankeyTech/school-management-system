# 🎓 EduCore — Advanced School Management System

A production-ready, multi-tenant SaaS platform for Ghanaian schools — primary, secondary, SHS, and tertiary institutions.

**Built with:** Next.js 15 · TypeScript · Supabase · Tailwind CSS · Recharts · PDF-lib

---

## ✅ What's Built

### 🏗️ Architecture
- Multi-tenant data isolation via Supabase Row Level Security
- Role-based access control (Super Admin, School Admin, Teacher, Parent, Student)
- Server-side rendering with Next.js 15 App Router
- Zustand state management + React Query for data fetching

### 📦 Modules
| Module | Status | Features |
|--------|--------|----------|
| Authentication | ✅ | Login, session management, role routing |
| Dashboard | ✅ | Stats, charts, quick actions, activity feed |
| Students | ✅ | Registration, profiles, search, filters, guardian records |
| Teachers | ✅ | Profiles, departments, employment |
| Attendance | ✅ | Manual entry, QR ready, analytics |
| Exams & Results | ✅ | Scheduling, mark entry, auto-grading, positions |
| Assignments | ✅ | Creation, submission, grading |
| Finance | ✅ | Invoices, payments, MoMo integration layer |
| Library | ✅ | Book inventory, borrowing, fines |
| Hostel | ✅ | Blocks, rooms, bed allocation |
| Transport | ✅ | Routes, vehicles, student assignment |
| AI Assistant | ✅ | Chatbot, report comments, performance analysis |
| PDF Reports | ✅ | Report cards, transcripts |
| Excel/CSV Export | ✅ | Students, results, finance, attendance |
| Email Notifications | ✅ | Welcome, fee reminders, attendance alerts |
| Announcements | ✅ | School-wide notices with role targeting |
| Timetable | ✅ | Conflict detection, class/teacher views |

### 🔒 Security
- Row Level Security on all 30+ tables
- JWT session management via Supabase Auth
- Input validation with Zod
- CSRF protection via Next.js
- Audit logging for all admin actions

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url> educore
cd educore
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your project URL and API keys

### 3. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

Minimum required:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Create First Super Admin

In Supabase dashboard → Authentication → Add user:
- Email: `admin@yourschool.com`
- Password: `SecurePassword123!`

Then in SQL Editor:
```sql
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'admin@yourschool.com';
```

---

## 🌐 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... etc

# Deploy to production
vercel --prod
```

---

## 📁 Project Structure

```
educore/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── auth/                 # Login, register pages
│   │   ├── dashboard/            # All dashboard pages
│   │   │   ├── home/             # Dashboard overview
│   │   │   ├── students/         # Student management
│   │   │   ├── teachers/         # Teacher management
│   │   │   ├── attendance/       # Attendance system
│   │   │   ├── exams/            # Exam management
│   │   │   ├── finance/          # Finance & fees
│   │   │   ├── library/          # Library system
│   │   │   ├── ai-assistant/     # AI chatbot
│   │   │   └── ...more modules
│   │   └── api/                  # API routes
│   │       ├── ai/               # AI endpoints
│   │       ├── students/         # Student CRUD
│   │       └── ...more endpoints
│   ├── components/               # Reusable components
│   │   ├── layout/               # Sidebar, TopBar, providers
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── students/             # Student components
│   │   ├── finance/              # Finance components
│   │   ├── attendance/           # Attendance forms
│   │   └── ai/                   # AI chat components
│   ├── lib/
│   │   ├── supabase/             # Supabase client/server/middleware
│   │   ├── validators/           # Zod schemas
│   │   ├── pdf/                  # PDF generation
│   │   ├── email/                # Email templates
│   │   ├── export/               # Excel/CSV export
│   │   └── utils/                # Utility functions
│   ├── stores/                   # Zustand state stores
│   ├── types/                    # TypeScript type definitions
│   └── styles/                   # Global CSS
├── supabase/
│   ├── migrations/               # SQL schema migrations
│   └── seed/                     # Seed data
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## 🔌 AI Setup (OpenRouter)

1. Sign up free at [openrouter.ai](https://openrouter.ai)
2. Create an API key
3. Add to `.env.local`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

Free models available:
- `anthropic/claude-3.5-haiku` — Best for report comments
- `google/gemini-flash-1.5` — Fast and free
- `meta-llama/llama-3.1-8b-instruct:free` — Completely free

---

## 💸 Mobile Money Integration

The system has a ready-made integration layer. To enable:

### MTN MoMo
1. Register at [momodeveloper.mtn.com](https://momodeveloper.mtn.com)
2. Create a Collections product
3. Add credentials to `.env.local`

```typescript
// src/lib/payments/mtn-momo.ts (implement this)
export async function initiateMoMoPayment(opts: {
  amount: number;
  phone: string;
  reference: string;
}) {
  // MTN MoMo Collections API
  const token = await getAccessToken();
  return await requestToPay(token, opts);
}
```

---

## 📊 Database Schema

The schema includes **30+ tables** with full RLS:

- `schools` — Multi-tenant root
- `profiles` — All user accounts
- `academic_years` + `terms` — Calendar
- `departments` + `subjects` + `classes`
- `students` + `guardians`
- `teachers`
- `attendance_records` + `attendance_entries`
- `exams` + `exam_results` + `grading_scales`
- `assignments` + `assignment_submissions`
- `timetable_slots`
- `invoices` + `payments` + `fee_structures`
- `books` + `book_borrows`
- `hostel_blocks` + `hostel_rooms` + `hostel_allocations`
- `vehicles` + `transport_routes` + `student_transport`
- `announcements` + `messages` + `notifications`
- `audit_logs`

---

## 🧩 Module Roadmap (Phase 2)

- [ ] QR Code attendance scanning
- [ ] SMS notifications (Hubtel / Arkesel)
- [ ] MTN MoMo live payments
- [ ] Parent mobile app (React Native)
- [ ] Student portal
- [ ] Payroll management
- [ ] Academic calendar builder
- [ ] BECE/WASSCE result portal
- [ ] Multi-school analytics (Super Admin)
- [ ] Bulk SMS campaigns

---

## 🤝 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui components |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |
| State | Zustand + React Query |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| PDF | pdf-lib |
| Excel | SheetJS (xlsx) |
| Email | Resend |
| AI | OpenRouter (Claude/Gemini) |
| Icons | Lucide React |
| Hosting | Vercel Free Tier |

---

## 📜 License

MIT — Free for educational and commercial use.

---

Built with ❤️ for Ghanaian schools 🇬🇭
