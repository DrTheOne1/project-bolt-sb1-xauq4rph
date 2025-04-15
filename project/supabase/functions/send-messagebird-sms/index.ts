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

    const { gateway_id, recipient, message } = await req.json();
    
    if (!gateway_id || !recipient || !message) {
      throw new Error('Missing required parameters');
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

    const { api_key, originator } = gateway.credentials;

    if (!api_key || !originator) {
      throw new Error('Invalid gateway credentials');
    }

    // Send SMS via MessageBird API
    const response = await fetch('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originator,
        recipients: [recipient],
        body: message,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.description || 'Failed to send message');
    }

    const data = await response.json();

    // Update message status
    const { error: updateError } = await supabaseClient
      .from('messages')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('gateway_id', gateway_id)
      .eq('recipient', recipient)
      .eq('message', message)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error updating message status:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      message_id: data.id,
      status: data.status,
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