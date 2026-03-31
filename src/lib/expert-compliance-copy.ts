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
      title: 'Muloqot paytida etibor berishingiz kerak',
      lines: [
        "Bu muloqot rasmiy advokatlik xulosasi yoki sudga taqdim etiladigan hujjat emas — umumiy ma'lumot xarakterida bo‘lishi mumkin.",
        "Savolingizni aniqlab yozing: kim ishtirokchi, nima sodir bo‘ldi, qachon — qisqa va tartibli.",
        "Hujjatlarni yuborishdan oldin nomlang; ortiqcha shaxsiy yoki bank ma’lumotlarini faqat zarur bo‘lsa ham ulashing.",
        "Mutaxassis javobini diqqat bilan o‘qing; tushunmagan so‘z yoki bandni darhol aniqlashtiring.",
        "Bir nechta savol bo‘lsa, navbat bilan yuboring — uzun bitta xabar ham, bo‘laklab ham yozish mumkin.",
        "Shovqinli joyda bo‘lsangiz, chatda xato tushunish bo‘lishi mumkin; imkon qadar tinch muhit tanlang.",
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
      title: 'Muloqot paytida etibor berishingiz kerak',
      lines: [
        "O‘zingizni xavfsiz his qiladigan joyda o‘ting; boshqa odamlar ekran yoki suhbatni eshitmasin.",
        "Sessiya vaqtida boshqa ilovalar va xabarlarga kamroq chalg‘ing — diqqat sessiyaga qaratilsin.",
        "Ochiq gapiring; agar mavzu og‘ir bo‘lsa, “bir oz to‘xtataman” deb ayting — pacing sizniki.",
        "Psixolog so‘rovlari chalkash bo‘lsa, “boshqacha tushuntirasizmi?” deb so‘rashingiz mumkin.",
        "O‘zingizga yoki boshqaga zarar xavfi sezsangiz, zudlik bilan 112 / mahalliy favqulodda yordamga murojaat qiling.",
      ],
    };
  }

  return null;
}
