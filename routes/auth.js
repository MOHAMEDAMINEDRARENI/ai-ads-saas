// Authentication Routes
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { requireGuest } = require('../middleware/auth');

// Login page
router.get('/login', requireGuest, (req, res) => {
    res.render('login', {
        title: 'تسجيل الدخول - AI Ads',
        googleClientId: process.env.GOOGLE_CLIENT_ID,
        appUrl: process.env.APP_URL
    });
});

// Google OAuth callback
router.get('/auth/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.redirect('/login?error=no_code');
    }

    try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) throw error;

        // Store session
        req.session.access_token = data.session.access_token;
        req.session.refresh_token = data.session.refresh_token;
        req.session.user = data.session.user;

        res.redirect('/dashboard');

    } catch (err) {
        console.error('Auth callback error:', err);
        res.redirect('/login?error=auth_failed');
    }
});

// Handle Google ID token (One Tap)
router.post('/auth/google', async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ error: 'No credential provided' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: credential
        });

        if (error) throw error;

        // Store session
        req.session.access_token = data.session.access_token;
        req.session.refresh_token = data.session.refresh_token;
        req.session.user = data.user;

        res.json({ success: true, redirect: '/dashboard' });

    } catch (err) {
        console.error('Google auth error:', err);
        res.status(400).json({ error: 'Authentication failed' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login');
    });
});

// Get current user
router.get('/api/user', async (req, res) => {
    const token = req.session?.access_token;

    if (!token) {
        return res.json({ user: null });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.json({ user: null });
        }

        // Get profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        res.json({ 
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email.split('@')[0],
                avatar: user.user_metadata?.avatar_url || null,
                plan: profile?.plan || 'free',
                strategyCount: profile?.strategy_count || 0
            }
        });

    } catch (err) {
        console.error('Get user error:', err);
        res.json({ user: null });
    }
});

module.exports = router;
