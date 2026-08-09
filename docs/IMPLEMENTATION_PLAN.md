# MealLink 구현 계획 및 최종 진행 현황

## 1단계 — 반응형 데모 프론트엔드 (완료)

- 모바일 앱형 Next.js UI
- 가상 데이터 후원 → QR 발급 → 식사 제공 → 전달 완료
- 데모 상태 저장, QR 다운로드·직접 입력, 중복 사용 방지

## 2단계 — 스마트 컨트랙트 (완료)

- Hardhat 3, TypeScript, Solidity, OpenZeppelin
- native ETH 후원, 기관 발급, 지정 식당 사용 및 정산
- exact payment, 역할 제어, Pausable, ReentrancyGuard, Checks-Effects-Interactions
- QR 해시만 저장하고 개인정보와 QR 원문은 저장하지 않음
- 컨트랙트 테스트 15개

## 3단계 — Hardhat Local 연동 (완료)

- Wagmi, Viem, MetaMask, Hardhat Local chain ID 31337
- 후원·발급·사용 트랜잭션과 온체인 통계·이벤트 연결
- 로컬 배포·초기화·전체 시나리오 자동 검증
- Demo와 Local 상태 저장소 분리

## 4단계 — Sepolia 및 최종 발표 환경 (코드·문서 완료, 실제 배포 대기)

- Hardhat Sepolia chain ID 11155111와 서버 전용 비밀 환경변수
- 배포 전 chain ID·deployer 잔액 검사
- deployer, welfare agency, restaurant 테스트 ETH 사전 검사
- 비밀값 없는 로컬 배포 JSON과 중복 배포 방어
- 동일 캠페인 재실행 방어와 환경 공개 주소 일치 검사
- API 키가 있을 때만 실행하는 Etherscan 소스 검증
- Demo / Hardhat Local / Sepolia 3모드 프론트
- Sepolia 전환 요청, 테스트넷 안내, Etherscan 트랜잭션·주소 링크
- 거래 전 역할별 잔액·예상 가스 검사
- 승인·제출·확정·성공·실패 UX와 중복 클릭 방지
- 브라우저 새로고침 후 제출 트랜잭션 영수증 복구
- RPC 연결 실패와 일시적 지연의 한국어 오류 분리
- Sepolia 전용 QR 저장소와 Demo/Local 저장소 분리
- 2~3분 발표 시나리오와 Demo 장애 대응 절차

현재 실행 환경에는 `SEPOLIA_RPC_URL`, `SEPOLIA_DEPLOYER_PRIVATE_KEY`, `SEPOLIA_AGENCY_ADDRESS`, `SEPOLIA_RESTAURANT_ADDRESS`, `SEPOLIA_DONOR_ADDRESS`, `ETHERSCAN_API_KEY`가 없습니다. 따라서 실제 Sepolia 배포·캠페인 생성·전체 흐름·소스 검증은 수행하지 않으며 완료로 표시하지 않습니다.

## 실제 Sepolia 실행 후 남는 최종 확인

1. 전용 테스트 계정과 역할별 공개 주소 준비
2. 각 공개 주소에 필요한 Sepolia 테스트 ETH 준비
3. 배포와 캠페인 초기화
4. donor 후원, agency QR 발급, restaurant 사용 완료
5. 최종 통계 1 / 1 / 1 / 0과 중복 QR 거부
6. 배포·캠페인·후원·발급·사용 Etherscan 링크 기록
7. 선택적 Etherscan 소스 검증

Ethereum mainnet 배포는 계획과 코드 범위에 포함되지 않습니다.
