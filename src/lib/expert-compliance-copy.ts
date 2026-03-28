import type { ExpertPanelMode } from '@/lib/expert-roles';

export type ComplianceAudience = 'expert' | 'client';

export type ExpertComplianceBlock = {
  title: string;
  lines: string[];
};

/** Huquq va psixologiya uchun qisqa ogohlantirish matnlari */
export function getExpertComplianceNotice(
  mode: ExpertPanelMode,
  audience: ComplianceAudience
): ExpertComplianceBlock | null {
  if (mode === 'legal') {
    if (audience === 'expert') {
      return {
        title: 'Huquqiy maslahat — eslatma',
        lines: [
          "Platformadagi muloqot umumiy ma'lumot xarakterida bo'lishi mumkin; bu rasmiy huquqiy shartnoma yoki sudga taqdim etiladigan fikr emas.",
          "Mijoz yuklaydigan hujjatlarning aslligi va to'liqligi uchun asosan mijoz javobgar; siz tahlilni ularga tayangan holda berasiz.",
          "Qonunbuzarlikka chaqiruvchi yoki yolg'on hujjat tavsiyalari berilmaydi — professional me'yorlarga rioya qiling.",
        ],
      };
    }
    return {
      title: 'Mijoz uchun huquqiy eslatma',
      lines: [
        "Onlayn maslahat yuzma-yuz advokat qabulxonasidagi xizmatga almashtirilmaydi; murakkab ishlar uchun rasmiy murojaat tavsiya etiladi.",
        "Internet orqali hujjat almashinuvida texnik xavf bor — juda sezgir ma'lumotlarni ixtiyoriy yuboring.",
        "Mutaxassis fikri har bir holat uchun yakuniy huquqiy xulosada emas; aniq holatingiz bo'yicha mahalliy huquqshunos bilan kelishingiz mumkin.",
      ],
    };
  }

  if (mode === 'psychology') {
    if (audience === 'expert') {
      return {
        title: 'Maxfiylik va professional etika',
        lines: [
          "Sessiya mazmuni (chat, qaydlar, yozuvlar) professional yordam ramkasida qolishi kerak; keraksiz tarqatish etikaga zid.",
          "Ruxsatsiz yozuv/yuklashdan qoching; minimallashtirilgan qayd yuriting.",
          "Platforma texnik saqlash mumkin — mijozga qanday ma'lumot ishlatilishini qisqacha tushuntiring.",
        ],
      };
    }
    return {
      title: 'Psixologik maslahat — maxfiylik',
      lines: [
        "Suhbat shaxsiy muhitda o'tishi tavsiya etiladi; boshqa odamlar yonida ekran ochmang.",
        "Sessiya yozuvi yoki qayd faqat sizning roziligingiz bilan.",
        "O'ziga yoki boshqaga zarar xavfi bo'lsa, tezkor yordam xizmatlariga murojaat qiling.",
      ],
    };
  }

  return null;
}
