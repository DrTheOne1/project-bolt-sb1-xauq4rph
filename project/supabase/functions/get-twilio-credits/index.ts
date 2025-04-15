import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get gateway_id from query parameters
    const url = new URL(req.url);
    const gateway_id = url.searchParams.get('gateway_id');
    
    if (!gateway_id) {
      throw new Error('Gateway ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get gateway credentials
    const { data: gateway, error: gatewayError } = await supabaseClient
      .from('gateways')
      .select('credentials, provider')
      .eq('id', gateway_id)
      .single();

    if (gatewayError) {
      console.error('Gateway error:', gatewayError);
      throw new Error('Gateway not found or access denied');
    }

    if (!gateway) {
      throw new Error('Gateway not found');
    }

    if (gateway.provider !== 'twilio') {
      throw new Error('Invalid gateway provider');
    }

    const { account_sid, auth_token } = gateway.credentials;

    if (!account_sid || !auth_token) {
      throw new Error('Invalid gateway credentials');
    }

    try {
      // Make request to Twilio API to get balance
      const balanceResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Balance.json`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${account_sid}:${auth_token}`)}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!balanceResponse.ok) {
        const errorData = await balanceResponse.json();
        console.error('Twilio API error:', errorData);
        throw new Error(errorData.message || `Twilio API error: ${balanceResponse.status}`);
      }

      const balanceData = await balanceResponse.json();

      // Make request to get account details for additional information
      const accountResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${account_sid}.json`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${account_sid}:${auth_token}`)}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!accountResponse.ok) {
        const errorData = await accountResponse.json();
        console.error('Twilio API error:', errorData);
        throw new Error(errorData.message || `Twilio API error: ${accountResponse.status}`);
      }

      const accountData = await accountResponse.json();

      return new Response(JSON.stringify({
        balance: parseFloat(balanceData.balance),
        currency: balanceData.currency,
        type: accountData.type,
        status: accountData.status,
        created_at: accountData.date_created
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (fetchError) {
      console.error('Twilio API fetch error:', fetchError);
      throw new Error(`Failed to fetch Twilio balance: ${fetchError.message}`);
    }

  } catch (error) {
    console.error('Error in get-twilio-credits:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});