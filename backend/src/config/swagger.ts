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
          role: {
            type: 'string',
            enum: ['CUSTOMER', 'SELLER'],
            default: 'CUSTOMER',
            description: 'Vai trò khi đăng ký. Mặc định là CUSTOMER nếu không truyền.',
            example: 'CUSTOMER',
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
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Nguyễn Văn A' },
          email: { type: 'string', example: 'nguyenvana@example.com' },
          phone: { type: 'string', nullable: true, example: '0901234567' },
          status: { type: 'string', example: 'ACTIVE' },
          created_at: { type: 'string', format: 'date-time' },
          roles: {
            type: 'array',
            items: { type: 'string', enum: ['CUSTOMER', 'SELLER', 'ADMIN'] },
            example: ['CUSTOMER'],
          },
          sellerProfile: {
            type: 'object',
            nullable: true,
            properties: {
              id: { type: 'integer', example: 1 },
              shop_name: { type: 'string', example: 'Shop Của Tui' },
              shop_logo: { type: 'string', nullable: true, example: 'https://example.com/logo.png' },
              shop_description: { type: 'string', nullable: true, example: 'Chuyên bán đồ công nghệ' },
              pickup_address: { type: 'string', nullable: true, example: '123 Đường ABC, Quận 1, TP.HCM' },
              owner_name: { type: 'string', nullable: true, example: 'Nguyễn Văn Bán' },
              owner_phone: { type: 'string', nullable: true, example: '0901234568' },
              shippings: {
                type: 'array',
                items: { type: 'string', enum: ['FAST', 'EXPRESS', 'SAME_DAY'] },
                example: ['FAST', 'EXPRESS'],
              },
              categories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer', example: 28 },
                    name: { type: 'string', example: 'Điện Thoại Di Động' },
                  },
                },
              },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      CreateCategoryBody: {
        type: 'object',
        required: ['name'],
        properties: {
          name:      { type: 'string', minLength: 2, maxLength: 100, example: 'Thực Phẩm & Đồ Uống' },
          parent_id: { type: 'integer', nullable: true, example: null, description: 'ID danh mục cha (null nếu là danh mục gốc)' },
        },
      },
      UpdateCategoryBody: {
        type: 'object',
        properties: {
          name:      { type: 'string', minLength: 2, maxLength: 100, example: 'Thời Trang Nam & Nữ' },
          parent_id: { type: 'integer', nullable: true, example: null },
        },
      },
      CategoryItemResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          { properties: { data: { $ref: '#/components/schemas/CategoryItem' } } },
        ],
      },
      CategoryItem: {
        type: 'object',
        properties: {
          id:        { type: 'integer', example: 1 },
          name:      { type: 'string',  example: 'Thời Trang Nam' },
          parent_id: { type: 'integer', nullable: true, example: null },
          children:  { type: 'array',  items: { $ref: '#/components/schemas/CategoryItem' } },
        },
      },
      CategoryAdminItem: {
        type: 'object',
        properties: {
          id:           { type: 'integer', example: 1 },
          name:         { type: 'string',  example: 'Điện Thoại & Phụ Kiện' },
          parent_id:    { type: 'integer', nullable: true, example: null },
          productCount: { type: 'integer', example: 158 },
          children: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id:           { type: 'integer', example: 5 },
                name:         { type: 'string',  example: 'Điện Thoại Di Động' },
                parent_id:    { type: 'integer', example: 1 },
                productCount: { type: 'integer', example: 90 },
              },
            },
          },
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
      CreateProductBody: {
        type: 'object',
        required: ['name', 'price', 'category_id'],
        properties: {
          name:        { type: 'string', minLength: 2, maxLength: 255, example: 'Áo thun nam basic' },
          description: { type: 'string', example: 'Chất liệu cotton 100%, thoáng mát' },
          price:       { type: 'number', minimum: 0, exclusiveMinimum: true, example: 150000 },
          stock:       { type: 'integer', minimum: 0, default: 0, example: 100 },
          category_id: { type: 'integer', example: 3 },
          images: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
            example: ['https://example.com/images/ao-thun-1.jpg'],
          },
        },
      },
      CreateProductResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  id:          { type: 'integer', example: 42 },
                  name:        { type: 'string',  example: 'Áo thun nam basic' },
                  description: { type: 'string',  example: 'Chất liệu cotton 100%, thoáng mát' },
                  price:       { type: 'string',  example: '150000' },
                  stock:       { type: 'integer', example: 100 },
                  status:      { type: 'string',  enum: ['ACTIVE', 'INACTIVE', 'DELETED'], example: 'ACTIVE' },
                  created_at:  { type: 'string',  format: 'date-time' },
                  category: {
                    type: 'object',
                    properties: {
                      id:   { type: 'integer', example: 3 },
                      name: { type: 'string',  example: 'Thời Trang Nam' },
                    },
                  },
                  images: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id:        { type: 'integer', example: 10 },
                        image_url: { type: 'string',  example: 'https://example.com/images/ao-thun-1.jpg' },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      UpdateProductImagesBody: {
        type: 'object',
        required: ['images'],
        properties: {
          images: {
            type: 'array',
            minItems: 1,
            items: { type: 'string', format: 'uri' },
            example: ['https://example.com/images/ao-thun-new-1.jpg'],
          },
        },
      },
      UpdateProductImagesResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id:        { type: 'integer', example: 11 },
                    image_url: { type: 'string',  example: 'https://example.com/images/ao-thun-new-1.jpg' },
                  },
                },
              },
            },
          },
        ],
      },
      MyProductsResponse: {
        type: 'object',
        properties: {
          success:    { type: 'boolean', example: true },
          message:    { type: 'string',  example: 'Lấy danh sách sản phẩm thành công' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id:         { type: 'integer', example: 10 },
                name:       { type: 'string',  example: 'Áo thun nam basic' },
                price:      { type: 'string',  example: '150000' },
                stock:      { type: 'integer', example: 100 },
                status:     { type: 'string',  enum: ['ACTIVE', 'INACTIVE', 'DELETED'], example: 'ACTIVE' },
                created_at: { type: 'string',  format: 'date-time' },
                category: {
                  type: 'object',
                  properties: {
                    id:   { type: 'integer', example: 1 },
                    name: { type: 'string',  example: 'Thời Trang Nam' },
                  },
                },
                images: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id:        { type: 'integer', example: 5 },
                      image_url: { type: 'string',  example: 'https://example.com/images/ao-thun.jpg' },
                    },
                  },
                },
                _count: {
                  type: 'object',
                  properties: {
                    reviews:    { type: 'integer', example: 12 },
                    orderItems: { type: 'integer', example: 35 },
                  },
                },
              },
            },
          },
          total:      { type: 'integer', example: 24 },
          page:       { type: 'integer', example: 1 },
          limit:      { type: 'integer', example: 10 },
          totalPages: { type: 'integer', example: 3 },
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
      SuggestDescriptionBody: {
        type: 'object',
        required: ['shop_name'],
        properties: {
          shop_name: {
            type: 'string',
            minLength: 1,
            example: 'Shop Thời Trang Hà My',
            description: 'Tên shop — AI dùng để tạo mô tả phù hợp',
          },
        },
      },
      SuggestDescriptionResponse: {
        allOf: [
          { $ref: '#/components/schemas/SuccessResponse' },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    example: 'Shop Thời Trang Hà My chuyên cung cấp các mẫu thời trang nữ hiện đại, phong cách và chất lượng cao. Chúng tôi cam kết mang đến cho khách hàng trải nghiệm mua sắm tuyệt vời với dịch vụ tận tâm.',
                  },
                },
              },
            },
          },
        ],
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
    { name: 'Auth',       description: 'Xác thực & quản lý tài khoản người dùng' },
    { name: 'Users',      description: 'Quản lý người dùng (chỉ dành cho ADMIN)' },
    { name: 'Categories', description: 'Danh mục sản phẩm' },
    { name: 'Products',   description: 'Quản lý sản phẩm' },
    { name: 'AI',         description: 'Tính năng AI hỗ trợ seller (Google Gemini)' },
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
