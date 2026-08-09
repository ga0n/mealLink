# 한끼이음 (MealLink)

지역 식사권 후원과 전달 과정을 연결하는 모바일 중심 웹 서비스입니다. 현재 저장소에는 브라우저 가상 데이터로 동작하는 데모 모드와, MetaMask로 로컬 Hardhat 컨트랙트를 사용하는 로컬 블록체인 모드가 함께 있습니다. Sepolia에는 배포하지 않습니다.

## 빠른 시작: 데모 모드

```bash
npm install
copy .env.example apps\web\.env.local
npm run dev
```

`apps/web/.env.local`의 `NEXT_PUBLIC_DEMO_MODE=true`를 유지하고 `http://localhost:3000`을 엽니다. MetaMask나 Hardhat 노드가 없어도 후원 → QR 발급 → 식사 제공 흐름이 동작합니다.

## 로컬 블록체인 모드

각 명령은 별도 터미널에서 저장소 루트를 기준으로 실행합니다.

터미널 1 — Hardhat Local 노드:

```bash
npm run contracts:node
```

터미널 2 — 컨트랙트 배포와 캠페인 시드:

```bash
npm run contracts:deploy:local
npm run contracts:seed:local
```

배포 출력의 `MealLinkModule#MealLink` 주소를 `apps/web/.env.local`에 입력합니다.

```dotenv
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_LOCAL_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=0x배포_출력_주소
```

터미널 3 — 프론트엔드:

```bash
npm run dev
```

환경변수를 바꾸면 개발 서버를 반드시 다시 시작해야 합니다.

## MetaMask 등록

네트워크를 직접 추가하거나 화면의 `네트워크 전환`을 누릅니다.

- 네트워크 이름: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- 체인 ID: `31337`
- 통화 기호: `ETH`
- 블록 탐색기: 비워 둠

역할별 Hardhat 기본 계정은 다음과 같습니다.

| 계정 번호 | 역할             | 주소                                         |
| --------- | ---------------- | -------------------------------------------- |
| #0        | deployer / admin | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| #1        | welfare agency   | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| #2        | restaurant       | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| #3        | donor            | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |

MetaMask의 `계정 가져오기`에서 터미널 1에 표시된 해당 계정 번호의 개인키를 복사합니다. 저장소에는 개인키를 기록하지 않습니다.

> 경고: Hardhat 기본 계정과 개인키는 누구나 알고 있는 로컬 테스트 전용 정보입니다. 이 계정에 실제 자산을 보내지 말고, 실제 개인키·시드 문구를 코드·환경파일·문서에 절대 입력하거나 커밋하지 마세요.

역할별 화면 사용 순서:

1. #3 donor로 `/campaign`에서 1장을 후원합니다. 정확히 `0.001 ETH`가 전송됩니다.
2. #1 welfare agency로 `/agency`에서 QR을 발급합니다. 브라우저에서 만든 32바이트 secret의 `keccak256` 해시만 체인에 기록됩니다.
3. #2 restaurant로 `/restaurant`에서 발급 QR을 불러오거나 문자를 입력하고 사용 완료합니다.
4. `/transparency`에서 컨트랙트 통계, 이벤트, 트랜잭션 해시와 블록 번호를 확인합니다. 로컬 네트워크이므로 탐색기 링크는 만들지 않습니다.

`8,000원 상당`은 서비스의 표시 기준가이며 `0.001 ETH`와 환산 관계가 없습니다.

## 검증 명령

```bash
npm run contracts:compile
npm run contracts:typecheck
npm run contracts:test
npm run typecheck
npm run lint
npm test
npm run build
```

실행 중인 로컬 노드에서 독립된 전체 온체인 시나리오를 검증하려면:

```bash
npm run contracts:e2e:local
```

이 스크립트는 별도 MealLink 인스턴스를 배포한 뒤 캠페인 생성, 후원, QR 해시 발급, 사용 완료, 식당 잔액 증가, 통계 변경, 동일 QR 재사용 실패를 실제 트랜잭션으로 확인합니다.

## 보안 및 상태 분리

- `NEXT_PUBLIC_DEMO_MODE=true`에서는 Wagmi 읽기 요청을 비활성화하므로 MetaMask와 노드가 없어도 동작합니다.
- 데모 상태는 `meallink-demo-v1`, 로컬 QR secret은 `meallink-local-vouchers-v1`에 분리 저장됩니다.
- QR 원문, 수혜자의 이름·연락처·주소 등 개인정보는 체인에 저장하지 않습니다.
- 로컬 QR secret은 발급과 사용 데모에 필요한 범위에서 현재 브라우저에만 저장됩니다.
- `.env`, `.env.local`, Ignition 로컬 배포 상태는 Git에서 제외됩니다.

상세 명세와 단계별 현황은 `docs/SPEC.md`, `docs/IMPLEMENTATION_PLAN.md`를 참고하세요.
