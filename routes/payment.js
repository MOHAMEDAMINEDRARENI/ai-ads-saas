// Payment Routes
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { requireAuth, getUserProfile } = require('../middleware/auth');
const { supabase, supabaseAdmin } = require('../config/supabase');
const CHARGILY_CONFIG = require('../config/chargily');
const PLANS = require('../config/plans');

// Create payment session
router.post('/api/payment/create', requireAuth, getUserProfile, async (req, res) => {
    try {
        const { planId, name, phone, email } = req.body;
        const plan = PLANS[planId];

        if (!plan || plan.price === 0) {
            return res.status(400).json({ error: 'خطة غير صالحة' });
        }

        // Create payment record
        const { data: paymentRecord, error: dbError } = await supabase
            .from('payments')
            .insert({
                user_id: req.user.id,
                name,
                phone,
                email,
                plan: planId,
                amount: plan.price,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // Create Chargily checkout
        const successUrl = `${process.env.APP_URL}/payment/success?payment_id=${paymentRecord.id}`;
        const failureUrl = `${process.env.APP_URL}/payment/failure?payment_id=${paymentRecord.id}`;

        const chargilyResponse = await fetch(`${CHARGILY_CONFIG.apiBase}/checkouts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CHARGILY_CONFIG.secretKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: plan.price,
                currency: CHARGILY_CONFIG.currency,
                success_url: successUrl,
                failure_url: failureUrl,
                description: `اشتراك ${plan.nameAr} - AI Ads`,
                customer_email: email,
                metadata: {
                    user_id: req.user.id,
                    plan: planId,
                    payment_id: paymentRecord.id
                }
            })
        });
if (!chargilyResponse.ok) {

    const errorText = await chargilyResponse.text();

    console.error('Chargily API error:', errorText);

    return res.status(500).json({
        error: 'فشل إنشاء رابط الدفع الحقيقي',
        details: errorText
    });
}

const chargilyData = await chargilyResponse.json();

// Update payment with Chargily checkout ID
await supabase
    .from('payments')
    .update({ chargily_checkout_id: chargilyData.id })
    .eq('id', paymentRecord.id);

res.json({
    success: true,
    checkoutUrl: chargilyData.checkout_url,
    paymentId: paymentRecord.id
});

} catch (err) {

    console.error('Payment creation error:', err);

    return res.status(500).json({
        error: 'حدث خطأ في إنشاء عملية الدفع',
        details: err.message
    });
}
 });

// Payment success callback
router.get('/payment/success', async (req, res) => {
    const paymentId = req.query.payment_id;

    if (!paymentId) {
        return res.redirect('/dashboard?payment=error');
    }

    try {
        // Verify payment with Chargily (in production)
        // For now, mark as completed
        const { data: payment } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (payment && payment.status === 'pending') {
            // Update payment status
            await supabaseAdmin
                .from('payments')
                .update({ 
                    status: 'completed',
                    paid_at: new Date().toISOString()
                })
                .eq('id', paymentId);

            // Update user plan
            const plan = PLANS[payment.plan];
            const now = new Date();
            const expiresAt = payment.plan === 'annual' 
                ? new Date(now.setFullYear(now.getFullYear() + 1))
                : new Date(now.setMonth(now.getMonth() + 1));

            await supabaseAdmin
                .from('profiles')
                .update({
                    plan: payment.plan,
                    plan_started_at: new Date().toISOString(),
                    plan_expires_at: expiresAt.toISOString()
                })
                .eq('id', payment.user_id);
        }

        res.redirect('/dashboard?payment=success');

    } catch (err) {
        console.error('Payment success error:', err);
        res.redirect('/dashboard?payment=error');
    }
});

// Payment failure callback
router.get('/payment/failure', async (req, res) => {
    const paymentId = req.query.payment_id;

    if (paymentId) {
        await supabaseAdmin
            .from('payments')
            .update({ status: 'failed' })
            .eq('id', paymentId);
    }

    res.redirect('/dashboard?payment=failed');
});

// Chargily webhook
router.post('/webhook/chargily', async (req, res) => {
    try {
        const event = req.body;

        if (event.type === 'checkout.paid') {
            const { checkout } = event;
            const metadata = checkout.metadata;

            // Update payment
            await supabaseAdmin
                .from('payments')
                .update({ 
                    status: 'completed',
                    paid_at: new Date().toISOString(),
                    chargily_checkout_id: checkout.id
                })
                .eq('id', metadata.payment_id);

            // Update user plan
            const now = new Date();
            const expiresAt = metadata.plan === 'annual' 
                ? new Date(now.setFullYear(now.getFullYear() + 1))
                : new Date(now.setMonth(now.getMonth() + 1));

            await supabaseAdmin
                .from('profiles')
                .update({
                    plan: metadata.plan,
                    plan_started_at: new Date().toISOString(),
                    plan_expires_at: expiresAt.toISOString()
                })
                .eq('id', metadata.user_id);
        }

        res.json({ received: true });

    } catch (err) {
        console.error('Webhook error:', err);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});


// Get payment history
router.get('/api/payments', requireAuth, async (req, res) => {
    try {
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ payments: payments || [] });

    } catch (err) {
        console.error('Get payments error:', err);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

module.exports = router;
