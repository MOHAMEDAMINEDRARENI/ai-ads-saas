// AI Ads Marketing - Client Application

// ===== APP STATE =====
let selectedPlan = null;
let currentStrategy = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkPaymentStatus();
});

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Strategy form
    const strategyForm = document.getElementById('strategy-form');
    if (strategyForm) {
        strategyForm.addEventListener('submit', handleStrategySubmit);
    }

    // Payment form
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('user-dropdown');
        if (userMenu && dropdown && !userMenu.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// ===== USER MENU =====
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('hidden');
}

// ===== STRATEGY GENERATOR =====
async function handleStrategySubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('generate-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/strategy/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            if (result.code === 'PLAN_LIMIT_REACHED') {
                showToast(result.error, 'warning');
                scrollToPricing();
                return;
            }
            throw new Error(result.error || 'Failed to generate strategy');
        }

        currentStrategy = result.strategy;
        displayStrategyResult(result.strategy);
        showToast('تم إنشاء الحملة التسويقية بنجاح!', 'success');

        // Update strategy count display
        updateStrategyCount(result.remaining);

    } catch (err) {
        console.error('Strategy error:', err);
        showToast(err.message || 'حدث خطأ في إنشاء الاستراتيجية', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i><span>إنشاء حملة تسويق كاملة بالذكاء الاصطناعي</span><div class="btn-shine"></div>';
    }
}

function displayStrategyResult(strategy) {
    const resultDiv = document.getElementById('strategy-result');
    const contentDiv = document.getElementById('strategy-content');

    let html = '';

    html += `
        <div class="ai-strategy-box">
            <h2>🚀 الاستراتيجية الإعلانية بالذكاء الاصطناعي</h2>

            <pre style="
                white-space: pre-wrap;
                font-family: inherit;
                line-height: 2;
                font-size: 16px;
            ">
${strategy.aiStrategy}
            </pre>
        </div>
    `;

    contentDiv.innerHTML = html;

    resultDiv.classList.remove('hidden');

    resultDiv.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}


function updateStrategyCount(remaining) {
    const infoEl = document.querySelector('.strategies-used');
    if (infoEl && remaining !== 'unlimited') {
        const current = parseInt(infoEl.querySelector('strong').textContent) + 1;
        infoEl.innerHTML = `استراتيجيات مستخدمة: <strong>${current}</strong> / ${remaining + current}`;
    }
}

function copyStrategy() {
    const content = document.getElementById('strategy-content').innerText;
    navigator.clipboard.writeText(content).then(() => {
        showToast('تم نسخ الحملة كاملة!', 'success');
    });
}

function downloadStrategy() {
    if (!currentStrategy) return;

    const projectName = document.getElementById('project-name').value;

    const html = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>استراتيجية ${projectName}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.8; direction: rtl; }
                h1 { color: #6366f1; }
                h5 { color: #4f46e5; margin-top: 20px; }
                ul { margin-right: 20px; }
                li { margin-bottom: 8px; }
                strong { color: #1e293b; }
            </style>
        </head>
        <body>
            <h1>استراتيجية إعلانية: ${projectName}</h1>
            <hr>
            ${document.getElementById('strategy-content').innerHTML}
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy-${projectName}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('تم تحميل الاستراتيجية!', 'success');
}

// ===== SUBSCRIPTION & PAYMENT =====
function subscribe(planId) {
    const plan = plansConfig[planId];
    if (!plan) return;

    if (planId === 'free') {
        showToast('أنت مشترك بالفعل في الخطة المجانية!');
        return;
    }

    selectedPlan = planId;

    document.getElementById('modal-plan-name').textContent = plan.nameAr;
    document.getElementById('modal-plan-price').textContent = 
        plan.price.toLocaleString() + ' دج' + (plan.period === 'monthly' ? '/شهر' : '/سنة');
    document.getElementById('modal-total').textContent = 
        plan.price.toLocaleString() + ' دج';
    document.getElementById('payment-plan-name').textContent = 
        `الخطة المختارة: ${plan.nameAr}`;

    document.getElementById('payment-modal').classList.remove('hidden');
}

function closePaymentModal() {
    document.getElementById('payment-modal').classList.add('hidden');
    selectedPlan = null;
}

async function handlePaymentSubmit(e) {
    e.preventDefault();

    if (!selectedPlan) return;

    const btn = e.target.querySelector('.btn-pay');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...';

    const data = {
        planId: selectedPlan,
        name: document.getElementById('payment-name').value,
        phone: document.getElementById('payment-phone').value,
        email: document.getElementById('payment-email').value
    };

    try {
        const response = await fetch('/api/payment/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Payment failed');
        }


    if (result.checkoutUrl) {
    window.location.href = result.checkoutUrl;
}

    } catch (err) {
        console.error('Payment error:', err);
        showToast(err.message || 'حدث خطأ في معالجة الدفع', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i><span>الدفع الآن عبر Chargily</span>';
    }
}

function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');

    if (payment === 'success') {
        document.getElementById('success-modal').classList.remove('hidden');
        showToast('تم تأكيد الاشتراك بنجاح!', 'success');
    } else if (payment === 'failed') {
        showToast('فشلت عملية الدفع. حاول مرة أخرى.', 'error');
    } else if (payment === 'error') {
        showToast('حدث خطأ في معالجة الدفع.', 'error');
    }

    // Clean URL
    if (payment) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

function closeSuccessModal() {
    document.getElementById('success-modal').classList.add('hidden');
    window.location.reload();
}

function scrollToPricing() {
    document.getElementById('pricing-section').scrollIntoView({ behavior: 'smooth' });
}

// ===== UTILITY FUNCTIONS =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('i');

    toastMessage.textContent = message;

    toastIcon.className = 'fas ';
    switch(type) {
        case 'success':
            toastIcon.classList.add('fa-check-circle');
            toastIcon.style.color = 'var(--success)';
            break;
        case 'error':
            toastIcon.classList.add('fa-exclamation-circle');
            toastIcon.style.color = 'var(--danger)';
            break;
        case 'warning':
            toastIcon.classList.add('fa-exclamation-triangle');
            toastIcon.style.color = 'var(--warning)';
            break;
        default:
            toastIcon.classList.add('fa-info-circle');
            toastIcon.style.color = 'var(--primary-light)';
    }

    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}
