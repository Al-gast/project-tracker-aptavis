# Project Tracker Aptavis

Aplikasi **Project Tracker** berbasis fullstack untuk mengelola project, task, subtask, dependency, progress, dan jadwal project.

Project ini dibuat sebagai bagian dari **Study Case Fullstack Developer Aptavis**.

---

## Live Demo

### Frontend

https://project-tracker-aptavis.vercel.app

### Backend API

https://project-tracker-aptavis.onrender.com

### Health Check

https://project-tracker-aptavis.onrender.com/api/health

> Backend menggunakan Render Free Web Service. Jika service tidak aktif dalam beberapa waktu, request pertama dapat membutuhkan waktu lebih lama karena proses cold start.

---

# Fitur Utama

## Project

Fitur project meliputi:

- Create Project
- Read Project
- Update Project
- Delete Project
- `start_date`
- `end_date`
- Validasi jadwal agar project tidak saling beririsan
- Informasi project penyebab konflik jadwal
- Status project dihitung otomatis
- Progress project berdasarkan bobot task
- Project dependency
- Circular project dependency prevention

---

## Task

Fitur task meliputi:

- Create Task
- Read Task
- Update Task
- Delete Task
- Status:
  - `DRAFT`
  - `IN_PROGRESS`
  - `DONE`
- Weight / bobot task
- Parent task
- Subtask
- Hierarki task dengan kedalaman fleksibel
- Task dependency
- Circular dependency prevention
- Recursive dependency revalidation

---

# Task Dependency

Setiap task dapat memiliki satu atau lebih dependency terhadap task lain.

Business rule yang diterapkan:

- Task tidak dapat berubah menjadi `DONE` apabila salah satu dependency belum `DONE`
- Dependency langsung maupun tidak langsung yang menyebabkan circular dependency akan ditolak
- Dependency task hanya dapat dibuat antar task dalam project yang sama
- Ketika status sebuah dependency berubah, task yang bergantung akan divalidasi ulang
- Task yang sebelumnya `DONE` tetapi dependency-nya kembali belum selesai akan otomatis berubah menjadi `IN_PROGRESS`
- Revalidation diterapkan secara recursive terhadap task lain yang ikut bergantung

Contoh:

```text
Deployment
depends on
Testing
```

Jika:

```text
Testing = IN_PROGRESS
```

maka:

```text
Deployment → DONE
```

akan ditolak.

Jika sebelumnya:

```text
Testing    = DONE
Deployment = DONE
```

kemudian:

```text
Testing
DONE → IN_PROGRESS
```

maka:

```text
Deployment
DONE → IN_PROGRESS
```

secara otomatis.

---

# Project Dependency

Project dapat memiliki dependency terhadap project lain.

Business rule:

- Jika salah satu dependency project belum `DONE`, project yang bergantung efektif berstatus `DRAFT`
- Jika seluruh dependency project sudah `DONE`, status project kembali dihitung berdasarkan kondisi task di dalamnya
- Perubahan status dependency project langsung memengaruhi project yang bergantung
- Circular dependency antar project ditolak
- Circular dependency tidak hanya dicegah secara langsung, tetapi juga secara tidak langsung

Contoh:

```text
Project B
depends on
Project A
```

Jika:

```text
Project A = IN_PROGRESS
```

maka:

```text
Project B = DRAFT
```

Jika Project A kembali `DONE`, maka status Project B akan dihitung kembali berdasarkan task di dalam Project B.

---

# Filtering Task dan Subtask

Task dapat dicari dan difilter berdasarkan:

- Nama task
- Status task
- Kombinasi nama dan status

Filtering mempertahankan struktur hierarchy.

Contoh:

```text
Backend
└── Authentication
    └── Login API
```

Jika pencarian:

```text
Login
```

maka hasil tetap:

```text
Backend
└── Authentication
    └── Login API
```

Parent tetap ditampilkan agar struktur task tidak kehilangan konteks.

Hal yang sama berlaku untuk filter status.

Jika hanya `Login API` yang memiliki status `DRAFT`, maka filter:

```text
Status = DRAFT
```

tetap dapat menghasilkan:

```text
Backend
└── Authentication
    └── Login API
```

meskipun parent tidak memiliki status `DRAFT`.

---

# Project Schedule

Setiap project memiliki:

```text
start_date
end_date
```

Tidak boleh ada dua project yang memiliki jadwal saling beririsan.

Validasi berlaku pada:

- Create Project
- Update Project

Jika terdapat konflik:

- request akan ditolak
- backend memberikan informasi project yang menyebabkan konflik

Kondisi overlap:

```text
existing.startDate <= new.endDate
AND
existing.endDate >= new.startDate
```

Tanggal dianggap **inclusive**.

Contoh:

```text
Project A
10 September - 15 September

Project B
15 September - 20 September
```

dianggap overlap karena kedua project menggunakan tanggal 15 September.

---

# Tech Stack

## Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS

## Backend

