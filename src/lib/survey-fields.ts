/**
 * 설문 필드 단일 소스(Single Source of Truth).
 * 엑셀 접수 항목 ↔ DB(surveys) 컬럼 ↔ 입력 타입/주체 매핑을 한 곳에서 정의한다.
 * 공개 접수 폼 / 관리 테이블 / 수기 등록·수정 폼이 모두 이 정의를 재사용한다.
 *
 * DB 스키마: veyor-app/apps/server/supabase/migrations
 *   - 20260603060737_initial_schema.sql (surveys 최초)
 *   - 20260618100257_admin_survey_intake.sql (접수/승인/정산 확장)
 */

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'money'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'url'
  | 'select';

export type FieldOwner = 'customer' | 'operator';

export interface SurveyFieldDef {
  /** DB 컬럼명 */
  column: keyof SurveyRow;
  /** 화면 라벨(엑셀 항목 기반) */
  label: string;
  kind: FieldKind;
  /** customer = 공개 접수 폼 입력 / operator = 운영자 관리 입력 */
  owner: FieldOwner;
  /** 공개 접수 폼에 노출할지 */
  inIntake: boolean;
  /** 접수 폼 필수 여부 */
  requiredInIntake?: boolean;
  /** 수기 등록 등에서 필수 표시 */
  required?: boolean;
  /** select 옵션 */
  options?: { value: string; label: string }[];
  /** 입력 도움말/예시 */
  hint?: string;
  /** 입력칸 placeholder(예시값) */
  placeholder?: string;
}

/** surveys 테이블 한 행의 전체 형태(마이그레이션 반영). */
export interface SurveyRow {
  id: string;
  // 워크플로 상태
  approval_status: 'pending' | 'approved' | 'rejected';
  is_published: boolean;
  source: 'manual' | 'intake';
  // 고객 접수 항목
  topic: string | null;
  target_description: string | null;
  target_occupation: string | null;
  deadline: string | null;
  requested_publish_date: string | null;
  suggested_amount: number | null;
  contact: string | null;
  target_respondents: number | null;
  interview_consent: boolean | null;
  reward_budget: string | null;
  paid_recruit_count: number | null;
  // 운영자 관리 항목
  pre_contact_done: boolean;
  pre_contact_reply: string | null;
  post_contact_done: boolean;
  post_contact_reply: string | null;
  settlement_status: 'pending' | 'invoiced' | 'paid';
  collected_responses: number;
  admin_note: string | null;
  // 앱 노출(확정) 항목
  title: string;
  external_url: string;
  reward_amount: number;
  est_minutes: string | null;
  target_gender: 'male' | 'female' | null;
  target_birth_year_min: number | null;
  target_birth_year_max: number | null;
  opens_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── 테이블 분리: surveys(소비자/게이트) + survey_intakes(접수 원본) + survey_operations(운영/정산) 1:1 ──
// SurveyRow 는 플랫 유지(컴포넌트 무변경). 조회 시 합치고, 저장 시 컬럼을 물리 테이블로 분배한다.

/** survey_intakes 로 분리된 컬럼(고객 접수 원본). */
export const INTAKE_COLUMNS = [
  'topic',
  'target_description',
  'requested_publish_date',
  'deadline',
  'suggested_amount',
  'contact',
  'target_respondents',
  'interview_consent',
  'reward_budget',
  'paid_recruit_count',
] as const;

/** survey_operations 로 분리된 컬럼(운영/정산). */
export const OPS_COLUMNS = [
  'pre_contact_done',
  'pre_contact_reply',
  'post_contact_done',
  'post_contact_reply',
  'settlement_status',
  'collected_responses',
  'admin_note',
] as const;

/** 중첩 조회용 select (surveys + 1:1 확장 테이블). */
export const SURVEY_SELECT = '*, survey_intakes(*), survey_operations(*)';

const INTAKE_SET = new Set<string>(INTAKE_COLUMNS);
const OPS_SET = new Set<string>(OPS_COLUMNS);

/** 컬럼이 실제로 사는 물리 테이블. */
export function tableOf(column: string): 'surveys' | 'survey_intakes' | 'survey_operations' {
  if (INTAKE_SET.has(column)) return 'survey_intakes';
  if (OPS_SET.has(column)) return 'survey_operations';
  return 'surveys';
}

/** 중첩 조회 결과 1행을 플랫 SurveyRow로 합친다(확장 테이블 값 우선). */
export function flattenSurvey(row: Record<string, unknown>): SurveyRow {
  const pick = (v: unknown) =>
    (Array.isArray(v) ? v[0] : v) as Record<string, unknown> | null | undefined;
  const intake = pick(row.survey_intakes) ?? {};
  const operations = pick(row.survey_operations) ?? {};
  const base: Record<string, unknown> = { ...row };
  delete base.survey_intakes;
  delete base.survey_operations;
  return { ...base, ...intake, ...operations } as unknown as SurveyRow;
}

/** 플랫 행을 테이블별 페이로드로 분리. */
export function splitByTable(row: Record<string, unknown>): {
  surveys: Record<string, unknown>;
  intakes: Record<string, unknown>;
  operations: Record<string, unknown>;
} {
  const surveys: Record<string, unknown> = {};
  const intakes: Record<string, unknown> = {};
  const operations: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (INTAKE_SET.has(key)) intakes[key] = value;
    else if (OPS_SET.has(key)) operations[key] = value;
    else surveys[key] = value;
  }
  return { surveys, intakes, operations };
}

