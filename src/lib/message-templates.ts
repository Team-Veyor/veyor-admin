import { completionUrl, type SurveyRow } from '@/lib/survey-fields';

/**
 * 설문 안내 메시지 템플릿(3종) 자동 생성.
 * 설문 데이터(SurveyRow) + 완료 참여수로 변수를 채워 문자열을 만든다. 운영자가 수정·복사해 사용.
 */

/** 운영자(회사) 수금계좌. NEXT_PUBLIC_OPERATOR_DEPOSIT_ACCOUNT 로 배포 환경에서 교체할 수 있다. */
export const OPERATOR_DEPOSIT_ACCOUNT =
  process.env.NEXT_PUBLIC_OPERATOR_DEPOSIT_ACCOUNT ?? '토스뱅크 1000-7555-5522 김가온';

/** afterPostLink(요청자 참여내역) 호스트 = 어드민 도메인. 커스텀 도메인 있으면 env로 지정. */
export const ADMIN_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_BASE_URL ??
  'https://veyor-admin-git-main-paragon0107s-projects.vercel.app';

/** 요청자용 참여내역(연락처 인증) 공개 링크. */
export function afterPostUrl(surveyId: string): string {
  return `${ADMIN_BASE_URL}/post/${surveyId}`;
}

function won(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('ko-KR');
}

function count(n: number): string {
  return n.toLocaleString('ko-KR');
}

/** date/ISO → 'YYYY-MM-DD' (KST). 날짜 문자열은 그대로, ISO(UTC)는 +9h 후 절단. */
function kstDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = new Date(new Date(value).getTime() + 9 * 60 * 60 * 1000);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** 'YYYY-MM-DD' 다음 날. */
function nextDay(dateStr: string): string {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) {
    return '';
  }
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export type MessageTemplate = { key: string; label: string; body: string };

/** 설문 + 완료수로 3종 안내 메시지를 생성한다. */
export function buildMessages(survey: SurveyRow, completedCount: number): MessageTemplate[] {
  const title = survey.topic || survey.title || '';
  const dueDate = kstDate(survey.deadline);
  const postingDate = kstDate(survey.requested_publish_date) || kstDate(survey.opens_at);
  const postingNext = postingDate ? nextDay(postingDate) : '';
  // 적정 금액을 앱 노출/정산 금액의 기준으로 쓰고, 없을 때만 확정 리워드로 폴백한다.
  const priceApproval = survey.suggested_amount ?? survey.reward_amount ?? 0;
  const pricePost = survey.suggested_amount ?? survey.reward_amount ?? 0;
  const totalPayment = pricePost * completedCount;
  const beforePostLink = completionUrl(survey.id);
  const afterPostLink = afterPostUrl(survey.id);

  const approval = `안녕하세요😊 접수해주신 설문조사 홍보 관련하여 연락드립니다.
보내주신 '${title}' 검토 결과, 현재 운영 중인 MVP에 게시하기에 적합한 조사로 판단되었습니다.

[진행 안내]
설문 홍보는 저희측에서 회원 분들이 참여 후 인증하실 수 있는 링크를 보내드리면, 인증 링크를 설문 마지막 화면에 걸어주시는 방식으로 진행됩니다.
설문 마감일로 응답주신 ${dueDate} 이전 기간 중 하루동안 게시 예정입니다.

[비용 안내]
보내주신 설문 검토 결과, 보상 비용을 1인당 ${won(priceApproval)}원으로 설정했습니다.
- 보상 비용은 설문 응답 후 24시간내에 저희측에서 참여자들에게 전달하며,
설문 진행 이후, 비용 입금해주시면 됩니다!

- 추가 수수료는 없습니다. 환산한 보상 금액만 전달주시면 됩니다.
- 평균적으로 40~50명 참여하고 있다는 점 안내드립니다.

[정말 그 인원들이 설문조사를 했는지 믿을 수 있나요?]
설문 게시 후 정산 시 참여 인원 리스트(개인정보 제외)를 담은 링크를 전달 예정입니다.
링크에서 참여자 수와 참여자들의 인증 시간을 확인할 수 있습니다.

동의하신다면 진행을 위해 확인 회신 부탁드립니다.
감사합니다.`;

  const pre = `설문 게시 전 사전 안내드립니다 😊

* 고객님의 설문은 ${postingDate} 오전 10:00부터 다음날 ${postingNext}일 오전 9:59까지 게시 예정입니다.
* 게시 기간 동안 설문 응답 링크를 임의로 닫거나, 인증 링크를 내리지 않도록 부탁드립니다.
* 진행 종료 후 결과 및 정산 관련하여 별도로 연락드릴 예정입니다.

아래 내용을 복사해서 제작하신 폼 제출 후 볼 수 있는 화면에 붙여넣기 해주세요.(방법은 첨부 사진 가이드 참고)
설문 플랫폼, 백설기용 인증 링크: ${beforePostLink} -> 복사

링크 첨부 후 확인을 위한 문자 부탁드립니다.`;

  const post = `설문 게시 후 안내드립니다 😊

고객님의 설문은 ${postingDate} 오전 10:00부터 다음날 ${postingNext}일 오전 9:59까지 게시되었습니다.

[정산 안내]
1인당 ${won(pricePost)}원, 총 ${count(completedCount)}명

입금금액: ${won(totalPayment)}원
${OPERATOR_DEPOSIT_ACCOUNT}

설문 게시 후 참여 내역 링크: ${afterPostLink}`;

  return [
    { key: 'approval', label: '게시 승인 안내', body: approval },
    { key: 'pre', label: '게시 전 안내', body: pre },
    { key: 'post', label: '게시 후 안내', body: post },
  ];
}
