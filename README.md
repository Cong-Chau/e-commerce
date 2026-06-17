# E-Commerce Platform

Nền tảng thương mại điện tử full-stack với **Backend REST API** (Node.js + Express + TypeScript + Prisma) và **Frontend SPA** (React 19 + TypeScript + Vite + Tailwind CSS v4).

---

## Mục lục

- [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Cài đặt và chạy dự án](#cài-đặt-và-chạy-dự-án)
- [Biến môi trường](#biến-môi-trường)

---

## Tổng quan kiến trúc

```
e-commerce/
├── backend/    # REST API — Node.js · Express · TypeScript · Prisma · PostgreSQL
└── frontend/   # SPA     — React 19 · TypeScript · Vite · Tailwind CSS v4
```

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:5000` |
| Frontend | `http://localhost:5173` |
| Swagger UI | `http://localhost:5000/api/v1/docs` |
| OpenAPI JSON | `http://localhost:5000/api/v1/docs.json` |

---

## Tính năng

### Xác thực & Phân quyền
- Đăng ký tài khoản (CUSTOMER hoặc SELLER)
- Đăng nhập bằng email/mật khẩu
- **Đăng nhập bằng Google OAuth 2.0** (ID token verification phía backend)
- JWT access token + refresh token rotation
- Phân quyền theo role: CUSTOMER · SELLER · ADMIN
- Bảo vệ route trên cả frontend và backend

### Quản lý sản phẩm
- CRUD sản phẩm (Seller)
- Upload và quản lý ảnh sản phẩm
- Phân loại theo danh mục đa cấp (Category tree)
- Quản lý tồn kho và trạng thái sản phẩm

### Quản lý người dùng
- Xem danh sách người dùng (Admin)
- Khoá / mở khoá tài khoản
- Cập nhật thông tin cá nhân, đổi mật khẩu

---

## Công nghệ sử dụng

### Backend

| Thành phần | Công nghệ |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js v5 |
| Ngôn ngữ | TypeScript 5 |
| ORM | Prisma 7 (`@prisma/adapter-pg`) |
| Database | PostgreSQL ≥ 14 |
| Xác thực | JWT (`jsonwebtoken`) · Google OAuth (`google-auth-library`) |
| Mã hoá | bcryptjs |
| Validation | Zod |
| API Docs | Swagger UI · swagger-jsdoc |
| Bảo mật | Helmet · CORS |
| Logging | Morgan |

### Frontend

| Thành phần | Công nghệ |
|---|---|
| Framework | React 19 |
| Ngôn ngữ | TypeScript 6 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router DOM v7 |
| HTTP client | Axios |
| Google OAuth | @react-oauth/google |
| State | React Context API |
| Design system | Mastercard-inspired (xem `frontend/DESIGN.md`) |

---

## Cấu trúc dự án

```
e-commerce/
├── backend/
│   ├── prisma/
│   │   ├── migrations/                # Lịch sử migration
│   │   ├── schema.prisma              # Database schema (models + enums)
│   │   └── seed.ts                    # Seed roles + tài khoản admin
│   └── src/
│       ├── config/
│       │   ├── env.ts                 # Đọc & validate biến môi trường
│       │   ├── prisma.ts              # Khởi tạo Prisma client
│       │   └── swagger.ts             # Cấu hình Swagger / OpenAPI
│       ├── controllers/
│       │   ├── ai.controller.ts       # Gợi ý mô tả shop bằng Gemini
│       │   ├── auth.controller.ts
│       │   ├── category.controller.ts
│       │   ├── product.controller.ts
│       │   ├── seller.controller.ts   # Tạo/xem hồ sơ shop + danh mục
│       │   └── user.controller.ts
│       ├── dtos/
│       │   ├── auth.dto.ts            # Zod schemas: register, login, ...
│       │   ├── category.dto.ts
│       │   ├── product.dto.ts
│       │   └── seller.dto.ts
│       ├── middlewares/
│       │   ├── auth.middleware.ts     # JWT verification + role guard
│       │   ├── error.middleware.ts    # Global error handler
│       │   └── validate.middleware.ts # Zod request validator
│       ├── routes/
│       │   ├── ai.route.ts
│       │   ├── auth.route.ts
│       │   ├── category.route.ts
│       │   ├── product.route.ts
│       │   ├── seller.route.ts
│       │   ├── user.route.ts
│       │   └── index.ts              # Mount tất cả routes + health check
│       ├── services/
│       │   ├── ai.service.ts         # Google Gemini API
│       │   ├── auth.service.ts       # Business logic xác thực + Google OAuth
│       │   ├── category.service.ts
│       │   ├── product.service.ts
│       │   ├── seller.service.ts
│       │   └── user.service.ts
│       ├── utils/
│       │   ├── pagination.util.ts
│       │   └── response.util.ts
│       ├── app.ts                    # Khởi tạo Express app
│       └── server.ts                 # Entry point
│
└── frontend/
    ├── DESIGN.md                     # Design system (Mastercard-inspired)
    └── src/
        ├── components/
        │   ├── common/
        │   │   └── SearchableSelect.tsx  # Dropdown với tìm kiếm fuzzy (Fuse.js)
        │   ├── products/
        │   │   ├── ProductCard.tsx
        │   │   ├── ProductEmptyState.tsx
        │   │   └── ProductSkeletonCard.tsx
        │   └── seller/
        │       ├── SellerSidebar.tsx
        │       └── SetupProfileBanner.tsx
        ├── context/
        │   ├── AuthContext.tsx        # Global auth state + actions
        │   └── ThemeContext.tsx       # Dark / Light mode
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.tsx      # Đăng nhập (email + Google)
        │   │   └── RegisterPage.tsx   # Đăng ký
        │   ├── dashboard/
        │   │   ├── AdminDashboard.tsx
        │   │   ├── CustomerDashboard.tsx
        │   │   ├── SellerDashboard.tsx    # Layout shell (sidebar + outlet)
        │   │   └── SellerProfilePage.tsx  # Tạo hồ sơ shop (multi-step form)
        │   ├── products/
        │   │   └── SellerProductPage.tsx  # Quản lý sản phẩm
        │   └── ComingSoon.tsx
        ├── router/
        │   ├── AppRoutes.tsx          # Khai báo toàn bộ routes
        │   └── RouteGuards.tsx        # GuestRoute · ProtectedRoute · RootRedirect
        ├── services/
        │   ├── address.service.ts     # Tỉnh / Xã (GHN API)
        │   ├── api.ts                 # Axios instance + interceptors
        │   ├── auth.service.ts
        │   ├── category.service.ts
        │   ├── cloudinary.service.ts  # Upload ảnh
        │   ├── product.service.ts
        │   └── seller.service.ts      # Hồ sơ shop + AI suggest
        ├── types/
        │   └── auth.ts                # TypeScript types: User, SellerProfile, ...
        ├── App.tsx
        ├── main.tsx                   # Entry point + GoogleOAuthProvider
        └── index.css                  # Tailwind v4 + design tokens
```

---

## Database Schema

### Vai trò người dùng

| Role | Mô tả |
|---|---|
| `CUSTOMER` | Khách hàng — duyệt sản phẩm, đặt hàng, đánh giá |
| `SELLER` | Người bán — quản lý shop, sản phẩm, đơn hàng |
| `ADMIN` | Quản trị viên hệ thống |

### Các model chính

| Model | Mô tả |
|---|---|
| `User` | Tài khoản người dùng (email unique) |
| `Account` | Thông tin đăng nhập theo provider (`LOCAL` · `GOOGLE` · `FACEBOOK`) |
| `Role` / `UserRole` | Phân quyền nhiều-nhiều |
| `Category` | Danh mục sản phẩm (cây đa cấp, self-referencing) |
| `Product` / `ProductImage` | Sản phẩm và ảnh sản phẩm |
| `Cart` / `CartItem` | Giỏ hàng |
| `Order` / `OrderItem` | Đơn hàng |
| `Conversation` / `Message` | Chat giữa buyer và seller |
| `Review` | Đánh giá sản phẩm (1–5 sao, unique per user+product) |
| `SellerProfile` | Thông tin shop của seller |
| `ShippingMethod` / `SellerShipping` | Phương thức vận chuyển |
| `ChatbotLog` | Lịch sử hội thoại chatbot |

### Enums

| Enum | Giá trị |
|---|---|
| `AccountProvider` | `LOCAL` · `GOOGLE` · `FACEBOOK` |
| `ProductStatus` | `ACTIVE` · `INACTIVE` · `DELETED` |
| `OrderStatus` | `PENDING` · `CONFIRMED` · `PROCESSING` · `SHIPPED` · `DELIVERED` · `CANCELLED` · `REFUNDED` |
| `PaymentMethod` | `COD` · `BANK_TRANSFER` · `MOMO` · `VNPAY` · `CREDIT_CARD` |
| `PaymentStatus` | `UNPAID` · `PAID` · `FAILED` · `REFUNDED` |
| `MessageType` | `TEXT` · `IMAGE` · `FILE` |
| `ShippingMethodName` | `FAST` · `EXPRESS` · `SAME_DAY` |

---

## API Endpoints

Base URL: `/api/v1`

### Hệ thống

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/health` | Kiểm tra trạng thái server |

### Auth (`/auth`)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/auth/register` | — | Đăng ký tài khoản (role mặc định: `CUSTOMER`) |
| POST | `/auth/login` | — | Đăng nhập email/mật khẩu → `accessToken` + `refreshToken` |
| POST | `/auth/google` | — | Đăng nhập Google → xác thực ID token → JWT |
| POST | `/auth/refresh` | — | Làm mới access token bằng refresh token |
| POST | `/auth/logout` | JWT | Đăng xuất, thu hồi refresh token |
| GET | `/auth/profile` | JWT | Lấy thông tin cá nhân |
| PUT | `/auth/profile` | JWT | Cập nhật tên, số điện thoại |
| PUT | `/auth/change-password` | JWT | Đổi mật khẩu |

### Users (`/users`)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/users` | JWT · ADMIN | Danh sách người dùng (có phân trang) |

### Categories (`/categories`)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/categories` | — | Danh sách danh mục |
| POST | `/categories` | JWT · ADMIN | Tạo danh mục mới |
| PUT | `/categories/:id` | JWT · ADMIN | Cập nhật danh mục |
| DELETE | `/categories/:id` | JWT · ADMIN | Xoá danh mục |

### Products (`/products`)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/products` | — | Danh sách sản phẩm (có phân trang, lọc) |
| GET | `/products/me` | JWT · SELLER | Sản phẩm của shop đang đăng nhập |
| GET | `/products/:id` | — | Chi tiết sản phẩm |
| POST | `/products` | JWT · SELLER | Tạo sản phẩm mới |
| PUT | `/products/:id` | JWT · SELLER | Cập nhật sản phẩm |
| DELETE | `/products/:id` | JWT · SELLER | Xoá sản phẩm |
| POST | `/products/:id/images` | JWT · SELLER | Upload ảnh sản phẩm |
| DELETE | `/products/:id/images/:imageId` | JWT · SELLER | Xoá ảnh sản phẩm |

### Sellers (`/sellers`)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/sellers/me/profile` | JWT · SELLER | Tạo hồ sơ shop |
| GET | `/sellers/me/categories` | JWT · SELLER | Danh mục của shop đang đăng nhập |
| GET | `/sellers/:id/profile` | — | Thông tin shop theo ID |

### AI (`/ai`)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/ai/suggest-description` | JWT · SELLER | Gợi ý mô tả shop bằng Google Gemini |

> Tài liệu API đầy đủ (Swagger UI): [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs)

---

## Cài đặt và chạy dự án

### Yêu cầu

- **Node.js** >= 18
- **PostgreSQL** >= 14
- npm

### 1. Clone repository

```bash
git clone <repo-url>
cd e-commerce
```

### 2. Cài dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 3. Cấu hình môi trường

```bash
# Backend
cd backend
cp .env.example .env
# Mở .env và điền thông tin database, secret, Google Client ID
```

```bash
# Frontend — tạo file .env
cd frontend
echo "VITE_GOOGLE_CLIENT_ID=your_google_client_id_here" > .env
```

### 4. Khởi tạo database

```bash
cd backend

# Chạy migration
npx prisma migrate dev

# Seed dữ liệu ban đầu (roles + tài khoản admin)
npm run seed
```

### 5. Chạy development

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

### 6. Build production

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run preview
```

---

## Biến môi trường

### Backend (`backend/.env`)

```env
# App
NODE_ENV=development
PORT=5000

# PostgreSQL (Prisma)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ecommerce_db?schema=public"

# Tài khoản admin mặc định (dùng khi seed)
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123456

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS — danh sách origin cho phép, phân cách bằng dấu phẩy
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Nodemailer (Gmail App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_APP_PASSWORD=your_app_password_here
```

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | Có | Connection string PostgreSQL (Prisma format) |
| `JWT_SECRET` | Có | Khoá ký JWT — chuỗi ngẫu nhiên ≥ 32 ký tự |
| `JWT_EXPIRES_IN` | Có | Thời hạn access token (vd: `15m`, `1h`) |
| `REFRESH_TOKEN_EXPIRES_IN` | Có | Thời hạn refresh token (vd: `7d`, `30d`) |
| `ALLOWED_ORIGINS` | Có | Origins CORS được phép, phân cách bởi dấu phẩy |
| `GOOGLE_CLIENT_ID` | Có | Client ID từ Google Cloud Console |
| `GEMINI_API_KEY` | Không | API key từ [Google AI Studio](https://aistudio.google.com/apikey) — cần để dùng tính năng gợi ý mô tả AI |
| `EMAIL_USER` | Không | Gmail dùng để gửi email OTP |
| `EMAIL_APP_PASSWORD` | Không | Gmail App Password (không phải mật khẩu Gmail) |
| `ADMIN_EMAIL` | Có | Email tài khoản admin khi chạy seed |
| `ADMIN_PASSWORD` | Có | Mật khẩu tài khoản admin khi chạy seed |
| `PORT` | Không | Cổng backend (mặc định: `5000`) |

### Frontend (`frontend/.env`)

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

> `VITE_GOOGLE_CLIENT_ID` phải khớp với `GOOGLE_CLIENT_ID` ở backend và được đăng ký tại [Google Cloud Console](https://console.cloud.google.com/).

---

## Google OAuth — Thiết lập

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/) → tạo hoặc chọn project.
2. Vào **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Chọn **Web application**.
4. Thêm vào **Authorized JavaScript origins**:
   - `http://localhost:5173` (development)
5. Sao chép **Client ID** và điền vào cả `backend/.env` và `frontend/.env`.

---

## Luồng xác thực Google

```
Frontend                        Backend                       Google
   |                               |                              |
   |── click "Login with Google" ──>|                              |
   |<──────── Google Popup ─────────────────────────────────────>|
   |<──── credential (ID token) ──|                              |
   |                               |                              |
   |── POST /api/v1/auth/google ──>|                              |
   |   { token: "<id_token>" }     |── verifyIdToken() ─────────>|
   |                               |<── { email, name, sub } ────|
   |                               |                              |
   |                               |── find or create User in DB  |
   |                               |── issue JWT + refreshToken   |
   |                               |                              |
   |<── { accessToken, user } ────|                              |
   |                               |                              |
   |── lưu token vào localStorage  |                              |
   |── redirect đến trang chủ      |                              |
```