- Node.js
- Express.js
- TypeScript
- Zod
- Prisma ORM 7

## Database

- PostgreSQL
- Supabase

## Deployment

- Frontend: Vercel
- Backend: Render
- Database: Supabase PostgreSQL

---

# Arsitektur

Aplikasi menggunakan pemisahan antara frontend, backend REST API, dan database.

```text
Next.js Frontend
       │
       │ HTTP / REST API
       ▼
Express.js Backend
       │
       ▼
Controller
       │
       ▼
Validation
       │
       ▼
Service / Business Logic
       │
       ▼
Prisma ORM
       │
       ▼
PostgreSQL / Supabase
```

Frontend tidak mengakses Supabase secara langsung.

Seluruh operasi data melewati backend:

```text
Next.js
   ↓
Express REST API
   ↓
Prisma ORM
   ↓
PostgreSQL
```

Pendekatan ini digunakan agar business rule utama tetap dikontrol oleh backend dan tidak hanya bergantung pada validasi frontend.

---

# Struktur Project

```text
project-tracker-aptavis/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── controllers/
│   │   ├── errors/
│   │   ├── generated/
│   │   ├── lib/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── prisma.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── lib/
│   │   └── types/
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

Alur request pada backend secara umum:

```text
Route
  ↓
Controller
  ↓
Validator
  ↓
Service
  ↓
Prisma
  ↓
Database
```

Business logic utama ditempatkan pada **service layer** agar tidak bercampur dengan HTTP handling.

---

# Business Logic

## 1. Project Status

Status project tidak disimpan sebagai field yang dapat diedit secara manual.

Status dihitung secara dinamis ketika data project dibaca.

Urutan perhitungan:

```text
Jika ada Project Dependency yang belum DONE
→ DRAFT

Jika project belum memiliki task
→ DRAFT

Jika seluruh task DRAFT
→ DRAFT

Jika seluruh task DONE
→ DONE

Selain kondisi tersebut
→ IN_PROGRESS
```

Contoh:

```text
Task A = DONE
Task B = DRAFT
```

maka:

```text
Project = IN_PROGRESS
```

Project status dibuat sebagai **computed state** untuk menghindari conflicting source of truth.

Dengan pendekatan ini, tidak mungkin project tersimpan sebagai `DONE` sementara task di dalamnya masih `IN_PROGRESS`.

---

# Weighted Project Progress

Setiap task memiliki `weight`.

Progress project dihitung berdasarkan bobot task yang sudah selesai.

Rumus:

```text
                 total weight task DONE
Progress = -------------------------------- × 100
                 total weight seluruh task
```

Contoh:

```text
Backend
Weight = 3
Status = DONE

Frontend
Weight = 2
Status = DRAFT
```

Maka:

```text
Completed Weight = 3
Total Weight     = 5

Progress = 3 / 5 × 100
         = 60%
```

Semua task, termasuk subtask, dihitung sebagai task dengan weight masing-masing.

---

# Task Hierarchy dan Task Dependency

Task hierarchy dan task dependency diperlakukan sebagai dua konsep yang berbeda.

Contoh:

```text
Backend
└── Authentication
```

Struktur tersebut menunjukkan bahwa:

```text
Authentication
```

merupakan subtask dari:

```text
Backend
```

Tetapi hal tersebut **tidak otomatis berarti**:

```text
Backend depends on Authentication
```

Jika sebuah task harus menunggu task lain selesai, dependency harus dibuat secara eksplisit.

Pemisahan ini dilakukan agar:

```text
Task Hierarchy
```

merepresentasikan struktur pekerjaan, sedangkan:

```text
Task Dependency
```

merepresentasikan aturan urutan pengerjaan.

---

# Circular Dependency

Circular dependency dicegah menggunakan graph traversal.

Contoh direct cycle:

```text
A → B
B → A
```

akan ditolak.

Contoh indirect cycle:

```text
A → B
B → C
C → A
```

juga akan ditolak.

Validasi ini diterapkan pada:

- Task Dependency
- Project Dependency

---

# API Endpoint

Base path API:

```text
/api
```

---

## Project

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/projects` | Mengambil seluruh project |
| POST | `/projects` | Membuat project |
| GET | `/projects/:id` | Mengambil detail project |
| PATCH | `/projects/:id` | Mengubah project |
| DELETE | `/projects/:id` | Menghapus project |

---

## Task

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/projects/:projectId/tasks` | Mengambil task hierarchy |
| POST | `/projects/:projectId/tasks` | Membuat task |
| GET | `/tasks/:id` | Mengambil detail task |
| PATCH | `/tasks/:id` | Mengubah task |
| DELETE | `/tasks/:id` | Menghapus task |

---

## Task Filtering

Search:

```http
GET /api/projects/:projectId/tasks?search=login
```

Filter berdasarkan status:

```http
GET /api/projects/:projectId/tasks?status=DONE
```

Kombinasi:

```http
GET /api/projects/:projectId/tasks?search=api&status=IN_PROGRESS
```

---

## Task Dependency

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/tasks/:id/dependencies` | Menambahkan task dependency |
| DELETE | `/tasks/:id/dependencies/:dependencyId` | Menghapus task dependency |

