import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - you can add more sophisticated checks here
    // like checking database connectivity, external services, etc.

    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    const errorResponse = {
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}