export const APPROVAL_OPTIONS = [
  { value: 'pending', label: '대기' },
  { value: 'approved', label: '승인' },
  { value: 'rejected', label: '반려' },
];

export const SETTLEMENT_OPTIONS = [
  { value: 'pending', label: '대기' },
  { value: 'invoiced', label: '청구' },
  { value: 'paid', label: '완료' },
];

export const GENDER_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
];

export const OCCUPATION_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'school_student', label: '중·고등학생' },
  { value: 'college_student', label: '대학생' },
  { value: 'graduate_student', label: '대학원생' },
  { value: 'job_seeker', label: '취업 준비생' },
  { value: 'office_worker', label: '직장인' },
  { value: 'freelancer', label: '프리랜서' },
  { value: 'self_employed', label: '자영업자' },
  { value: 'homemaker', label: '주부' },
  { value: 'unemployed', label: '무직' },
  { value: 'retired', label: '은퇴' },
  { value: 'other', label: '기타' },
];

export const SOURCE_LABEL: Record<SurveyRow['source'], string> = {
  manual: '수기',
  intake: '접수',
};

/**
 * 고객(모집자)이 공개 접수 폼에서 입력하는 항목. 엑셀 열 순서를 따른다.
 */
export const INTAKE_FIELDS: SurveyFieldDef[] = [
  {
    column: 'topic',
    label: '주제',
    kind: 'text',
    owner: 'customer',
    inIntake: true,
    requiredInIntake: true,
    hint: '설문 주제를 입력해주세요.',
  },
  {
    column: 'target_description',
    label: '대상',
    kind: 'textarea',
    owner: 'customer',
    inIntake: true,
    requiredInIntake: true,
    hint: '설문 대상(연령/성별/특성 등)을 자유롭게 적어주세요.',
  },
  {
    column: 'target_occupation',
    label: '직업',
    kind: 'select',
    owner: 'customer',
    inIntake: true,
    options: OCCUPATION_OPTIONS,
    hint: '설문 대상의 직업군을 선택해주세요.',
  },
  {
    column: 'requested_publish_date',
    label: '게시일',
    kind: 'date',
    owner: 'customer',
    inIntake: true,
    hint: '설문을 게시할 날짜입니다. 마감일은 게시일 다음 날로 자동 설정됩니다.',
  },
  {
    column: 'suggested_amount',
    label: '적정 금액',
    kind: 'money',
    owner: 'customer',
    inIntake: true,
    hint: '1인당 적정 리워드 금액(원).',
  },
  {
    column: 'external_url',
    label: '설문조사 링크',
    kind: 'url',
    owner: 'customer',
    inIntake: true,
    requiredInIntake: true,
    hint: '설문조사 링크를 붙여주세요.',
  },
  {
    column: 'contact',
    label: '연락처',
    kind: 'text',
    owner: 'customer',
    inIntake: true,
    requiredInIntake: true,
    hint: '전화번호, 이메일, 카카오톡 아이디 등',
  },
  {
    column: 'target_respondents',
    label: '목표 인원',
    kind: 'number',
    owner: 'customer',
    inIntake: true,
    hint: '설문 목표 인원은 몇 명인가요?',
  },
  {
    column: 'interview_consent',
    label: '인터뷰 동의',
    kind: 'boolean',
    owner: 'customer',
    inIntake: true,
    hint: '모집 종료 후 만족도 조사를 위한 3분 전화 인터뷰에 동의하시나요?',
  },
  {
    column: 'reward_budget',
    label: '리워드 예산',
    kind: 'text',
    owner: 'customer',
    inIntake: true,
    hint: '예) 스타벅스 기프티콘 5명 20,000원',
  },
  {
    column: 'paid_recruit_count',
    label: '유료 모집 인원',
    kind: 'number',
    owner: 'customer',
    inIntake: true,
    hint: '이 서비스를 통해 몇 명을 모집하고 싶으신가요?(유료)',
  },
];

