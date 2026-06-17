import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import config from './config/env';
import { swaggerSpec, swaggerUiOptions } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const app: Application = express();

// ─── Middlewares cơ bản ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // tắt CSP để Swagger UI load được các asset inline
}));
app.use(cors({ origin: config.cors.allowedOrigins, credentials: true }));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Swagger UI ──────────────────────────────────────────────────
app.use(
  '/api/v1/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

// Endpoint trả về raw OpenAPI JSON (hữu ích cho Postman, Insomnia)
app.get('/api/v1/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── Routes ─────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── Xử lý lỗi ──────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
