import type { NextApiResponse } from 'next';

export class DatabaseError extends Error {
  constructor(message: string = 'Database service unavailable') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export function handleDatabaseError(res: NextApiResponse, error: any) {
  if (error instanceof DatabaseError || error.message?.includes('Supabase')) {
    console.warn('Database error:', error.message);
    return res.status(503).json({
      error: 'Database service temporarily unavailable',
      message: 'The database service is not properly configured. Please contact support.',
      code: 'DATABASE_UNAVAILABLE'
    });
  }

  console.error('Unexpected error:', error);
  return res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_ERROR'
  });
}

export function createDatabaseErrorResponse(res: NextApiResponse, message?: string) {
  return res.status(503).json({
    error: 'Database service temporarily unavailable',
    message: message || 'The database service is not properly configured. Please contact support.',
    code: 'DATABASE_UNAVAILABLE'
  });
}