/**
 * 운영자가 관리(검토/승인/정산)하면서 채우는 항목.
 */
export const OPERATOR_FIELDS: SurveyFieldDef[] = [
  {
    column: 'approval_status',
    label: '승인 여부',
    kind: 'select',
    owner: 'operator',
    inIntake: false,
    options: APPROVAL_OPTIONS,
  },
  {
    column: 'is_published',
    label: '게시여부',
    kind: 'boolean',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'pre_contact_done',
    label: '게시 전 연락',
    kind: 'boolean',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'pre_contact_reply',
    label: '게시 전 회신',
    kind: 'text',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'post_contact_done',
    label: '게시 후 연락',
    kind: 'boolean',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'post_contact_reply',
    label: '게시 후 회신',
    kind: 'text',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'settlement_status',
    label: '정산',
    kind: 'select',
    owner: 'operator',
    inIntake: false,
    options: SETTLEMENT_OPTIONS,
  },
  {
    column: 'collected_responses',
    label: '확보 응답 수',
    kind: 'number',
    owner: 'operator',
    inIntake: false,
    placeholder: '예: 50',
  },
  {
    column: 'admin_note',
    label: '운영 메모',
    kind: 'textarea',
    owner: 'operator',
    inIntake: false,
    placeholder: '내부 메모',
  },
];

/** 상태 제어(승인 여부 · 게시여부) — 상세 상단 강조용. */
export const STATUS_FIELDS: SurveyFieldDef[] = OPERATOR_FIELDS.filter(
  (f) => f.column === 'approval_status' || f.column === 'is_published',
);

/** 운영 · 정산 항목(상태 제외). */
export const OPS_FIELDS: SurveyFieldDef[] = OPERATOR_FIELDS.filter(
  (f) => f.column !== 'approval_status' && f.column !== 'is_published',
);

/**
 * 앱(오늘의 설문)에 실제 노출되는 확정 항목. 운영자가 승인·게시 시 확정한다.
 */
