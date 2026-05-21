# AI Ads Marketing - منصة ذكاء اصطناعي لإنشاء حملات تسويقية احترافية (Node.js Edition)

## 🎯 نظرة عامة
نظام AI Ads Marketing المبني بـ Node.js/Express.js - منصة ذكاء اصطناعي متكاملة لإنشاء استراتيجيات إعلانية ناجحة على Instagram و Facebook، مخصصة حصرياً للسوق الجزائري.

## 📁 هيكل المشروع

```
ai-ads-nodejs/
├── server.js                 # نقطة دخول الخادم الرئيسية
├── package.json              # تبعيات NPM
├── .env                      # متغيرات البيئة
├── .env.example              # نموذج متغيرات البيئة
├── .gitignore                # ملفات مستثناة من Git
│
├── config/
│   ├── supabase.js          # إعدادات Supabase
│   ├── chargily.js          # إعدادات Chargily Pay
│   └── plans.js             # إعدادات خطط الأسعار
│
├── middleware/
│   └── auth.js              # وسيط المصادقة
│
├── models/
│   └── strategyGenerator.js # مولد الاستراتيجية بالذكاء الاصطناعي
│
├── routes/
│   ├── auth.js              # مسارات المصادقة
│   ├── dashboard.js         # مسارات لوحة التحكم
│   ├── strategy.js          # مسارات الاستراتيجيات
│   └── payment.js           # مسارات الدفع
│
├── views/
│   ├── login.ejs            # صفحة تسجيل الدخول
│   ├── dashboard.ejs        # لوحة التحكم الرئيسية
│   └── error.ejs            # صفحة الأخطاء
│
├── public/
│   ├── css/
│   │   └── style.css        # أنماط CSS
│   ├── js/
│   │   └── app.js           # JavaScript العميل
│   └── images/              # الصور والأيقونات
│
└── README.md                # هذا الملف
```

## 🚀 التثبيت والتشغيل

### المتطلبات
- Node.js >= 18.0.0
- npm أو yarn
- حساب Supabase
- حساب Google Cloud (لـ OAuth)
- حساب Chargily Pay (للدفع)

### الخطوة 1: تثبيت التبعيات

```bash
cd ai-ads-nodejs
npm install
```

### الخطوة 2: إعداد متغيرات البيئة

انسخ ملف `.env.example` إلى `.env`:

```bash
cp .env.example .env
```

ثم عدل القيم:

```env
# Server
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Chargily Pay
CHARGILY_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxx
CHARGILY_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
CHARGILY_MODE=test

# App
APP_NAME=AI Ads Marketing
INSTAGRAM_HANDLE=@your_instagram
SESSION_SECRET=your-super-secret-key
```

### الخطوة 3: إعداد قاعدة البيانات (Supabase)

