/**
 * Mutaxassis kasbi bo'yicha UI harakatlari (dars / maslahat) — ProfileViewer bilan bir xil ro'yxat.
 */

export const MENTOR_PROFESSIONS = new Set([
  "O'qituvchi",
  'Mentor',
  'Startap mentori',
  'Dasturchi mentor',
]);

export function isMentorProfession(prof: string | undefined | null): boolean {
  if (!prof || typeof prof !== 'string') return false;
  const t = prof.trim();
  if (MENTOR_PROFESSIONS.has(t)) return true;
  const k = professionKey(t);
  if (!k) return false;
  /** DBda turli apostrof / dash: "O‘qituvchi", "Matematika o‘qituvchisi" */
  if (
    /\boqituvchi\b|mentor|teacher|tutor|ustoz|ustoz\s|repetitor|professor|препод|наставник|репетитор/.test(k)
  ) {
    return true;
  }
  if (/dasturchi\s*mentor|startap\s*mentor/.test(k)) return true;
  return false;
}

/** Advokat / yurist — aniq ro'yxat (DBda bosh harf farqi, "Advakat" imlosi) */
const LEGAL_PROFESSION_KEYS = new Set([
  "advokat",
  "advakat",
  "yurist",
  "huquqshunos",
  "advocate",
  "attorney",
  "jurist",
  "notarius",
  "адвокат",
  "юрист",
]);

function professionKey(prof: string | undefined | null): string {
  if (!prof || typeof prof !== 'string') return '';
  return prof
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ё/g, 'е');
}

export function isLegalProfession(prof: string | undefined | null): boolean {
  const k = professionKey(prof);
  if (!k) return false;
  if (LEGAL_PROFESSION_KEYS.has(k)) return true;
  if (/advok|yurist|huquq|jurist|notarius|lawyer|attorne|advocate/.test(k)) return true;
  return false;
}

export type ExpertActionKind = 'mentor' | 'consultant' | null;

/** Mutaxassis paneli rejimi — mentor darsidan boshqa kasblar uchun alohida matn va funksiya filtri */
export type ExpertPanelMode = 'mentor' | 'legal' | 'psychology' | 'consult';

export type ExpertPanelLabels = {
  header: string;
  roleLine: string;
  sessionNotifyWord: string;
  primaryStartLabel: string;
  primaryStartedLabel: string;
  rightPanelMaterialsTitle: string;
  /** Yuqori paneldagi taymer yorlig‘i */
  sessionTimerLabel?: string;
  /** Chap ustun: «Sessiyani boshqarish» o‘rniga */
  manageSessionTitle?: string;
  /** Konsultatsiya: mijozlar ro‘yxati bo‘sh */
  consultClientsEmptyHint?: string;
  /** Konsultatsiya: «Yakunlash» tasdiq oynasi */
  consultFinishConfirm?: string;
  /** «Qabul xabari» tugmasi tooltip */
  consultInviteTooltip?: string;
  /** O‘ng panel: fayllar ro‘yxati sarlavhasi (masalan «Kurs materiallari» / «Yuklangan hujjatlar») */
  rightPanelListSectionTitle?: string;
  /** O‘ng panel: yuklash tugmasi */
  rightPanelUploadLabel?: string;
  rightPanelUploadHint?: string;
  /** O‘ng panel yig‘ish (chevron) */
  rightPanelToggleCloseLabel?: string;
  rightPanelToggleOpenLabel?: string;
};

