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
        header: 'Huquqiy konsultatsiya',
        roleLine: 'Mijozlar bilan maslahat va hujjatlar',
        sessionNotifyWord: 'Sessiya',
        primaryStartLabel: 'Sessiyani boshlash',
        primaryStartedLabel: 'Boshlangan',
        rightPanelMaterialsTitle: 'Materiallar',
      };
    case 'psychology':
      return {
        header: 'Sessiya paneli',
        roleLine: 'Mijozlar bilan psixologik uchrashuv',
        sessionNotifyWord: 'Sessiya',
        primaryStartLabel: 'Sessiyani boshlash',
        primaryStartedLabel: 'Boshlangan',
        rightPanelMaterialsTitle: 'Materiallar',
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
