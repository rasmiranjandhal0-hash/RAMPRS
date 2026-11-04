import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { checkoutRouter } from './routes/checkout.js';
import { webhooksRouter } from './routes/webhooks.js';
import { rmaRouter } from './routes/rma.js';
import { adminRouter } from './routes/admin.js';

const app: express.Express = express();

// Security headers
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:19006'],
    credentials: true,
  })
);

// 1. Raw body parser specifically for webhooks
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

// 2. JSON parser for all standard API routes
app.use(express.json());

// 3. Health Check for Render keep-alive & monitoring
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'RAMPRS Commerce API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// 4. API Routes
app.use('/api/checkout', checkoutRouter);
app.use('/api/rma', rmaRouter);
app.use('/api/admin', adminRouter);

// 5. 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`🚀 RAMPRS API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`📡 Render Keep-alive health check at http://localhost:${env.PORT}/health`);
  });
}

export default app;