export function getExpertPanelLabels(mode: ExpertPanelMode): ExpertPanelLabels {
  switch (mode) {
    case 'mentor':
      return {
        header: 'Ustoz paneli',
        roleLine: 'Jonli dars va guruhlar',
        sessionNotifyWord: 'Dars',
        primaryStartLabel: 'Darsni boshlash',
        primaryStartedLabel: 'Boshlandi',
        rightPanelMaterialsTitle: 'Materiallar va viktorinalar',
      };
    case 'legal':
      return {
        header: 'Huquqshunos paneli',
        roleLine: 'Huquqiy maslahat · mijozlar va hujjatlar',
        sessionNotifyWord: 'Sessiya',
        primaryStartLabel: 'Sessiyani boshlash',
        primaryStartedLabel: 'Boshlangan',
        rightPanelMaterialsTitle: 'Materiallar va hujjatlar',
        sessionTimerLabel: 'Maslahat vaqti',
        manageSessionTitle: 'Huquqiy konsultatsiya',
        consultClientsEmptyHint:
          "Hali e'londan yozilgan mijoz yo‘q. Mijozlar «Mutaxassislar / xizmatlar» bo‘limidan sizning e’loningiz orqali shaxsiy chatni boshlaydi.",
        consultFinishConfirm:
          "Mijoz bilan sessiyani yakunlaysizmi? Mijoz paneli yopiladi (chat o‘chirilmaydi). Muhim hujjatlarni oldindan saqlab oling.",
        consultInviteTooltip:
          "Mijoz chatiga huquqiy konsultatsiyaga ulanish taklifi (tugma) bilan xabar yuboriladi",
        rightPanelListSectionTitle: 'Yuklangan hujjatlar',
        rightPanelUploadLabel: 'Hujjat yuklash',
        rightPanelUploadHint: 'Mijoz chatiga havola — fayl nomi va ochish havolasi tushadi',
        rightPanelToggleCloseLabel: 'Hujjatlar panelini yashirish',
        rightPanelToggleOpenLabel: 'Hujjatlar panelini ochish',
      };
    case 'psychology':
      return {
        header: 'Sessiya paneli',
        roleLine: 'Mijozlar bilan psixologik uchrashuv',
        sessionNotifyWord: 'Sessiya',
        primaryStartLabel: 'Sessiyani boshlash',
        primaryStartedLabel: 'Boshlangan',
        rightPanelMaterialsTitle: 'Materiallar',
        sessionTimerLabel: 'Sessiya vaqti',
        manageSessionTitle: 'Psixologik sessiya',
        consultClientsEmptyHint:
          "Hali shaxsiy suhbat yo‘q. Xabarlar bo‘limida mijoz bilan yozishib boshlang — keyin «Qabul xabari» yuboring.",
        consultFinishConfirm:
          "Mijoz bilan sessiyani yakunlaysizmi? Mijoz paneli yopiladi (chat o‘chirilmaydi). Sessiya mazmuni maxfiyligini saqlang.",
        consultInviteTooltip:
          "Mijoz chatiga psixologik uchrashuvga ulanish taklifi bilan xabar yuboriladi",
        rightPanelListSectionTitle: 'Sessiya materiallari',
        rightPanelUploadLabel: 'Material yuklash',
        rightPanelUploadHint: 'Mijoz chatiga havola bilan tushadi',
        rightPanelToggleCloseLabel: 'Materiallar panelini yashirish',
        rightPanelToggleOpenLabel: 'Materiallar panelini ochish',
      };
    case 'consult':
    default:
      return {
        header: 'Konsultatsiya paneli',
        roleLine: 'Mijozlar bilan onlayn uchrashuv',
        sessionNotifyWord: 'Sessiya',
        primaryStartLabel: 'Uchrashuvni boshlash',
        primaryStartedLabel: 'Boshlangan',
        rightPanelMaterialsTitle: 'Materiallar',
        sessionTimerLabel: 'Sessiya vaqti',
        consultClientsEmptyHint:
          "Hali shaxsiy suhbat yo‘q. Xabarlar sahifasidan mijoz bilan chatni boshlang.",
        consultFinishConfirm:
          "Mijoz bilan sessiyani yakunlaysizmi? Mijoz paneli yopiladi (chat o‘chirilmaydi).",
        consultInviteTooltip:
          "Mijoz chatiga «Uchrashuvga ulanish» tugmasi bilan taklif yuboriladi",
        rightPanelListSectionTitle: 'Materiallar ro‘yxati',
        rightPanelUploadLabel: 'Material yuklash',
        rightPanelUploadHint: 'Mijoz chatiga havola bilan tushadi',
        rightPanelToggleCloseLabel: 'Materiallar panelini yashirish',
        rightPanelToggleOpenLabel: 'Materiallar panelini ochish',
      };
  }
}

