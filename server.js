// AI Ads Marketing - Node.js Server
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration for Vercel
app.set('trust proxy', 1);

app.use(session({
    secret: process.env.SESSION_SECRET || 'ai-ads-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make env vars available to views
app.locals.appName = process.env.APP_NAME || 'AI Ads Marketing';
app.locals.instagramHandle = process.env.INSTAGRAM_HANDLE || '@your_instagram';
app.locals.googleClientId = process.env.GOOGLE_CLIENT_ID || '';
app.locals.appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/dashboard'));
app.use('/', require('./routes/strategy'));
app.use('/', require('./routes/payment'));

// API health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - الصفحة غير موجودة',
        message: 'الصفحة التي تبحث عنها غير موجودة',
        code: 404
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).render('error', {
        title: '500 - خطأ في الخادم',
        message: 'حدث خطأ غير متوقع. حاول مرة أخرى لاحقاً.',
        code: 500
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 AI Ads Marketing Server running on http://localhost:${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 App URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
    console.log(`\n📋 Available routes:`);
    console.log(`   GET  /          → Redirect to login or dashboard`);
    console.log(`   GET  /login     → Login page`);
    console.log(`   GET  /dashboard → Main dashboard`);
    console.log(`   GET  /logout    → Sign out`);
    console.log(`\n💡 Press Ctrl+C to stop the server\n`);
});

module.exports = app;
