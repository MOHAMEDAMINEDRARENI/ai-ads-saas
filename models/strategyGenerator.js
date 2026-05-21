const groq = require("../services/groq");

class StrategyGenerator {
    constructor(data) {
        this.data = data;
    }

    async generate() {

        const prompt = `
أنت خبير احترافي في Facebook Ads و Instagram Ads للسوق الجزائري.

قم بإنشاء استراتيجية إعلانية مفصلة.

معلومات المشروع:
- اسم المشروع: ${this.data.project_name}
- الجمهور المستهدف: ${this.data.target_audience}
- الفئة العمرية: ${this.data.age_group}
- المنصة: ${this.data.platform}
- الميزانية اليومية: ${this.data.daily_budget} دولار
- مدة الحملة: ${this.data.campaign_days} يوم

أعطني استراتيجية تسويق وإعلانات احترافية ومنظمة جدًا تشمل:

1. تحليل الجمهور المستهدف بالتفصيل

2. أفضل أنواع الإعلانات المناسبة
- فيديو
- صورة
- Carousel
- Reels

3. أفكار محتوى احترافية

4. KPIs متوقعة

5. نصائح تحسين ROAS

6. استراتيجية Scaling

7. أفضل أوقات النشر في الجزائر

8. نص إعلاني جاهز للاستخدام في Facebook Ads و Instagram Ads

9. Hook قوي يجذب الانتباه في أول 3 ثواني

10. Script كامل لفيديو إعلاني قصير
يحتوي على:
- ماذا يقول الشخص
- ترتيب الكلام
- طريقة جذب الزبون
- CTA في النهاية

11. Caption احترافي جاهز للنسخ

12. CTA قوي يدفع الزبون للشراء أو التواصل

13. Hashtags مناسبة

14. أفكار Creative للإعلانات

15. Prompt احترافي لإنشاء صورة إعلانية بالذكاء الاصطناعي
يكون مناسب لـ:
- Midjourney
- Leonardo AI
- DALL·E

16. Prompt احترافي لإنشاء فيديو إعلاني AI
يكون مناسب لـ:
- Runway
- Pika
- Sora
- Kling AI

17. أعطني Style بصري مناسب للإعلان:
- الألوان
- نوع التصوير
- الإضاءة
- شكل المونتاج
- نوع الخطوط

18. أعطني أفكار Hooks بصرية للفيديو.

اجعل النتيجة احترافية جدًا ومنظمة وواضحة.
`;

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
        });

        return {
            aiStrategy: response.choices[0].message.content
        };
    }
}

module.exports = StrategyGenerator;