export const PUBLISH_FIELDS: SurveyFieldDef[] = [
  {
    column: 'title',
    label: '노출 제목',
    kind: 'text',
    owner: 'operator',
    inIntake: false,
    required: true,
    hint: '앱에 표시될 설문 제목.',
    placeholder: '예: 데일리 보부상 가방 디자인 설문조사',
  },
  {
    column: 'reward_amount',
    label: '리워드 금액(확정)',
    kind: 'money',
    owner: 'operator',
    inIntake: false,
    placeholder: '예: 300',
  },
  {
    column: 'est_minutes',
    label: '예상 소요시간',
    kind: 'text',
    owner: 'operator',
    inIntake: false,
    hint: '예) 2-3',
    placeholder: '2-3',
  },
  {
    column: 'target_gender',
    label: '타깃 성별',
    kind: 'select',
    owner: 'operator',
    inIntake: false,
    options: GENDER_OPTIONS,
  },
  {
    column: 'target_birth_year_min',
    label: '출생연도(최소)',
    kind: 'number',
    owner: 'operator',
    inIntake: false,
    placeholder: '예: 1990',
  },
  {
    column: 'target_birth_year_max',
    label: '출생연도(최대)',
    kind: 'number',
    owner: 'operator',
    inIntake: false,
    placeholder: '예: 2005',
  },
  // 노출 기간(opens_at·expires_at)은 폼에서 직접 입력하지 않는다.
  // "게시" 시 단일 날짜를 받아 오전 10시 KST 기준 1일로 자동 설정(publishSurvey).
];

/** 앱 베이스 도메인 — 완료 인증 링크 등에 사용. */
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'https://bsg.io.kr';

/**
 * 설문 완료 인증 링크. 운영자가 외부 설문 마지막 페이지에 붙여넣어,
 * 응답자가 이 주소로 복귀하면 완료가 인증된다.
 */
export function completionUrl(surveyId: string): string {
  return `${APP_BASE_URL}/surveys/${surveyId}/complete`;
}

/** 관리 테이블 컬럼 순서(엑셀 느낌): 상태 → 접수 → 운영. */
export const TABLE_FIELDS: SurveyFieldDef[] = [
  ...OPERATOR_FIELDS.filter((f) => f.column === 'approval_status' || f.column === 'is_published'),
  { column: 'topic', label: '주제', kind: 'text', owner: 'customer', inIntake: true },
  { column: 'title', label: '노출 제목', kind: 'text', owner: 'operator', inIntake: false },
  { column: 'target_description', label: '대상', kind: 'text', owner: 'customer', inIntake: true },
  {
    column: 'target_occupation',
    label: '직업',
    kind: 'select',
    owner: 'customer',
    inIntake: true,
    options: OCCUPATION_OPTIONS,
  },
  {
    column: 'requested_publish_date',
    label: '게시일',
    kind: 'date',
    owner: 'customer',
    inIntake: true,
  },
  { column: 'deadline', label: '마감일(자동)', kind: 'date', owner: 'customer', inIntake: true },
  {
    column: 'reward_amount',
    label: '리워드(확정)',
    kind: 'money',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'suggested_amount',
    label: '적정 금액',
    kind: 'money',
    owner: 'customer',
    inIntake: true,
  },
  {
    column: 'reward_budget',
    label: '리워드 예산',
    kind: 'text',
    owner: 'customer',
    inIntake: true,
  },
  { column: 'external_url', label: '설문 링크', kind: 'url', owner: 'customer', inIntake: true },
  { column: 'contact', label: '연락처', kind: 'text', owner: 'customer', inIntake: true },
  {
    column: 'target_respondents',
    label: '목표 인원',
    kind: 'number',
    owner: 'customer',
    inIntake: true,
  },
  {
    column: 'paid_recruit_count',
    label: '유료 모집',
    kind: 'number',
    owner: 'customer',
    inIntake: true,
  },
  {
    column: 'interview_consent',
    label: '인터뷰 동의',
    kind: 'boolean',
    owner: 'customer',
    inIntake: true,
  },
  {
    column: 'pre_contact_done',
    label: '게시 전 연락',
    kind: 'boolean',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'pre_contact_reply',
    label: '게시 전 회신',
    kind: 'text',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'post_contact_done',
    label: '게시 후 연락',
    kind: 'boolean',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'post_contact_reply',
    label: '게시 후 회신',
    kind: 'text',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'collected_responses',
    label: '확보 응답',
    kind: 'number',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'settlement_status',
    label: '정산',
    kind: 'select',
    owner: 'operator',
    inIntake: false,
    options: SETTLEMENT_OPTIONS,
  },
];
