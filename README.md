# 한끼이음 (MealLink)

지역 식사권의 후원과 전달 과정을 연결하는 모바일 중심 웹 서비스입니다. 하나의 프론트엔드가 Demo, Hardhat Local, Ethereum Sepolia 테스트넷 세 가지 모드를 지원합니다. Ethereum mainnet은 설정하거나 사용하지 않습니다.

## 공통 설치와 검증

```bash
npm install
npm run contracts:compile
npm run contracts:typecheck
npm run contracts:test
npm run typecheck
npm run lint
npm test
npm run build
```

실제 `.env`와 `.env.local`은 Git에서 제외됩니다. 개인키, 시드 문구, 비공개 RPC URL, Etherscan API 키는 문서·코드·공개 이슈에 입력하지 마세요.

## 1. Demo 모드

`apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_DEMO_MODE=true
```

```bash
npm run dev
```

MetaMask, RPC, 테스트 ETH가 없어도 후원 → QR 발급 → 식사 제공 → 전달 완료 흐름이 동작합니다. 블록체인 시연 중 장애가 발생하면 위 값으로 바꾸고 개발 서버를 다시 시작하면 Demo 모드로 전환됩니다.

## 2. Hardhat Local 모드

터미널 1:

```bash
npm run contracts:node
```

터미널 2:

```bash
npm run contracts:deploy:local
npm run contracts:seed:local
```

`apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_CHAIN_ID=31337
NEXT_PUBLIC_LOCAL_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=배포_출력_주소
NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK=0
```

터미널 3:

```bash
npm run dev
```

MetaMask 네트워크:

- 이름: `Hardhat Local`
- RPC: `http://127.0.0.1:8545`
- Chain ID: `31337`
- 통화: `ETH`
- 탐색기: 없음

역할별 Hardhat 기본 계정:

| 번호 | 역할           | 공개 주소                                    |
| ---- | -------------- | -------------------------------------------- |
| #0   | deployer/admin | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` |
| #1   | welfare agency | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` |
| #2   | restaurant     | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` |
| #3   | donor          | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` |

Hardhat 터미널에 표시된 테스트 전용 개인키만 MetaMask에 가져옵니다. 이 공개된 계정에 실제 자산을 보내지 마세요.

로컬 전체 시나리오 자동 검증:

```bash
npm run contracts:e2e:local
```

## 3. Sepolia 테스트넷 모드

Sepolia는 테스트넷이며 실제 결제가 아닙니다. 배포에는 실제 자산을 보관하지 않는 전용 Sepolia 테스트 계정만 사용하세요.

### 3.1 서버 전용 환경변수

현재 터미널 또는 안전한 로컬 `.env` 관리 방식으로 다음 값을 준비합니다. 비밀값을 `NEXT_PUBLIC_`으로 만들면 안 됩니다.

```dotenv
SEPOLIA_RPC_URL=
SEPOLIA_DEPLOYER_PRIVATE_KEY=
SEPOLIA_AGENCY_ADDRESS=
SEPOLIA_RESTAURANT_ADDRESS=
SEPOLIA_DONOR_ADDRESS=
ETHERSCAN_API_KEY=
```

`SEPOLIA_DONOR_ADDRESS`도 공개 주소이며 후원 금액과 가스비 사전 검사에 사용합니다. `ETHERSCAN_API_KEY`는 선택 사항이며 소스 검증을 실행할 때만 필요합니다. 배포 스크립트는 chain ID가 `11155111`인지 확인하고, 기존 `packages/contracts/deployments/sepolia.json`에 유효한 배포가 있으면 중복 배포를 차단합니다.

### 3.2 테스트 ETH 준비

| 역할           | 필요한 이유                                      |
| -------------- | ------------------------------------------------ |
| deployer/admin | 컨트랙트 배포와 캠페인 생성 가스비               |
| welfare agency | `issueVoucher` 호출 가스비                       |
| restaurant     | `redeemVoucher` 호출 가스비                      |
| donor          | 식사권 1장 `0.001 Sepolia ETH`와 `donate` 가스비 |