/**
 * Profil maydonlaridan panel rejimini aniqlash (1-bosqich: UI va klass uchun vositalar filtri).
 */
export function getExpertPanelMode(expert: {
  profession?: string;
  specialty?: string;
  bio_expert?: string;
  specialty_desc?: string;
} | null): ExpertPanelMode {
  if (!expert) return 'consult';

  const profession = (expert.profession || '').trim();
  if (isMentorProfession(profession)) return 'mentor';

  /** Huquq / psixologiya — avval (bio'da "dars" so'zi bo'lsa ham mentor bo'lib ketmasin) */
  if (isLegalProfession(expert.profession) || isLegalProfession(expert.specialty)) {
    return 'legal';
  }

  const p = (expert.profession || expert.specialty || '').toLowerCase();
  const bio = (expert.bio_expert || expert.specialty_desc || '').toLowerCase();
  const text = `${p} ${bio}`;

  if (
    /psixolog|psixoterap|psycholog|klinik psix|oila psix|bolalar psix|terapevt|psixiatr|psixosomat|mental|depressiya|\bstress\b|trevoga|anxiety/i.test(
      text
    )
  ) {
    return 'psychology';
  }

  if (
    /advokat|advakat|yurist|lawyer|huquqshunos|jurist|notarius|soliq maslahatchi|migratsiya|mehnat huquqi|advocate|attorney|legal\b|compliance|адвокат|юрист/i.test(
      text
    )
  ) {
    return 'legal';
  }

  /** Mentor konteksti: "coach" qo'shilmagan — "career coach" konsultatsiyada qolishi kerak */
  if (
    /o['']?qituvchi|mentor|teacher|tutor|startap|dasturchi\s*mentor|\blesson\b|\bustoz\b|repetitor|professor|препод|наставник|репетитор/i.test(
      text
    )
  ) {
    return 'mentor';
  }

  if (
    /maslahat|career coach|dietolog|shifokor|nutrient|reabilitatsiya|konferans|biznes maslahat|consultant|consulting/i.test(
      text
    )
  ) {
    return 'consult';
  }

  return 'consult';
}

export function isMentorPanelMode(mode: ExpertPanelMode): boolean {
  return mode === 'mentor';
}

/** Soket `consult_panel_invite` — mijoz chatidagi taklif matni uchun */
export type ConsultPanelInviteStyle = 'mentor' | 'consult' | 'legal' | 'psychology';

export function getConsultPanelInviteSessionStyle(mode: ExpertPanelMode): ConsultPanelInviteStyle {
  if (mode === 'legal') return 'legal';
  if (mode === 'psychology') return 'psychology';
  return 'consult';
}

/**
 * Mentor: aniq kasb ro'yxati yoki matn (bio) bo'yicha.
 * Maslahatchi: huquq / psixologiya va boshqa konsultantlar — regex + aniq qiymatlar.
 */
export function getExpertActionType(expert: {
  profession?: string;
  specialty?: string;
  bio_expert?: string;
  specialty_desc?: string;
} | null): ExpertActionKind {
  if (!expert) return null;

  const mode = getExpertPanelMode(expert);
  if (mode === 'mentor') return 'mentor';
  return 'consultant';
}

/** E'lon / ro'yxat kartalarida narx va birlik matni */
export function formatExpertPublicPrice(exp: {
  hourly_rate?: number | string;
  service_price?: number | string;
  currency?: string;
  pricing_model?: string;
}): { line: string; isSession: boolean } {
  const raw = exp.hourly_rate ?? exp.service_price ?? 0;
  const amount = typeof raw === 'string' ? parseFloat(raw) || 0 : Number(raw) || 0;
  const cur = exp.currency || 'MALI';
  const isSession = exp.pricing_model === 'session';
  const line = `${isSession ? '1 seans' : '1 soat'}: ${amount} ${cur}`;
  return { line, isSession };
}

export function getExpertSpecialtyLine(exp: {
  specialization_details?: string;
  specialization?: string;
}): string {
  const a = (exp.specialization_details || '').trim();
  const b = (exp.specialization || '').trim();
  return a || b || '';
}

