// Chargily Pay Configuration
require('dotenv').config();

const CHARGILY_CONFIG = {
    publicKey: process.env.CHARGILY_PUBLIC_KEY,
    secretKey: process.env.CHARGILY_SECRET_KEY,
    mode: process.env.CHARGILY_MODE || 'live',
    currency: 'dzd',

    // Correct API URL
    apiBase: 'https://pay.chargily.net/api/v2'
};

module.exports = CHARGILY_CONFIG;