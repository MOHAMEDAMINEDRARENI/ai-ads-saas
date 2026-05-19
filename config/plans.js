// Subscription Plans Configuration
const PLANS = {
    free: {
        id: 'free',
        name: 'Free',
        nameAr: 'مجاني',
        price: 0,
        period: 'usage',
        limit: 3,
        features: [
            '3 استراتيجيات فقط',
            'منصة واحدة',
            'دعم أساسي'
        ],
        disabledFeatures: [
            'تحليل متقدم',
            'تقارير مفصلة'
        ]
    },
    plus: {
        id: 'plus',
        name: 'Plus',
        nameAr: 'بلاس',
        price: 2500,
        period: 'monthly',
        limit: Infinity,
        features: [
            'استراتيجيات غير محدودة',
            'منصتان (Instagram + Facebook)',
            'دعم أولوي',
            'تحليل متقدم'
        ],
        disabledFeatures: [
            'تقارير مفصلة'
        ]
    },
    pro: {
        id: 'pro',
        name: 'Pro',
        nameAr: 'برو',
        price: 5500,
        period: 'monthly',
        limit: Infinity,
        features: [
            'استراتيجيات غير محدودة',
            'جميع المنصات',
            'دعم 24/7',
            'تحليل متقدم',
            'تقارير مفصلة'
        ],
        disabledFeatures: []
    },
    annual: {
        id: 'annual',
        name: 'Annual',
        nameAr: 'سنوي',
        price: 25000,
        period: 'yearly',
        limit: Infinity,
        features: [
            'كل مميزات Pro',
            'خصم 62% مقارنة بالشهري',
            'استشارة شهرية',
            'API Access',
            'دعم VIP'
        ],
        disabledFeatures: []
    }
};

module.exports = PLANS;
