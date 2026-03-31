import type { ExpertActionKind } from '@/lib/expert-roles';

export type ClientTermsBlock = {
  paymentTitle: string;
  paymentLines: string[];
  consultTitle: string;
  consultLines: string[];
};

/** O‘ng panel: to‘lov va maslahat shartlari (mijoz uchun) */
export function getClientServiceTerms(actionType: ExpertActionKind | null): ClientTermsBlock {
  if (actionType === 'mentor') {
    return {
      paymentTitle: "To'lov qilish shartlari",
      paymentLines: [
        "To'lov MALI hamyoningiz orqali amalga oshiriladi; summaning qismi obuna muddati tugaguncha qulflangan balansda saqlanadi.",
        "Profilda ko'rsatilgan obuna narxi ustozning 30 kunlik dars paketi uchun belgilanadi; to'lovdan oldin summani tekshiring.",
        "Pul o'tkazishdan keyin qaytarish qoidalari platforma va ustoz bilan kelishilgan tartibda — e'tibor bilan o'qing.",
        "Karta yoki boshqa usul bilan to'lov platforma ulanishiga bog'liq; tranzaksiya muvaffaqiyatsiz bo'lsa, hamyon balansini tekshiring.",
      ],
      consultTitle: 'Maslahat / dars olish shartlari',
      consultLines: [
        "Avval shaxsiy chat orqali ustoz bilan yozishingiz mumkin; keyin obuna va guruhga qo'shilish tugmalari ishlaydi.",
        "Guruhga kirish faqat to'lov tasdig'idan keyin yoki faol obuna bo'lganda ochiladi.",
        "Dars vaqti va materiallar ustoz bilan chatda kelishiladi — platforma faqat aloqa vositasi.",
        "Texnik nosozlikda qo'llab-quvvatlashga murojaat qiling; dars sifati bo'yicha ustozga to'g'ridan-to'g'ri yozing.",
      ],
    };
  }

  return {
    paymentTitle: "To'lov qilish shartlari",
    paymentLines: [
      "Asosiy maslahat yozish chat orqali bepul boshlanishi mumkin; chuqur yoki uzoq suhbat uchun narxi profilda (soat yoki seans) ko'rsatiladi.",
      "Agar platforma komissiyasi yoki oldindan to'lov talab qilinsa, hamyon orqali amalga oshiriladi — tranzaksiya tarixini saqlang.",
      "To'lovni tasdiqlashdan oldin mutaxassisning narxi va valyutasini tekshiring (MALI / boshqa).",
      "Nizoli holatlarda platforma aralashuvi cheklangan; pul masalalari uchun hamyon va chat yozuvlaridan foydalaning.",
    ],
    consultTitle: 'Maslahat olish shartlari',
    consultLines: [
      "«Maslahat olish» yoki markazdagi chat tugmasi orqali shaxsiy suhbat ochiladi — savolingizni aniq yozing.",
      "Mutaxassis javobi ish vaqtiga bog'liq; shoshilinch holatlarda yuzma-yuz xizmat yoki 998 raqamlarini qo'shimcha aniqlang.",
      "Onlayn maslahat yuzma-yuz qabulxonani to'liq almashtirmaydi; murakkab ishlar uchun rasmiy hujjat va mahalliy mutaxassis kerak bo'lishi mumkin.",
      "Sessiya yoki video uchrashuv mutaxassis paneli orqali davom etadi — chatda berilgan yo'riqnomalarga amal qiling.",
    ],
  };
}
