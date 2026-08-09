# 한끼이음 (MealLink)

후원한 식사권이 지역의 한 끼로 이어지는 과정을 보여주는 서비스입니다. 현재 저장소에는 **1단계 데모 프론트엔드**와 **2단계 로컬 스마트 컨트랙트**가 포함되어 있습니다. 아직 프론트와 컨트랙트는 연결되지 않았으며 Sepolia를 사용하지 않습니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 상태를 처음부터 다시 시연하려면 화면 하단의 `데모 초기화`를 누릅니다.

## 검증

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 스마트 컨트랙트

`packages/contracts`는 Hardhat 3와 TypeScript로 구성된 로컬 전용 패키지입니다. native ETH 후원, 기관의 일회용 식사권 발급, QR 해시 검증, 지정 식당 정산과 캠페인 통계를 구현합니다. 수혜자 개인정보와 QR 원문은 컨트랙트 상태에 저장하지 않습니다.

컴파일과 전체 컨트랙트 테스트:

```bash
npm run contracts:compile
npm run contracts:typecheck
npm run contracts:test
```

로컬 Hardhat 노드와 Ignition 배포:

```bash
# 터미널 1
npm run contracts:node

# 터미널 2
npm run contracts:deploy:local
```

로컬 노드의 테스트 계정과 ETH는 개발 전용입니다. 공개 네트워크나 실제 자금에 사용하지 마세요. 상세 구조와 보안 원칙은 `packages/contracts/README.md`를 참고하세요.

## 2~3분 데모 순서

1. 메인에서 관악구 가상 캠페인과 64/51/13 통계를 소개합니다.
2. 캠페인에서 식사권 1장을 선택하고 `데모 후원 시작`을 눌러 가상 지갑 연결과 처리 상태를 확인합니다.
3. 내 식사권에서 새 식사권의 `전달 대기` 타임라인과 65/51/14 통계를 확인합니다.
4. 복지기관 화면에서 `USER-018`, 제휴 식당을 선택하고 QR을 발급합니다.
5. 식당 화면에서 `발급된 QR 불러오기` 후 유효성을 확인하고 `식사 제공 완료`를 누릅니다.
6. 같은 QR을 다시 검사해 중복 사용이 거부되는지 확인합니다.
7. 내 식사권의 `한 끼 전달 완료`와 투명성 화면의 최종 65/52/13 통계를 확인합니다.

## 중요 안내

- 모든 기관, 식당, 지갑, 거래 및 수치는 가상 데이터입니다.
- `8,000원 상당`은 식사권 표시 기준이며 `0.001 Sepolia ETH`와 환산 관계가 없습니다.
- 개인정보를 수집·저장하지 않고 `USER-018` 같은 익명 번호만 사용합니다.
- 스마트 컨트랙트는 로컬 Hardhat에서만 구현되었습니다. MetaMask, 프론트 연결과 Sepolia 배포는 아직 하지 않았으므로 실제 자금을 보내지 마세요.

자세한 내용은 `docs/SPEC.md`와 `docs/IMPLEMENTATION_PLAN.md`를 참고하세요.
