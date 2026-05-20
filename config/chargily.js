// Chargily Pay Configuration
require('dotenv').config();

const CHARGILY_CONFIG = {
    publicKey: process.env.CHARGILY_PUBLIC_KEY,
    secretKey: process.env.CHARGILY_SECRET_KEY,
    mode: process.env.CHARGILY_MODE || 'live',
    currency: 'DZD',

    // Correct API URL
    apiBase: 'https://api.chargily.com/v2'
};

module.exports = CHARGILY_CONFIG;