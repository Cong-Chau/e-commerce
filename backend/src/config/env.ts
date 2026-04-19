import dotenv from "dotenv";
dotenv.config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || "ecommerce_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "changeme_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  },

  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || "changeme_refresh_secret",
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
    expiresInMs: 30 * 24 * 60 * 60 * 1000, // 30 ngày
  },

  cors: {
    allowedOrigins: (
      process.env.ALLOWED_ORIGINS || "http://localhost:5000"
    ).split(","),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  },

  email: {
    user: process.env.EMAIL_USER || "",
    appPassword: process.env.EMAIL_APP_PASSWORD || "",
  },
};

export default config;