Contoh request:

```json
{
  "dependsOnTaskId": "task-uuid"
}
```

---

## Project Dependency

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/projects/:id/dependencies` | Menambahkan project dependency |
| DELETE | `/projects/:id/dependencies/:dependencyId` | Menghapus project dependency |

Contoh request:

```json
{
  "dependsOnProjectId": "project-uuid"
}
```

---

# Environment Variables

Template environment tersedia pada:

```text
backend/.env.example
frontend/.env.example
```

File tersebut hanya berisi contoh konfigurasi dan **tidak menyimpan credential production**.

---

# Menjalankan Project Secara Lokal

## Prasyarat

Pastikan sudah tersedia:

- Node.js
- npm
- PostgreSQL database

Clone repository:

```bash
git clone https://github.com/Al-gast/project-tracker-aptavis.git
cd project-tracker-aptavis
```

---

# Backend

Masuk ke folder backend:

```bash
cd backend
```

Install dependency:

```bash
npm install
```

Salin environment template:

```bash
cp .env.example .env
```

Kemudian sesuaikan:

```env
DATABASE_URL=your_postgresql_connection_string
```

Generate Prisma Client:

```bash
npx prisma generate
```

Jalankan migration:

```bash
npx prisma migrate deploy
```

Jalankan development server:

```bash
npm run dev
```

Backend secara default berjalan di:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

---

# Frontend

Buka terminal baru dan masuk ke:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Salin environment template:

```bash
cp .env.example .env.local
```

Untuk development lokal:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Jalankan:

```bash
npm run dev
```

Frontend berjalan di:

```text
http://localhost:3000
```

---

# Build Production

## Backend

```bash
cd backend
npm run build
npm start
```

Build backend menjalankan:

```text
Prisma Client generation
+
TypeScript compilation
```

---

## Frontend

```bash
cd frontend
npm run build
npm start
```

---

# Data Mutation Confirmation

Untuk mengurangi risiko perubahan data karena klik yang tidak disengaja, frontend meminta confirmation sebelum melakukan request yang mengubah data.

Confirmation diterapkan pada:

```text
POST
PATCH
DELETE
```

Termasuk:

- Create Project
- Edit Project
- Delete Project
- Create Task
- Edit Task
- Delete Task
- Add Task Dependency
- Remove Task Dependency
- Add Project Dependency
- Remove Project Dependency

Request `GET` tidak membutuhkan confirmation.

---

# Validasi yang Telah Diuji

Skenario berikut telah diuji secara manual melalui aplikasi:

- Create Project
- Edit Project
- Schedule Conflict
- Create Root Task
- Create Nested Subtask
- Edit Task
- Weighted Project Progress
- Add Task Dependency
- Block Task `DONE` ketika dependency belum selesai
- Dependency Regression
- Circular Task Dependency
- Add Project Dependency
- Project Status Regression
- Circular Project Dependency
- Search berdasarkan descendant
- Filter berdasarkan descendant
- Delete Task
- Delete Project
- Cancel Mutation Confirmation

---

# Deployment

Arsitektur production:

```text
Vercel
Next.js Frontend
      │
      ▼
Render
Express REST API
      │
      ▼
Supabase
PostgreSQL Database
```

---

## Frontend

Hosted menggunakan **Vercel**:

https://project-tracker-aptavis.vercel.app

---

## Backend

Hosted menggunakan **Render**:

https://project-tracker-aptavis.onrender.com

---

## Database

Hosted menggunakan **Supabase PostgreSQL**.

---

# Catatan Implementasi

Beberapa keputusan implementasi yang digunakan pada project ini:

1. **Project status dihitung secara dinamis**, bukan disimpan sebagai status yang dapat diedit secara manual.

2. **Task hierarchy dan task dependency dipisahkan** karena keduanya memiliki fungsi yang berbeda.

3. **Subtask dihitung sebagai task tersendiri** dalam weighted project progress.

4. Task `DONE` yang menjadi invalid akibat perubahan dependency otomatis dikembalikan menjadi `IN_PROGRESS`.

5. Revalidation dependency dilakukan secara recursive.

6. Circular dependency diperiksa melalui graph traversal sehingga direct dan indirect cycle dapat ditolak.

7. Project schedule menggunakan batas tanggal inclusive.

8. Project dependency memiliki prioritas terhadap status project. Jika dependency project belum `DONE`, project yang bergantung efektif menjadi `DRAFT`.

9. Business rule utama divalidasi pada backend sehingga frontend bukan satu-satunya lapisan validasi.

10. Frontend meminta confirmation sebelum seluruh data mutation untuk mengurangi risiko perubahan data yang tidak disengaja.

---

# Repository

https://github.com/Al-gast/project-tracker-aptavis