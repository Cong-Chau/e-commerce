import dotenv from "dotenv";
dotenv.config();

function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)(s|m|h|d)$/);
  if (!match) throw new Error(`Invalid duration format: "${duration}"`);
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * multipliers[unit];
}

const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";

const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,

  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || "ecommerce_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    postgresUri:
      process.env.POSTGRES_URI ||
      `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || ""}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || "ecommerce_db"}`,
  },

  jwt: {
    secret: process.env.JWT_SECRET || "changeme_secret",
    expiresIn: jwtExpiresIn,
    expiresInMs: parseDurationMs(jwtExpiresIn),
  },

  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || "changeme_refresh_secret",
    expiresIn: refreshTokenExpiresIn,
    expiresInMs: parseDurationMs(refreshTokenExpiresIn),
  },

  cors: {
    allowedOrigins: (
      process.env.ALLOWED_ORIGINS || "http://localhost:5000"
    ).split(","),
  },

  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },

  email: {
    user: process.env.EMAIL_USER || "",
    appPassword: process.env.EMAIL_APP_PASSWORD || "",
  },
};

export default config;
