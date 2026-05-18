// Authentication Middleware
const { supabase } = require('../config/supabase');

// Check if user is authenticated
const requireAuth = async (req, res, next) => {
    const token = req.session?.access_token;

    if (!token) {
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        return res.redirect('/login');
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            req.session.destroy();
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            return res.redirect('/login');
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Check if user is NOT authenticated (for login page)
const requireGuest = (req, res, next) => {
    if (req.session?.access_token) {
        return res.redirect('/dashboard');
    }
    next();
};

// Get user profile with plan info
const getUserProfile = async (req, res, next) => {
    if (!req.user) {
        req.profile = null;
        return next();
    }

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Profile fetch error:', error);
        }

        req.profile = profile || {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.user_metadata?.full_name || req.user.email,
            avatar_url: req.user.user_metadata?.avatar_url,
            plan: 'free',
            strategy_count: 0
        };

        next();
    } catch (err) {
        console.error('Profile middleware error:', err);
        next();
    }
};

module.exports = { requireAuth, requireGuest, getUserProfile };
