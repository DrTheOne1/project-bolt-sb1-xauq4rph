import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, planId } = session.metadata || {}

        if (!userId || !planId) {
          throw new Error('Missing metadata')
        }

        // Create a new subscription
        const { error: subscriptionError } = await supabaseClient
          .from('customer_subscriptions')
          .insert({
            user_id: userId,
            subscription_plan_id: planId,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            auto_renew: true,
          })

        if (subscriptionError) {
          throw subscriptionError
        }

        // Record the payment
        const { error: paymentError } = await supabaseClient
          .from('payments')
          .insert({
            user_id: userId,
            subscription_plan_id: planId,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            status: 'completed',
            transaction_id: session.payment_intent as string,
            payment_date: new Date().toISOString(),
          })

        if (paymentError) {
          throw paymentError
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const { userId, planId } = subscription.metadata || {}

        if (!userId || !planId) {
          throw new Error('Missing metadata')
        }

        // Update subscription status
        const { error: updateError } = await supabaseClient
          .from('customer_subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 'cancelled',
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            auto_renew: subscription.status === 'active',
          })
          .eq('user_id', userId)
          .eq('subscription_plan_id', planId)

        if (updateError) {
          throw updateError
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const { userId, planId } = subscription.metadata || {}

        if (!userId || !planId) {
          throw new Error('Missing metadata')
        }

        // Update subscription status to expired
        const { error: updateError } = await supabaseClient
          .from('customer_subscriptions')
          .update({
            status: 'expired',
            end_date: new Date().toISOString(),
            auto_renew: false,
          })
          .eq('user_id', userId)
          .eq('subscription_plan_id', planId)

        if (updateError) {
          throw updateError
        }

        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 