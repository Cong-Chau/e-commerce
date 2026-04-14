# E-Commerce Platform

Nền tảng thương mại điện tử full-stack với **Backend REST API** (Node.js + Express + TypeScript + Prisma) và **Frontend** (React 19 + TypeScript + Vite).

---

## Mục lục

- [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
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
├── backend/    # REST API — Node.js, Express, TypeScript, Prisma, PostgreSQL
└── frontend/   # SPA — React 19, TypeScript, Vite
```

- Backend chạy tại `http://localhost:5000`
- Frontend chạy tại `http://localhost:5173`
- Swagger UI: `http://localhost:5000/api/v1/docs`
- OpenAPI JSON: `http://localhost:5000/api/v1/docs.json`

---

## Công nghệ sử dụng

### Backend

| Thành phần      | Công nghệ                          |
|-----------------|------------------------------------|
| Runtime         | Node.js                            |
| Framework       | Express.js v5                      |
| Ngôn ngữ        | TypeScript 5                       |
| ORM             | Prisma 7 (adapter: `@prisma/adapter-pg`) |
| Database        | PostgreSQL                         |
| Xác thực        | JWT (accessToken + refreshToken)   |
| Mã hoá mật khẩu | bcryptjs                           |
| Validation      | Zod                                |
| API Docs        | Swagger UI + swagger-jsdoc         |
| Bảo mật         | Helmet, CORS                       |
| Logging         | Morgan                             |

### Frontend

| Thành phần | Công nghệ                 |
|------------|---------------------------|
| Framework  | React 19                  |
| Ngôn ngữ   | TypeScript 6              |
| Build tool | Vite 8                    |
| Linting    | ESLint 9 + typescript-eslint |

---

## Cấu trúc dự án

```
e-commerce/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Định nghĩa toàn bộ database schema
│   │   └── seed.ts             # Seed dữ liệu ban đầu (roles, admin)
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts          # Đọc và validate biến môi trường
│   │   │   ├── prisma.ts       # Khởi tạo Prisma client
│   │   │   └── swagger.ts      # Cấu hình Swagger / OpenAPI
│   │   ├── controllers/
│   │   │   └── auth.controller.ts
│   │   ├── dtos/
│   │   │   └── auth.dto.ts     # Zod schemas cho request validation
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts     # Xác thực JWT
│   │   │   ├── error.middleware.ts    # Global error handler
│   │   │   └── validate.middleware.ts # Zod request validator
│   │   ├── routes/
│   │   │   ├── auth.route.ts
│   │   │   └── index.ts        # Mount tất cả routes + health check
│   │   ├── services/
│   │   │   └── auth.service.ts # Business logic
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript type definitions
│   │   ├── utils/
│   │   │   ├── pagination.util.ts
│   │   │   └── response.util.ts
│   │   ├── app.ts              # Khởi tạo Express app
│   │   └── server.ts           # Entry point
│   ├── .env.example
│   ├── nodemon.json
│   ├── package.json
│   ├── prisma.config.ts
│   └── tsconfig.json
│
└── frontend/
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    ├── src/
    │   ├── assets/
    │   ├── App.tsx
    │   ├── App.css
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## Database Schema

### Vai trò người dùng

| Role       | Mô tả                               |
|------------|-------------------------------------|
| `CUSTOMER` | Khách hàng — mua hàng, đánh giá     |
| `SELLER`   | Người bán — quản lý shop và sản phẩm |
| `ADMIN`    | Quản trị viên hệ thống              |

### Các model chính

| Model            | Mô tả                                              |
|------------------|----------------------------------------------------|
| `User`           | Tài khoản người dùng                               |
| `Account`        | Thông tin đăng nhập (LOCAL / GOOGLE / FACEBOOK)    |
| `Role` / `UserRole` | Phân quyền người dùng                           |
| `Category`       | Danh mục sản phẩm (hỗ trợ đa cấp)                 |
| `Product`        | Sản phẩm (kèm ảnh, tồn kho, trạng thái)           |
| `Cart` / `CartItem` | Giỏ hàng                                        |
| `Order` / `OrderItem` | Đơn hàng                                     |
| `Conversation` / `Message` | Chat giữa buyer và seller                |
| `Review`         | Đánh giá sản phẩm (1–5 sao)                       |
| `SellerProfile`  | Thông tin shop của seller                          |
| `ShippingMethod` / `SellerShipping` | Phương thức vận chuyển            |
| `ChatbotLog`     | Lịch sử hội thoại chatbot                         |

### Enums

| Enum                 | Giá trị                                                        |
|----------------------|----------------------------------------------------------------|
| `AccountProvider`    | `LOCAL`, `GOOGLE`, `FACEBOOK`                                  |
| `ProductStatus`      | `ACTIVE`, `INACTIVE`, `DELETED`                                |
| `OrderStatus`        | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| `PaymentMethod`      | `COD`, `BANK_TRANSFER`, `MOMO`, `VNPAY`, `CREDIT_CARD`        |
| `PaymentStatus`      | `UNPAID`, `PAID`, `FAILED`, `REFUNDED`                         |
| `MessageType`        | `TEXT`, `IMAGE`, `FILE`                                        |
| `ShippingMethodName` | `FAST`, `EXPRESS`, `SAME_DAY`                                  |

---

## API Endpoints

Base URL: `/api/v1`

### Hệ thống

| Method | Endpoint  | Mô tả            |
|--------|-----------|------------------|
| GET    | `/health` | Kiểm tra trạng thái server |

### Auth (`/auth`)

| Method | Endpoint             | Auth | Mô tả                          |
|--------|----------------------|------|--------------------------------|
| POST   | `/auth/register`     |      | Đăng ký tài khoản mới (role mặc định: CUSTOMER) |
| POST   | `/auth/login`        |      | Đăng nhập, nhận `accessToken` + `refreshToken` |
| POST   | `/auth/refresh`      |      | Làm mới access token           |
| POST   | `/auth/logout`       | JWT  | Đăng xuất, thu hồi refresh token |
| GET    | `/auth/profile`      | JWT  | Lấy thông tin cá nhân          |
| PUT    | `/auth/profile`      | JWT  | Cập nhật tên, số điện thoại    |
| PUT    | `/auth/change-password` | JWT | Đổi mật khẩu                 |

> Tài liệu API đầy đủ: [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs)

---

## Cài đặt và chạy dự án

### Yêu cầu

- Node.js >= 18
- PostgreSQL >= 14
- npm hoặc yarn

### 1. Clone và cài dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Cấu hình môi trường

```bash
cd backend
cp .env.example .env
# Chỉnh sửa .env với thông tin database và secret của bạn
```

### 3. Khởi tạo database

```bash
cd backend

# Chạy migration
npx prisma migrate dev

# Seed dữ liệu ban đầu (roles + tài khoản admin)
npm run seed
```

### 4. Chạy development

```bash
# Backend (cổng 5000)
cd backend
npm run dev

# Frontend (cổng 5173)
cd frontend
npm run dev
```

### 5. Build production

```bash
# Backend
cd backend
npm run start:prod

# Frontend
cd frontend
npm run build
npm run preview
```

---

## Biến môi trường

Tạo file `.env` trong thư mục `backend/` dựa trên `.env.example`:

```env
# Environment
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ecommerce_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Admin mặc định (dùng cho seed)
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_strong_admin_password

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

| Biến                | Bắt buộc | Mô tả                                     |
|---------------------|----------|-------------------------------------------|
| `NODE_ENV`          | Có       | `development` hoặc `production`           |
| `PORT`              | Có       | Cổng backend (mặc định: 5000)             |
| `DB_HOST`           | Có       | Host PostgreSQL                           |
| `DB_PORT`           | Có       | Cổng PostgreSQL (mặc định: 5432)          |
| `DB_NAME`           | Có       | Tên database                              |
| `DB_USER`           | Có       | User PostgreSQL                           |
| `DB_PASSWORD`       | Có       | Mật khẩu PostgreSQL                       |
| `JWT_SECRET`        | Có       | Khóa bí mật ký JWT (nên dùng chuỗi ngẫu nhiên dài) |
| `JWT_EXPIRES_IN`    | Có       | Thời hạn access token (vd: `7d`, `1h`)   |
| `ALLOWED_ORIGINS`   | Có       | Danh sách origin CORS, phân cách bằng dấu phẩy |
| `ADMIN_EMAIL`       | Có       | Email tài khoản admin khi seed            |
| `ADMIN_PASSWORD`    | Có       | Mật khẩu tài khoản admin khi seed        |
