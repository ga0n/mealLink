# MealLink 구현 계획 및 진행 현황

## 1단계 — 반응형 데모 프론트엔드 (완료)

- Next.js App Router 기반 모바일 앱형 UI
- 브라우저 가상 데이터 기반 후원 → QR 발급 → 식사 제공 → 전달 완료
- 데모 상태 저장, QR 다운로드·직접 입력, 중복 사용 방지
- 반응형 화면과 기본 테스트·빌드 검증

## 2단계 — 스마트 컨트랙트 (완료)

- Hardhat 3 + TypeScript + Solidity 프로젝트
- native ETH 후원, 기관 발급, 지정 식당 사용 및 정산
- QR 해시 저장, exact payment, 역할 제어, Pausable, ReentrancyGuard, CEI
- 캠페인별 후원·발급·사용·대기 통계와 이벤트
- 정상·오류·권한·재진입을 포함한 컨트랙트 테스트 15개

## 3단계 — 로컬 블록체인 연동 (완료)

- Wagmi 3, Viem 2, TanStack Query, MetaMask 연결·해제
- Hardhat Local(31337) 네트워크 표시와 추가·전환 요청
- SSR 모드 Wagmi 구성 및 클라이언트 마운트 이후 지갑 UI 표시
- `NEXT_PUBLIC_DEMO_MODE` 기반 데모/로컬 모드 분리
- 환경변수 컨트랙트 주소와 RPC 구성, 로컬 노드·배포·시드 스크립트
- donor의 exact `0.001 ETH` 후원, 승인·제출·확정·오류 상태
- agency 권한 확인, 안전한 32바이트 QR secret 생성, 해시만 온체인 발급
- restaurant 지정 지갑 확인, QR 검증·사용·정산, 중복 사용 오류 안내
- 온체인 통계 재조회, 이벤트 타임라인, 해시·블록 번호 표시
- 데모 상태와 로컬 QR 저장소 키 분리
- 한국어 Web3 오류 매핑 및 유틸리티 테스트
- 로컬 전체 트랜잭션 시나리오 자동 검증

## 4단계 — Sepolia 및 출시 준비 (남음)

- Sepolia RPC와 배포 계정의 안전한 비밀값 관리
- Sepolia 컨트랙트 배포·검증과 운영 주소 설정
- 체인별 환경 구성 및 Sepolia 탐색기 링크
- 테스트 ETH 안내, 실제 네트워크 비용·확정 시간 UX
- 배포 환경 E2E, 접근성, 모니터링과 운영 보안 최종 점검

이번 3단계에서는 Sepolia 배포와 연결을 의도적으로 수행하지 않습니다.
