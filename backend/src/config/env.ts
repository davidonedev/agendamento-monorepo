import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),

  PORT: parseInt(optional('PORT', '3333'), 10),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_SECRET: required('JWT_SECRET'),

  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),

  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:5173'),

  UPLOAD_DIR: optional('UPLOAD_DIR', 'uploads'),

  MAX_FILE_SIZE: parseInt(optional('MAX_FILE_SIZE', '5242880'), 10), // 5MB

  BCRYPT_ROUNDS: parseInt(optional('BCRYPT_ROUNDS', '10'), 10),
} as const;