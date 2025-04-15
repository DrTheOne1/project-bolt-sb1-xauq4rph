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

    const { account_sid, auth_token, sender_number } = gateway.credentials;

    if (!account_sid || !auth_token || !sender_number) {
      throw new Error('Invalid gateway credentials');
    }

    try {
      // Send SMS via Twilio API
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${account_sid}:${auth_token}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'To': recipient,
            'From': sender_number,
            'Body': message,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Twilio API error:', data);
        throw new Error(data.message || `Twilio API error: ${response.status}`);
      }

      // Update message status in database
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
        message_sid: data.sid,
        status: data.status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (fetchError) {
      console.error('Twilio API fetch error:', fetchError);
      throw new Error(`Failed to send SMS: ${fetchError.message}`);
    }

  } catch (error) {
    console.error('Error in send-twilio-sms:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});