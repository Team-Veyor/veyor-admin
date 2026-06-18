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
  /** select 옵션 */
  options?: { value: string; label: string }[];
  /** 입력 도움말/예시 */
  hint?: string;
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
  },
  {
    column: 'admin_note',
    label: '운영 메모',
    kind: 'textarea',
    owner: 'operator',
    inIntake: false,
  },
];

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
    hint: '앱에 표시될 설문 제목.',
  },
  {
    column: 'reward_amount',
    label: '리워드 금액(확정)',
    kind: 'money',
    owner: 'operator',
    inIntake: false,
  },
  {
    column: 'est_minutes',
    label: '예상 소요시간',
    kind: 'text',
    owner: 'operator',
    inIntake: false,
    hint: '예) 2-3',
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
  },
  {
    column: 'target_birth_year_max',
    label: '출생연도(최대)',
    kind: 'number',
    owner: 'operator',
    inIntake: false,
  },
  { column: 'opens_at', label: '노출 시작', kind: 'datetime', owner: 'operator', inIntake: false },
  {
    column: 'expires_at',
    label: '노출 종료',
    kind: 'datetime',
    owner: 'operator',
    inIntake: false,
  },
];

/** 관리 테이블 컬럼 순서(엑셀 느낌): 상태 → 접수 → 운영. */
export const TABLE_FIELDS: SurveyFieldDef[] = [
  ...OPERATOR_FIELDS.filter((f) => f.column === 'approval_status' || f.column === 'is_published'),
  { column: 'topic', label: '주제', kind: 'text', owner: 'customer', inIntake: true },
  { column: 'title', label: '노출 제목', kind: 'text', owner: 'operator', inIntake: false },
  { column: 'target_description', label: '대상', kind: 'text', owner: 'customer', inIntake: true },
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
