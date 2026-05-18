// Dashboard Routes
const express = require('express');
const router = express.Router();
const { requireAuth, getUserProfile } = require('../middleware/auth');
const PLANS = require('../config/plans');

// Dashboard page
router.get('/dashboard', requireAuth, getUserProfile, async (req, res) => {
    const user = req.user;
    const profile = req.profile;

    res.render('dashboard', {
        title: 'لوحة التحكم - AI Ads',
        user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email.split('@')[0],
            avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=6366f1&color=fff`,
            plan: profile?.plan || 'free',
            strategyCount: profile?.strategy_count || 0
        },
        plans: PLANS,
        instagramHandle: process.env.INSTAGRAM_HANDLE || '@your_instagram'
    });
});

// Home redirect
router.get('/', (req, res) => {
    if (req.session?.access_token) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

module.exports = router;
