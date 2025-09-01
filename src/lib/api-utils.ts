import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { auth } from '@clerk/nextjs/server'

export type ApiResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: unknown
  }
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  )
}

export function errorResponse(
  message: string,
  code: string,
  status = 400,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    },
    { status }
  )
}

export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)

  if (error instanceof ZodError) {
    return errorResponse(
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      error.errors
    )
  }

  if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) {
      return errorResponse(
        'You are not authorized to perform this action',
        'UNAUTHORIZED',
        401
      )
    }

    if (error.message.includes('Not found')) {
      return errorResponse(
        'The requested resource was not found',
        'NOT_FOUND',
        404
      )
    }

    return errorResponse(
      error.message || 'An unexpected error occurred',
      'INTERNAL_ERROR',
      500
    )
  }

  return errorResponse(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500
  )
}

export async function getAuthenticatedUserId(): Promise<string> {
  const { userId } = await auth()
  
  if (!userId) {
    throw new Error('Unauthorized: User not authenticated')
  }
  
  return userId
}

export function parseRequestBody<T>(body: unknown): T {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as T
    } catch {
      throw new Error('Invalid JSON in request body')
    }
  }
  return body as T
}