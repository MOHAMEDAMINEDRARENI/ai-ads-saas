// Strategy Routes
const express = require('express');
const router = express.Router();
const { requireAuth, getUserProfile } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const StrategyGenerator = require('../models/strategyGenerator');
const PLANS = require('../config/plans');

// Generate strategy
router.post('/api/strategy/generate', requireAuth, getUserProfile, async (req, res) => {
    try {
        const profile = req.profile;
        const plan = PLANS[profile?.plan || 'free'];

        // Check plan limits
        if ((profile?.strategy_count || 0) >= plan.limit) {
            return res.status(403).json({
                error: 'لقد وصلت للحد الأقصى من الاستراتيجيات. قم بترقية خطتك!',
                code: 'PLAN_LIMIT_REACHED'
            });
        }

        const {
            project_name,
            target_audience,
            age_group,
            target_country,
            platform,
            daily_budget,
            campaign_days,
            project_desc
        } = req.body;

        // Validate required fields
        if (!project_name || !target_audience || !age_group || !platform || !daily_budget || !campaign_days) {
            return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
        }

        const strategyData = {
            project_name,
            target_audience,
            age_group,
            target_country: target_country || 'DZ',
            platform,
            daily_budget: parseFloat(daily_budget),
            campaign_days: parseInt(campaign_days),
            project_desc: project_desc || '',
            user_id: req.user.id
        };

        // Generate AI strategy
        const generator = new StrategyGenerator(strategyData);
        const strategyContent = await generator.generate();

        // Save to database
        const { data: savedStrategy, error: dbError } = await supabase
            .from('strategies')
            .insert({
                ...strategyData,
                strategy_content: JSON.stringify(strategyContent),
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // Update strategy count
        const newCount = (profile?.strategy_count || 0) + 1;
        await supabase
            .from('profiles')
            .update({ strategy_count: newCount })
            .eq('id', req.user.id);

        res.json({
            success: true,
            strategy: strategyContent,
            strategyId: savedStrategy.id,
            remaining: plan.limit === Infinity ? 'unlimited' : plan.limit - newCount
        });

    } catch (err) {
        console.error('Strategy generation error:', err);
        res.status(500).json({ error: 'حدث خطأ في إنشاء الاستراتيجية' });
    }
});

// Get user's strategies
router.get('/api/strategies', requireAuth, async (req, res) => {
    try {
        const { data: strategies, error } = await supabase
            .from('strategies')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ strategies: strategies || [] });

    } catch (err) {
        console.error('Get strategies error:', err);
        res.status(500).json({ error: 'حدث خطأ في جلب الاستراتيجيات' });
    }
});

// Get single strategy
router.get('/api/strategies/:id', requireAuth, async (req, res) => {
    try {
        const { data: strategy, error } = await supabase
            .from('strategies')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error) throw error;

        if (!strategy) {
            return res.status(404).json({ error: 'الاستراتيجية غير موجودة' });
        }

        res.json({ strategy });

    } catch (err) {
        console.error('Get strategy error:', err);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;
