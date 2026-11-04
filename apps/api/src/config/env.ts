import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, 'SUPABASE_SERVICE_ROLE_KEY is required on server'),

  // Payment Gateway
  PAYMENT_GATEWAY_PROVIDER: z.enum(['razorpay', 'stripe']).default('razorpay'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_dummy_id'),
  RAZORPAY_KEY_SECRET: z.string().default('dummy_secret_key_minimum_length'),
  PAYMENT_WEBHOOK_SECRET: z.string().default('dummy_webhook_secret'),

  // Resend
  RESEND_API_KEY: z.string().default('re_dummy_resend_api_key'),
  RESEND_FROM_EMAIL: z.string().default('RAMPRS Orders <orders@ramprs.com>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid Server Environment Variables:', JSON.stringify(parsed.error.format(), null, 2));
  // In development, provide safe fallbacks if missing, but alert clearly
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment configuration for production.');
  }
}

export const env = parsed.success
  ? parsed.data
  : {
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      PORT: Number(process.env.PORT) || 4000,
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://example-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role_key_for_build',
      PAYMENT_GATEWAY_PROVIDER: 'razorpay' as const,
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'dummy_razorpay_secret',
      PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET || 'dummy_webhook_secret',
      RESEND_API_KEY: process.env.RESEND_API_KEY || 're_placeholder',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'RAMPRS Orders <orders@ramprs.com>',
    };

