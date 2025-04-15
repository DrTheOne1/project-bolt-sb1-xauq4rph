import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const url = new URL(req.url);
    const gateway_id = url.searchParams.get('gateway_id');
    
    if (!gateway_id) {
      throw new Error('Gateway ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const { data: gateway, error: gatewayError } = await supabaseClient
      .from('gateways')
      .select('credentials, provider')
      .eq('id', gateway_id)
      .single();

    if (gatewayError) {
      throw new Error('Gateway not found or access denied');
    }

    if (!gateway || gateway.provider !== 'messagebird') {
      throw new Error('Invalid gateway provider');
    }

    const { api_key } = gateway.credentials;

    if (!api_key) {
      throw new Error('Invalid gateway credentials');
    }

    // Get balance from MessageBird API
    const response = await fetch('https://rest.messagebird.com/balance', {
      headers: {
        'Authorization': `AccessKey ${api_key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.description || 'Failed to fetch balance');
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      balance: data.amount,
      currency: data.type,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});