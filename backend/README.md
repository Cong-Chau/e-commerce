# E-Commerce Backend API

> Node.js · Express.js · TypeScript

## 📁 Cấu trúc thư mục

```
backend/
├── src/
│   ├── app.ts                  # Khởi tạo Express app (middleware, routes)
│   ├── server.ts               # Entry point — lắng nghe port
│   ├── config/
│   │   └── env.ts              # Load & export biến môi trường
│   ├── controllers/            # Xử lý request/response
│   │   ├── auth.controller.ts
│   │   └── product.controller.ts
│   ├── middlewares/            # Middleware toàn cục
│   │   ├── auth.middleware.ts  # Xác thực JWT, phân quyền
│   │   └── error.middleware.ts # Xử lý lỗi tập trung
│   ├── models/                 # Schema / Entity database
│   ├── routes/                 # Định nghĩa route
│   │   ├── index.ts            # Gộp tất cả route vào /api/v1
│   │   ├── auth.route.ts
│   │   └── product.route.ts
│   ├── services/               # Business logic (tách khỏi controller)
│   │   ├── auth.service.ts
│   │   └── product.service.ts
│   ├── types/
│   │   └── index.ts            # Interface, Enum dùng chung
│   └── utils/
│       ├── response.util.ts    # Helper gửi response chuẩn
│       └── pagination.util.ts  # Helper phân trang
├── .env                        # Biến môi trường (không commit)
├── .env.example                # Mẫu biến môi trường
├── .gitignore
├── nodemon.json                # Cấu hình auto-reload khi dev
├── package.json
└── tsconfig.json
```

## 🚀 Lệnh thường dùng

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy development với auto-reload |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Chạy production (cần build trước) |
| `npm run type-check` | Kiểm tra lỗi TypeScript (không emit) |

## 🔗 API Endpoints

| Method | URL | Mô tả |
|---|---|---|
| GET | `/api/v1/health` | Health check server |
| POST | `/api/v1/auth/register` | Đăng ký tài khoản |
| POST | `/api/v1/auth/login` | Đăng nhập |
| GET | `/api/v1/auth/profile` | Thông tin cá nhân (cần token) |
| GET | `/api/v1/products` | Danh sách sản phẩm |
| GET | `/api/v1/products/:id` | Chi tiết sản phẩm |
| POST | `/api/v1/products` | Tạo sản phẩm (admin/seller) |
| PUT | `/api/v1/products/:id` | Cập nhật sản phẩm |
| DELETE | `/api/v1/products/:id` | Xoá sản phẩm (admin) |

## ⚙️ Thiết lập lần đầu

```bash
# 1. Sao chép file môi trường
copy .env.example .env

# 2. Chỉnh sửa .env với thông tin database của bạn

# 3. Cài dependencies
npm install

# 4. Chạy development
npm run dev
```
