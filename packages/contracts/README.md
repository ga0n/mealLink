# MealLink 스마트 컨트랙트

2단계 로컬 스마트 컨트랙트 패키지입니다. Hardhat 3, TypeScript, Solidity와 OpenZeppelin Contracts를 사용하며 실제 네트워크 설정은 포함하지 않습니다.

## 실행

저장소 루트에서 다음 명령을 실행합니다.

```bash
npm install
npm run contracts:compile
npm run contracts:typecheck
npm run contracts:test
```

로컬 Hardhat 네트워크에 배포하려면:

```bash
npm run contracts:node
# 다른 터미널에서
npm run contracts:deploy:local
```

## 보안 및 개인정보 원칙

- 후원은 커스텀 토큰 없이 native ETH만 사용합니다.
- 캠페인의 기본 식사권 가격은 `0.001 ETH`입니다.
- QR 원문과 수혜자 개인정보는 저장하지 않으며 QR 비밀값의 `keccak256` 해시만 저장합니다.
- 캠페인 관리자, 긴급 정지 관리자, 캠페인별 복지기관과 지정 식당 권한을 분리합니다.
- 정산은 Checks-Effects-Interactions와 `ReentrancyGuard`를 적용합니다.
- 이 단계는 로컬 Hardhat 전용입니다. Sepolia 배포나 프론트 연결을 하지 않습니다.
