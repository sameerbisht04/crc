## Campus Delivery Website - Project Specification

### Purpose
A campus-wide delivery platform for students to send/receive food, groceries, and parcels within campus.

### Actors & Roles
- Student (User): Places orders, pays, tracks delivery, views history
- Delivery Partner (Student Courier): Applies for approval, accepts orders, navigates, completes delivery, tracks earnings
- Admin: Approves partners, manages users and orders, views analytics

### Core Features
- Authentication: Email/student ID login
- Orders: Select type, pickup, drop, notes
- Tracking: Real-time updates (pending → picked up → on the way → delivered)
- Payments: UPI, card, or COD (Razorpay for online)
- History: Student and partner histories
- Dashboards: Student, partner, admin

### Technology Stack
- Frontend: Next.js (App Router) + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL via Prisma ORM
- Realtime: Socket.IO
- Maps: Google Maps API
- Payments: Razorpay
- Notifications: Email + Push (stubs)

### High-level Data Model
- User(id, email, studentId, passwordHash, name, role)
- Partner(id, email, name, phone, approved, earnings)
- Order(id, type, pickupLocation, dropLocation, notes, paymentMethod, status, studentId, partnerId, amount, createdAt)

### API (selected endpoints)
- POST /api/auth/register, POST /api/auth/login
- POST /api/orders, GET /api/orders/mine/:studentId, PATCH /api/orders/:orderId/status
- GET /api/partners/me/:partnerId/orders, POST /api/partners/apply, POST /api/partners/accept/:orderId
- GET /api/admin/stats, GET /api/admin/partners/pending, POST /api/admin/partners/:partnerId/approve

### Environment
- Backend: `DATABASE_URL`, `PORT`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GOOGLE_MAPS_API_KEY`
- Frontend: `NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Hosting
- Frontend: Vercel/Netlify
- Backend: Render/Heroku/AWS


