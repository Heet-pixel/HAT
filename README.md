# SAL — Student Administration & Learning System v4.0

Full-stack college management platform with role-based dashboards,
persistent JWT sessions, OTP email activation, and mobile-ready API.

---

## 🗂️ Project Structure

```
sal-college-system/
├── server.js                  ← Express entry point
├── package.json
├── .env.example               ← Copy to .env and fill values
├── src/
│   ├── config/db.js           ← MongoDB connection
│   ├── models/                ← Mongoose schemas
│   │   ├── User.js            ← All roles (super_admin/admin/hod/teacher/student)
│   │   ├── College.js         ← Multiple principals supported
│   │   ├── OtpCode.js         ← OTP for first-login/password-reset
│   │   └── index.js           ← Department (multiple HODs), Subject, Attendance, Notice
│   ├── controllers/           ← Business logic
│   ├── routes/                ← API route definitions
│   ├── middleware/            ← Auth guard + error handler
│   ├── seed/                  ← Seeds super admin on first run
│   └── utils/                 ← JWT helpers, email (Nodemailer)
├── shared/
│   └── auth.js                ← Persistent session + auto token refresh (all frontends)
├── login/                     ← Login page (all roles use this)
├── super-admin/               ← Super Admin dashboard
├── admin/                     ← Principal dashboard
├── hod/                       ← HOD dashboard
├── teacher/                   ← Teacher dashboard
└── student/                   ← Student dashboard
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+
- **MongoDB** running locally or MongoDB Atlas URI

### 2. Setup

```bash
# Clone / extract the project
cd sal-college-system

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

### 3. Configure `.env`

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sal_v4

JWT_ACCESS_SECRET=your_random_64_char_secret_here
JWT_REFRESH_SECRET=another_random_64_char_secret_here

SUPER_ADMIN_EMAIL=superadmin@sal.com
SUPER_ADMIN_PASSWORD=YourStrongPassword@123

# Gmail for OTP emails (optional — OTPs print to console if not set)
GMAIL_USER=your.email@gmail.com
GMAIL_APP_PASSWORD=xxxx_xxxx_xxxx_xxxx
```

> **Gmail App Password:** Go to myaccount.google.com → Security → 2-Step Verification → App Passwords

### 4. Run

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server starts at **http://localhost:5000**

---

## 🔑 Login Flow

```
Open  http://localhost:5000
  ↓
Enter email  →  Server checks MongoDB
  ↓
First login?
  YES → OTP sent to Gmail (or printed to console)
       → Enter OTP → Set password → Auto login
  NO  → Enter password → Login → Redirect to role dashboard
```

**Auto-redirect by role:**
| Role | Dashboard |
|------|-----------|
| super_admin | /super-admin/ |
| admin (Principal) | /admin/ |
| hod / co_hod | /hod/ |
| teacher | /teacher/ |
| student | /student/ |

---

## 👥 Roles & Capabilities

### Super Admin
- Create/deactivate colleges (with deletion password)
- Add multiple Principals per college
- Create departments per college
- Appoint multiple HODs/Co-HODs per department
- Add teachers, enroll students with full personal info
- Platform-wide analytics

### Principal (Admin)
- View department overview
- View all faculty (HODs + teachers)
- View and search all students
- Post notices to students/teachers/HODs

### HOD
- View teachers in department
- View and search students in department
- Read notices

### Teacher
- Mark daily attendance per subject per session
- Track syllabus topics covered
- View students in department
- Read notices

### Student
- View notices from college
- View own profile and academic info

---

## 🔐 Authentication Details

- **Access Token:** JWT, expires in 15 minutes
- **Refresh Token:** JWT, expires in 7 days, stored hashed in DB
- **Auto Refresh:** Every 12 minutes silently — session stays alive
- **Persistent Login:** Stored in `localStorage` — survives browser close/reopen
- **OTP Expiry:** 10 minutes, max 5 attempts
- **Brute Force:** Account locked 30 min after 5 wrong password attempts

---

## 📱 Mobile App Compatibility

All frontend pages use `/api/*` REST endpoints with Bearer token auth.
For React Native / Flutter:
1. Use the same API endpoints
2. Replace `localStorage` with `AsyncStorage`
3. Same token refresh logic applies

---

## 🌐 API Endpoints

```
POST /api/auth/check-email     Check if email is registered
POST /api/auth/send-otp        Send OTP (first_login / reset_password)
POST /api/auth/verify-otp      Verify OTP → get setPasswordToken
POST /api/auth/set-password    Set password using setPasswordToken
POST /api/auth/login           Login with email + password
POST /api/auth/refresh         Refresh access token
POST /api/auth/logout          Logout (invalidate refresh token)
GET  /api/auth/me              Get current user profile

GET  /api/super/analytics      Platform-wide stats
GET  /api/super/colleges       List colleges (paginated, searchable)
POST /api/super/colleges       Create college
GET  /api/super/colleges/:id   College detail with all staff + students
PUT  /api/super/colleges/:id   Update college info
DEL  /api/super/colleges/:id   Deactivate college (requires deletion password)

POST /api/super/colleges/:id/departments    Create department
GET  /api/super/departments/:id/detail      Department detail
DEL  /api/super/departments/:id             Delete department

POST /api/super/colleges/:id/principals     Add principal (sends welcome email)
POST /api/super/departments/:id/hods        Appoint HOD (sends welcome email)
POST /api/super/departments/:id/teachers    Add teacher (sends welcome email)
POST /api/super/departments/:id/students    Enroll student (sends welcome email)
PUT  /api/super/staff/:id                   Edit any staff member
DEL  /api/super/staff/:id                   Remove staff member
PUT  /api/super/students/:id                Edit student
DEL  /api/super/students/:id                Remove student

GET  /api/admin/dashboard      Principal dashboard stats
GET  /api/admin/departments    Departments in college
GET  /api/admin/faculty        Faculty list (HODs + teachers)
GET  /api/admin/students       Students list (paginated)
GET  /api/admin/notices        Notices for this college
POST /api/admin/notices        Post a notice

GET  /api/hod/dashboard        HOD dashboard stats
GET  /api/hod/teachers         Teachers in department
GET  /api/hod/students         Students in department

GET  /api/teacher/dashboard    Teacher dashboard + subjects
GET  /api/teacher/subjects     Assigned subjects
GET  /api/teacher/students     Students in department

GET  /api/student/dashboard    Student dashboard (notices)
GET  /api/student/notices      All notices for student
```

---

## 📧 Email Setup (Gmail)

1. Enable 2-Step Verification on your Gmail account
2. Go to **myaccount.google.com → Security → App Passwords**
3. Create an app password for "Mail"
4. Add to `.env`:
   ```
   GMAIL_USER=your.email@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

> If Gmail is not configured, OTPs are printed to the server console — perfect for development.

---

## 🚢 Deployment

```bash
# Set NODE_ENV in .env
NODE_ENV=production

# Use MongoDB Atlas for cloud database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/sal_v4

# Use a process manager
npm install -g pm2
pm2 start server.js --name sal-v4
pm2 save
```

---

## 📁 Complete File Count
- Backend: 19 files
- Shared: 1 file (auth.js)
- Login: 3 files
- Super Admin: 13 files
- Admin: 10 files
- HOD: 9 files
- Teacher: 10 files
- Student: 8 files
- **Total: ~73 files**
