import { Resend } from 'resend';
import { env } from '../config/env.js';

export const resendClient = new Resend(env.RESEND_API_KEY);

