import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { UserRole } from '@ramprs/shared';

export interface AuthenticatedRequest extends Request {
  user?: User;
  userRole?: UserRole;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired access token' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.status(500).json({ error: 'Internal Server Error during auth check' });
  }
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await requireAuth(req, res, async () => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        res.status(403).json({ error: 'Forbidden: Profile not found' });
        return;
      }

      if (profile.role !== 'admin' && profile.role !== 'staff') {
        res.status(403).json({ error: 'Forbidden: Requires admin or staff privileges' });
        return;
      }

      req.userRole = profile.role as UserRole;
      next();
    } catch (err) {
      console.error('requireAdmin error:', err);
      res.status(500).json({ error: 'Internal Server Error during admin verification' });
    }
  });
}