1. أنشئ مشروعاً جديداً على [Supabase](https://supabase.com)
2. افتح **SQL Editor** ونفذ:

```sql
-- جدول الملفات الشخصية
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan TEXT DEFAULT 'free',
    strategy_count INTEGER DEFAULT 0,
    plan_started_at TIMESTAMP WITH TIME ZONE,
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الاستراتيجيات
CREATE TABLE strategies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    project_name TEXT NOT NULL,
    target_audience TEXT,
    age_group TEXT,
    target_country TEXT DEFAULT 'DZ',
    platform TEXT,
    daily_budget DECIMAL(10,2),
    campaign_days INTEGER,
    project_desc TEXT,
    strategy_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول المدفوعات
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    plan TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    chargily_checkout_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- سياسات RLS
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own strategies" ON strategies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies" ON strategies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Trigger لإنشاء الملف الشخصي تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### الخطوة 4: إعداد Google OAuth

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروعاً جديداً
3. فعّل **Google Auth Platform**
4. أنشئ **OAuth 2.0 Client ID** (نوع: Web application)
5. أضف Authorized JavaScript Origins:
   - `http://localhost:3000`
   - `https://your-domain.com` (للإنتاج)
6. أضف Authorized Redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
7. انسخ **Client ID** و **Client Secret** إلى `.env`

### الخطوة 5: إعداد Chargily Pay

1. سجل في [Chargily Pay](https://chargily.com)
2. احصل على API Keys (Test أو Live)
3. أدخل المفاتيح في `.env`

### الخطوة 6: تشغيل الخادم

```bash
# وضع التطوير (مع إعادة التشغيل التلقائية)
npm run dev

# أو وضع الإنتاج
npm start
```

افتح المتصفح على: `http://localhost:3000`

---

## 🌐 API Endpoints

### المصادقة
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/login` | صفحة تسجيل الدخول |
| POST | `/auth/google` | تسجيل الدخول بـ Google ID Token |
| GET | `/auth/callback` | معالجة رد Google OAuth |
| GET | `/logout` | تسجيل الخروج |
| GET | `/api/user` | جلب بيانات المستخدم |

### لوحة التحكم
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | إعادة توجيه للوحة التحكم أو تسجيل الدخول |
| GET | `/dashboard` | لوحة التحكم الرئيسية |

### الاستراتيجيات
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/strategy/generate` | إنشاء استراتيجية جديدة |
| GET | `/api/strategies` | جلب استراتيجيات المستخدم |
| GET | `/api/strategies/:id` | جلب استراتيجية محددة |

### الدفع
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create` | إنشاء جلسة دفع |
| GET | `/payment/success` | نجاح الدفع (Callback) |
| GET | `/payment/failure` | فشل الدفع (Callback) |
| POST | `/api/payment/demo-confirm` | تأكيد دفع تجريبي |
| GET | `/api/payments` | جلب سجل المدفوعات |
| POST | `/webhook/chargily` | Webhook من Chargily |

### صحة النظام
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | فحص صحة الخادم |

---

## 📦 التبعيات

### إنتاجية
- **express** ^4.19.2 - إطار عمل الويب
- **ejs** ^3.1.10 - محرك القوالب
- **@supabase/supabase-js** ^2.43.0 - عميل Supabase
- **express-session** ^1.18.0 - إدارة الجلسات
- **body-parser** ^1.20.2 - تحليل طلبات HTTP
- **cors** ^2.8.5 - إدارة CORS
- **helmet** ^7.1.0 - تأمين HTTP headers
- **node-fetch** ^2.7.0 - طلبات HTTP
- **dotenv** ^16.4.5 - متغيرات البيئة
- **uuid** ^9.0.1 - معرّفات فريدة

### تطوير
- **nodemon** ^3.1.0 - إعادة تشغيل تلقائية

---

## 🎨 المميزات

### ✅ منجزة
- [x] تسجيل الدخول عبر Google OAuth
- [x] نظام جلسات آمن
- [x] مولد استراتيجيات إعلانية بالذكاء الاصطناعي
- [x] 4 خطط أسعار (Free, Plus, Pro, Annual)
- [x] نظام حدود الاستخدام حسب الخطة
- [x] دمج Chargily Pay للدفع بالدينار الجزائري
- [x] Webhook للتأكيد التلقائي بعد الدفع
- [x] حفظ جميع البيانات في Supabase
- [x] تصميم متجاوب (Responsive)
- [x] واجهة عربية كاملة (RTL)
- [x] Row Level Security (RLS)
- [x] إنشاء تلقائي للملف الشخصي

### 🔜 قريباً
- [ ] دمج OpenAI API لاستراتيجيات أكثر ذكاءً
- [ ] لوحة تحكم المسؤول
- [ ] تحليلات وإحصائيات مفصلة
- [ ] API للمطورين
- [ ] تطبيق موبايل

---

## 🚀 النشر

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Railway
```bash
npm i -g @railway/cli
railway login
railway up
```

### Render
1. أنشئ Web Service جديد
2. اربط بمستودع GitHub
3. اضبط Build Command: `npm install`
4. اضبط Start Command: `npm start`
5. أضف Environment Variables

### VPS (DigitalOcean, Linode, etc.)
```bash
# Clone repo
git clone https://github.com/yourusername/ai-ads-nodejs.git
cd ai-ads-nodejs

# Install dependencies
npm install --production

# Setup PM2
npm i -g pm2
pm2 start server.js --name "ai-ads"
pm2 save
pm2 startup
```

---

## 🔒 الأمان

- مصادقة OAuth 2.0 عبر Google
- جلسات مشفرة (Express Session)
- Row Level Security (RLS) في Supabase
- Helmet.js لحماية HTTP headers
- CORS محدود
- التحقق من البيانات المدخلة
- Webhook signature verification (Chargily)

---

## 📝 حقوق النشر

```
Copyright © 2026 AI Ads Marketing | Coded by @your_instagram
```

---

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى:
1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing`)
5. فتح Pull Request

---

## 📞 الدعم

- Instagram: [@your_instagram]
- Email: your@email.com
- Issues: [GitHub Issues](https://github.com/yourusername/ai-ads-nodejs/issues)

---

**تم بناء هذا المشروع بـ ❤️ للسوق الجزائري**