/** E‘lon va kartada: avvalo birlashgan tavsif (`specialty_desc`), keyin eski `expert_proposal`, so‘ng bio. */
export function getExpertListingPitch(exp: {
  expert_proposal?: string;
  bio_expert?: string;
  specialty_desc?: string;
}): string {
  const s = (exp.specialty_desc || '').trim();
  if (s) return s;
  const p = (exp.expert_proposal || '').trim();
  if (p) return p;
  const b = (exp.bio_expert || '').trim();
  if (b) return b;
  return '';
}

/** Mutaxassis formasidagi placeholderlar — kasb rejimiga qarab (mentor / psixolog / huquq / boshqalar). */
export type ExpertFormPlaceholders = {
  direction: string;
  /** Mutaxassislik tavsifi + mijozga taklif (e‘lon matni) */
  listing: string;
  /** Tajriba (yil) — qisqa namuna */
  experienceExample: string;
};

export function getExpertFormPlaceholders(mode: ExpertPanelMode): ExpertFormPlaceholders {
  switch (mode) {
    case 'mentor':
      return {
        direction:
          "Masalan: IELTS Academic writing, 9–11-sinf algebra, Python boshlang‘ich, DTM bloklari...",
        listing:
          "Masalan: 6 yillik ustozlik; individual va guruh darslari; darajangizni aniqlab reja tuzaman; materiallar va uy vazifalari bilan ta’minlayman...",
        experienceExample: '6',
      };
    case 'psychology':
      return {
        direction:
          "Masalan: tashvish va panika, depressiya, oila nizolari, bolalar uchun CBT, PTSD...",
        listing:
          "Masalan: 9 yillik amaliyot; 50–60 daqiqalik seans; maxfiylik va bexatar muhit; seanslar oralig‘i va kutilgan qadamlarni oldindan yozaman...",
        experienceExample: '10',
      };
    case 'legal':
      return {
        direction:
          "Masalan: fuqarolik ishlari, mehnat nizolari, migratsiya, shartnomalar, sud himoyasi...",
        listing:
          "Masalan: 12 yillik huquqiy amaliyot; 24–48 soat ichida birinchi javob; hujjatni qisqa muddatda tahlil qilaman; onlayn va offline maslahat...",
        experienceExample: '8',
      };
    case 'consult':
    default:
      return {
        direction:
          "Masalan: soliq optimizatsiya, IT audit, HR maslahati, kichik biznes rejalari...",
        listing:
          "Masalan: qaysi masalalarda yordam bera olishim, ish tartibi, javob va uchrashuv vaqti — bu matn e‘londa ko‘rinadi.",
        experienceExample: '5',
      };
  }
}

export function countExpertGroups(expertGroups: unknown): number {
  if (!expertGroups) return 0;
  try {
    const arr =
      typeof expertGroups === 'string' ? JSON.parse(expertGroups) : expertGroups;
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

export function formatServiceFormatLabel(serviceFormat: string | undefined): string {
  const v = (serviceFormat || '').toLowerCase();
  if (v === 'online') return 'Onlayn';
  if (v === 'offline') return 'Oflayn';
  if (!v) return '—';
  return serviceFormat || '—';
}

/** `/messages?room=...&style=` — talaba/mijoz jonli paneli */
export function parseStudentSessionStyle(raw: string | null | undefined): ExpertPanelMode {
  if (!raw || typeof raw !== 'string') return 'mentor';
  const k = raw.trim().toLowerCase();
  if (k === 'legal' || k === 'psychology' || k === 'consult' || k === 'mentor') return k;
  return 'mentor';
}

export function getStudentPanelExpertLabel(mode: ExpertPanelMode): string {
  switch (mode) {
    case 'legal':
      return 'Huquqshunos';
    case 'psychology':
      return 'Psixolog';
    case 'consult':
      return 'Maslahatchi';
    default:
      return 'Mentor';
  }
}

/** Chap yuqori: «Talaba» yoki «Mijoz» */
export function getStudentSelfRoleLabel(mode: ExpertPanelMode): string {
  return mode === 'mentor' ? 'Talaba' : 'Mijoz';
}