배포와 초기화 스크립트는 공개 주소와 잔액만 출력하고 부족하면 거래 전에 중단합니다. 프론트도 각 거래 전 지갑 잔액과 예상 가스비를 검사합니다. 개인키나 시드 문구를 요청하거나 출력하지 않습니다.

### 3.3 배포·초기화·선택적 검증

```bash
npm run contracts:deploy:sepolia
npm run contracts:seed:sepolia

# ETHERSCAN_API_KEY가 준비된 경우에만
npm run contracts:verify:sepolia
```

배포 결과는 Git에서 제외된 `packages/contracts/deployments/sepolia.json`에 저장됩니다. 이 파일에는 체인 ID, 컨트랙트 주소, 배포 블록, 배포 트랜잭션 해시, 역할별 공개 주소, 캠페인 ID와 캠페인 트랜잭션 해시만 기록되며 비밀값은 저장되지 않습니다.

### 3.4 프론트 환경변수

배포 JSON의 공개값을 `apps/web/.env.local`에 복사합니다.

```dotenv
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=읽기용_Sepolia_RPC
NEXT_PUBLIC_CONTRACT_ADDRESS=배포된_컨트랙트_주소
NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK=배포_블록_번호
NEXT_PUBLIC_SEPOLIA_RESTAURANT_ADDRESS=지정_식당_공개_주소
```

```bash
npm run dev
```

MetaMask에서 Sepolia를 활성화하려면 네트워크 목록의 `테스트 네트워크 표시`를 켜고 `Sepolia`를 선택합니다. 화면의 `네트워크 전환` 버튼을 눌러도 전환을 요청할 수 있습니다. Chain ID는 `11155111`입니다.

Sepolia 모드에서는 지갑 주소, 후원·발급·사용 트랜잭션과 블록 번호에 Sepolia Etherscan 링크가 표시됩니다. Local 모드에서는 기존처럼 탐색기 링크를 표시하지 않습니다.

## 트랜잭션 확정 UX

- MetaMask 승인 대기, 전송, 블록 확정 대기, 성공, 실패를 구분합니다.
- 처리 중에는 버튼을 비활성화하고 페이지를 닫지 말라는 안내를 표시합니다.
- 최대 5분 동안 확정을 기다리며 지연을 즉시 실패로 판단하지 않습니다.
- 제출된 트랜잭션은 체인별 브라우저 저장소에 기록됩니다. 새로고침하면 영수증을 다시 확인하고 컨트랙트 통계를 재조회합니다.
- RPC 연결 실패와 일시적인 응답 지연은 서로 다른 한국어 안내로 표시됩니다.

## 2~3분 발표용 Sepolia 시연 순서

1. 상단 `SEPOLIA TESTNET`과 “실제 결제가 아닙니다” 안내를 보여줍니다.
2. donor 지갑으로 캠페인에서 1장을 후원하고 MetaMask의 정확한 `0.001 ETH` 전송을 확인합니다.
3. welfare agency 지갑으로 전환해 QR을 발급하고, QR 원문 대신 `keccak256` 해시만 체인에 기록됨을 설명합니다.
4. restaurant 지갑으로 전환해 QR을 검증하고 사용 완료합니다.
5. 투명성 화면에서 후원 1 / 발급 1 / 완료 1 / 대기 0과 세 Etherscan 링크를 확인합니다.
6. 같은 QR을 다시 입력해 컨트랙트의 중복 사용 거부를 보여줍니다.

네트워크나 faucet 상황이 불안정하면 `NEXT_PUBLIC_DEMO_MODE=true`로 전환해 동일한 발표 흐름을 이어갑니다. 발표 안정성은 Demo 모드가 가장 높고, 실제 온체인 증빙이 준비된 경우 Sepolia 모드를 권장합니다.

`8,000원 상당`은 서비스의 표시 기준가이며 `0.001 ETH`와 환산 관계가 없습니다.

상세 명세와 진행 현황은 `docs/SPEC.md`, `docs/IMPLEMENTATION_PLAN.md`를 참고하세요.
