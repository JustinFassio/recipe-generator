import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface SetUsernameRequest {
  username: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize Supabase client for user authentication
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authorization header',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { username }: SetUsernameRequest = await req.json();

    // Validate username format
    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Username is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const cleanUsername = username.toLowerCase().trim();

    // Basic format validation
    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            'Username must be 3-24 characters long and contain only lowercase letters, numbers, and underscores',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if username is reserved
    const { data: reservedCheck, error: reservedError } = await supabaseAdmin
      .from('reserved_usernames')
      .select('username')
      .eq('username', cleanUsername)
      .single();

    if (reservedError && reservedError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking reserved usernames:', reservedError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error checking reserved usernames',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (reservedCheck) {
      return new Response(
        JSON.stringify({ success: false, error: 'This username is reserved' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Use a transaction to atomically claim the username
    const { error } = await supabaseAdmin.rpc('claim_username_atomic', {
      p_user_id: user.id,
      p_username: cleanUsername,
    });

    if (error) {
      console.error('Error claiming username:', error);

      // Handle specific error cases
      if (error.message?.includes('username_already_taken')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'This username is already taken',
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (error.message?.includes('user_already_has_username')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'You already have a username',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to claim username' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log the username claim event
    await supabaseAdmin.from('account_events').insert({
      user_id: user.id,
      event_type: 'username_claimed',
      metadata: {
        username: cleanUsername,
        claimed_at: new Date().toISOString(),
      },
      ip_address:
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(
      JSON.stringify({
        success: true,
        username: cleanUsername,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in set-username function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
