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

    const { gateway_id, recipient, message, template_sid, template_variables } = await req.json();
    
    if (!gateway_id || !recipient) {
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

    if (!gateway || gateway.provider !== 'whatsapp_twilio') {
      throw new Error('Invalid gateway provider');
    }

    const { account_sid, auth_token, whatsapp_number } = gateway.credentials;

    if (!account_sid || !auth_token || !whatsapp_number) {
      throw new Error('Invalid gateway credentials');
    }

    // Format WhatsApp numbers
    const formattedFrom = `whatsapp:${whatsapp_number}`;
    const formattedTo = `whatsapp:${recipient}`;

    // Prepare message payload
    const messageData = new URLSearchParams({
      From: formattedFrom,
      To: formattedTo,
    });

    // Handle template message or regular message
    if (template_sid) {
      messageData.append('ContentSid', template_sid);
      if (template_variables) {
        messageData.append('ContentVariables', JSON.stringify(template_variables));
      }
    } else if (message) {
      messageData.append('Body', message);
    } else {
      throw new Error('Either template_sid or message is required');
    }

    // Send message via Twilio API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${account_sid}:${auth_token}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: messageData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);
      throw new Error(data.message || `Twilio API error: ${response.status}`);
    }

    // Update message status
    const { error: updateError } = await supabaseClient
      .from('messages')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('gateway_id', gateway_id)
      .eq('recipient', recipient)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error updating message status:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      message_sid: data.sid,
      status: data.status,
      details: data
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-whatsapp-message:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});