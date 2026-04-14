import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';

// ─── OpenAPI Definition ────────────────────────────────────────────────────
const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: '🛒 E-Commerce API',
    version: '1.0.0',
    description:
      'REST API documentation cho hệ thống E-Commerce, xây dựng với **Node.js**, **Express** và **TypeScript**.',
    contact: {
      name: 'API Support',
      email: 'support@ecommerce.dev',
    },
    license: {
      name: 'ISC',
    },
  },
  servers: [
    {
      url: 'http://localhost:{port}/api/v1',
      description: 'Development Server',
      variables: {
        port: {
          default: '5000',
          description: 'Port của server',
        },
      },
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Nhập **Access Token** JWT vào đây. Ví dụ: `eyJhbGci...`',
      },
    },
    schemas: {
      // ── Common ──────────────────────────────────────────────────────────
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Thành công' },
          data: { type: 'object', nullable: true },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Lỗi xảy ra' },
          statusCode: { type: 'integer', example: 400 },
        },
      },
      // ── Auth ────────────────────────────────────────────────────────────
      RegisterBody: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            example: 'Nguyễn Văn A',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'nguyenvana@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 6,
            example: 'Password@123',
          },
        },
      },
      LoginBody: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'nguyenvana@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'Password@123',
          },
        },
      },
      RefreshBody: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      UpdateProfileBody: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Nguyễn Văn B' },
          phone: { type: 'string', example: '0901234567' },
        },
      },
      ChangePasswordBody: {
        type: 'object',
        required: ['oldPassword', 'newPassword'],
        properties: {
          oldPassword: { type: 'string', format: 'password', example: 'OldPass@123' },
          newPassword: {
            type: 'string',
            format: 'password',
            minLength: 6,
            example: 'NewPass@456',
          },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'a1b2c3d4-...' },
          name: { type: 'string', example: 'Nguyễn Văn A' },
          email: { type: 'string', example: 'nguyenvana@example.com' },
          phone: { type: 'string', nullable: true, example: '0901234567' },
          role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'], example: 'CUSTOMER' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      UserListItem: {
        type: 'object',
        properties: {
          id:         { type: 'integer', example: 1 },
          name:       { type: 'string',  example: 'Nguyễn Văn An' },
          email:      { type: 'string',  example: 'nguyenvanan@gmail.com' },
          phone:      { type: 'string',  nullable: true, example: '0901234501' },
          status:     { type: 'string',  enum: ['ACTIVE', 'BANNED'], example: 'ACTIVE' },
          roles:      { type: 'array', items: { type: 'string', enum: ['CUSTOMER', 'SELLER'] }, example: ['CUSTOMER'] },
          created_at: { type: 'string',  format: 'date-time' },
        },
      },
      PaginatedUsers: {
        type: 'object',
        properties: {
          success:    { type: 'boolean', example: true },
          message:    { type: 'string',  example: 'Lấy danh sách người dùng thành công' },
          items:      { type: 'array', items: { $ref: '#/components/schemas/UserListItem' } },
          total:      { type: 'integer', example: 20 },
          page:       { type: 'integer', example: 1 },
          limit:      { type: 'integer', example: 10 },
          totalPages: { type: 'integer', example: 2 },
        },
      },
      TokenPair: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Unauthorized – Token không hợp lệ hoặc hết hạn',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: { success: false, message: 'Unauthorized', statusCode: 401 },
          },
        },
      },
      BadRequest: {
        description: 'Bad Request – Dữ liệu đầu vào không hợp lệ',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
      NotFound: {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Auth',  description: 'Xác thực & quản lý tài khoản người dùng' },
    { name: 'Users', description: 'Quản lý người dùng (chỉ dành cho ADMIN)' },
  ],
};

// ─── swagger-jsdoc options ─────────────────────────────────────────────────
const options: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'],   // đọc JSDoc từ tất cả route files
};

export const swaggerSpec = swaggerJSDoc(options);

// ─── Swagger UI tuỳ chỉnh giao diện ───────────────────────────────────────
export const swaggerUiOptions: SwaggerUiOptions = {
  customSiteTitle: 'E-Commerce API Docs',
  swaggerOptions: {
    persistAuthorization: true,   // giữ token sau khi refresh trang
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    tryItOutEnabled: true,
  },
  customCss: `
    .swagger-ui .topbar { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info .title { color: #e94560; }
    .swagger-ui .btn.authorize { color: #e94560; border-color: #e94560; }
    .swagger-ui .btn.authorize svg { fill: #e94560; }
  `,
};
