import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUserId } from './auth'
import { ApiError } from '../supabase/types'

type RequestContext = {
  userId?: string
  validatedData?: unknown
  params?: Record<string, string>
}

type RequestHandler<T = unknown> = (
  req: NextRequest,
  context?: RequestContext
) => Promise<T>

type RouteHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>

interface MiddlewareOptions {
  requireAuth?: boolean
  validationSchema?: z.ZodSchema
  errorHandler?: (error: unknown) => NextResponse
}

export class ApiRouteFactory {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private middlewares: Array<(handler: RequestHandler<any>) => RequestHandler<any>> = []
  private options: MiddlewareOptions = {}

  withAuth(requireAuth = true): ApiRouteFactory {
    this.options.requireAuth = requireAuth
    this.middlewares.push((handler) => async (req, context = {}) => {
      try {
        const userId = await getAuthenticatedUserId(req)
        return handler(req, { ...context, userId })
      } catch {
        throw new ApiError('Unauthorized', 401, 'UNAUTHORIZED')
      }
    })
    return this
  }

  withValidation(schema?: z.ZodSchema): ApiRouteFactory {
    if (schema) {
      this.options.validationSchema = schema
      this.middlewares.push((handler) => async (req, context) => {
        try {
          if (req.method === 'POST' || req.method === 'PUT') {
            const body = await req.json()
            const validatedData = schema.parse(body)
            return handler(req, { ...context, validatedData })
          }
          return handler(req, context)
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new ApiError(
              'Validation failed',
              400,
              'VALIDATION_ERROR',
              { validationErrors: error.errors }
            )
          }
          throw error
        }
      })
    }
    return this
  }

  withErrorHandling(customHandler?: (error: unknown) => NextResponse): ApiRouteFactory {
    this.options.errorHandler = customHandler
    return this
  }

  createHandler(
    handler: RequestHandler<{ success: boolean; data?: unknown; error?: unknown }>
  ): RouteHandler {
    return async (req, context) => {
      try {
        // Apply all middlewares
        let finalHandler = handler
        for (const middleware of this.middlewares.reverse()) {
          finalHandler = middleware(finalHandler)
        }

        const result = await finalHandler(req, context)
        
        return NextResponse.json(result, { 
          status: result.success ? 200 : 400 
        })
      } catch (error) {
        console.error('API Route Error:', error)

        if (this.options.errorHandler) {
          return this.options.errorHandler(error)
        }

        if (error instanceof ApiError) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: error.message,
                code: error.code,
                details: error.details,
              },
            },
            { status: error.status }
          )
        }

        // Handle specific error types
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: { validationErrors: error.errors },
              },
            },
            { status: 400 }
          )
        }

        if (error instanceof Error && error.message?.includes('Unauthorized')) {
          return NextResponse.json(
            {
              success: false,
              error: {
                message: 'Unauthorized',
                code: 'UNAUTHORIZED',
                details: {},
              },
            },
            { status: 401 }
          )
        }

        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Internal server error',
              code: 'INTERNAL_ERROR',
              details: { message: error instanceof Error ? error.message : String(error) },
            },
          },
          { status: 500 }
        )
      }
    }
  }
}

/**
 * Modernize API routes by replacing direct database calls with service layer
 */
export function modernizeApiRoutes() {
  return {
    factory: new ApiRouteFactory(),
    patterns: {
      // Common patterns for modernization
      replaceDirectDbCalls: true,
      useServiceLayer: true,
      standardizeErrorHandling: true,
      addTypeValidation: true,
    },
  }
}