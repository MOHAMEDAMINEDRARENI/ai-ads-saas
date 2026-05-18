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

أعطني:
1. تحليل الجمهور
2. أفضل نوع إعلانات
3. أفكار محتوى
4. KPIs متوقعة
5. نصائح تحسين ROAS
6. استراتيجية Scaling
7. أفضل أوقات النشر في الجزائر
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