import { createServiceClient } from './server'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Verifies a bearer token and returns the user if valid.
 * 
 * @param token - The bearer token from Authorization header
 * @returns User object if token is valid, null otherwise
 */
export async function verifyBearerToken(token: string) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase.auth.getUser(token)
  
  if (error || !data.user) {
    return null
  }
  
  return data.user
}

/**
 * Extracts scopes from a JWT token.
 * Note: Supabase doesn't have built-in scope support in JWT.
 * You may need to store scopes in user metadata or a separate table.
 * 
 * @param token - The access token
 * @returns Array of scope strings
 */
export async function extractScopesFromToken(token: string): Promise<string[]> {
  const user = await verifyBearerToken(token)
  
  if (!user) {
    return []
  }
  
  // Check user_metadata for scopes (you can customize this based on your schema)
  const scopes = user.user_metadata?.scopes || user.app_metadata?.scopes || []
  
  return Array.isArray(scopes) ? scopes : []
}

/**
 * Validates that a token has all required scopes.
 * 
 * @param token - The access token
 * @param requiredScopes - Array of required scope strings
 * @returns true if all scopes are present, false otherwise
 */
export async function validateScopes(
  token: string,
  requiredScopes: string[]
): Promise<boolean> {
  const scopes = await extractScopesFromToken(token)
  
  return requiredScopes.every(scope => scopes.includes(scope))
}

/**
 * Fetches authorization details from Supabase OAuth.
 * This is used during the consent flow.
 * 
 * @param authorizationId - The authorization ID from query params
 * @param accessToken - User's access token
 * @returns Authorization details or null
 */
export async function fetchAuthorizationDetails(
  authorizationId: string,
  accessToken: string
) {
  // Note: Supabase's OAuth provider API may differ from standard implementations.
  // This is a placeholder - adjust based on your Supabase project configuration.
  const supabase = createServiceClient()
  
  try {
    // Verify the user has a valid session
    const user = await verifyBearerToken(accessToken)
    
    if (!user) {
      return null
    }
    
    // In a production setup, you'd fetch authorization details from Supabase
    // or your own authorization table. For now, return a mock structure.
    return {
      id: authorizationId,
      client: {
        name: 'ChatGPT App',
        description: 'Access your data through ChatGPT'
      },
      scopes: ['profile:read', 'app:access'],
      user_id: user.id
    }
  } catch (error) {
    console.error('Error fetching authorization details:', error)
    return null
  }
}

/**
 * Submits consent decision for an OAuth authorization.
 * 
 * @param authorizationId - The authorization ID
 * @param accessToken - User's access token  
 * @param approved - Whether the user approved or denied
 * @returns Redirect URL with authorization code or error
 */
export async function submitConsentDecision(
  authorizationId: string,
  accessToken: string,
  approved: boolean
): Promise<{ redirect_url?: string; error?: string }> {
  const user = await verifyBearerToken(accessToken)
  
  if (!user) {
    return { error: 'Invalid session' }
  }
  
  if (!approved) {
    return { error: 'User denied consent' }
  }
  
  // In production, you'd interact with Supabase's OAuth API here
  // For now, we'll simulate a successful consent by generating a redirect
  // This assumes you have a consent/authorization table to track approvals
  
  const supabase = createServiceClient()
  
  try {
    // Store consent approval (customize based on your schema)
    const { error: insertError } = await supabase
      .from('oauth_consents')
      .insert({
        authorization_id: authorizationId,
        user_id: user.id,
        approved: true,
        approved_at: new Date().toISOString()
      })
    
    if (insertError) {
      console.error('Error storing consent:', insertError)
    }
    
    // Return a redirect URL (customize based on your OAuth flow)
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?code=${authorizationId}&state=success`
    
    return { redirect_url: redirectUrl }
  } catch (error) {
    console.error('Error submitting consent:', error)
    return { error: 'Failed to process consent' }
  }
}

