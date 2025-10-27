import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, validateScopes } from '@/lib/supabase/auth'

/**
 * GET /api/user
 * Returns the authenticated user's profile information.
 * Requires: Bearer token with 'profile:read' scope
 */
export async function GET(request: NextRequest) {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the token
    const user = await verifyBearerToken(token)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Validate required scopes
    const hasRequiredScopes = await validateScopes(token, ['profile:read'])

    if (!hasRequiredScopes) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Required scope: profile:read' },
        { status: 403 }
      )
    }

    // Return user profile
    return NextResponse.json({
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
      created_at: user.created_at,
    })
  } catch (error) {
    console.error('Error in /api/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

