// supabase/functions/chargily-webhook/index.ts
// Deploy this to Supabase Edge Functions for production webhook handling

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('signature')
    const body = await req.text()

    // TODO: Verify Chargily webhook signature
    // const isValid = verifySignature(body, signature, Deno.env.get('CHARGILY_WEBHOOK_SECRET'))
    // if (!isValid) return new Response('Invalid signature', { status: 401 })

    const event = JSON.parse(body)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (event.type === 'checkout.paid') {
      const { checkout } = event
      const metadata = checkout.metadata

      // Update payment status
      await supabaseAdmin
        .from('payments')
        .update({ 
          status: 'completed',
          paid_at: new Date().toISOString(),
          chargily_checkout_id: checkout.id
        })
        .eq('id', metadata.payment_id)

      // Calculate expiry
      const now = new Date()
      const expiresAt = metadata.plan === 'annual' 
        ? new Date(now.setFullYear(now.getFullYear() + 1))
        : new Date(now.setMonth(now.getMonth() + 1))

      // Update user plan
      await supabaseAdmin
        .from('profiles')
        .update({
          plan: metadata.plan,
          plan_started_at: new Date().toISOString(),
          plan_expires_at: expiresAt.toISOString()
        })
        .eq('id', metadata.user_id)

      console.log(`✅ Payment ${metadata.payment_id} completed. User ${metadata.user_id} upgraded to ${metadata.plan}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Deploy with:
// supabase functions deploy chargily-webhook
