import { ACTIVE_NETWORK_NAME, IS_SEPOLIA } from "./config";

export function getWeb3ErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();

  if (
    lower.includes("user rejected") ||
    lower.includes("user denied") ||
    lower.includes("4001")
  )
    return "MetaMask 요청이 취소되었습니다. 다시 시도해 주세요.";
  if (lower.includes("insufficient funds"))
    return "지갑의 테스트 ETH 잔액이 부족합니다.";
  if (
    lower.includes("chain") &&
    (lower.includes("mismatch") || lower.includes("not configured"))
  )
    return `${ACTIVE_NETWORK_NAME} 네트워크로 전환한 뒤 다시 시도해 주세요.`;
  if (
    lower.includes("failed to fetch") ||
    lower.includes("connection refused") ||
    lower.includes("http request failed")
  )
    return IS_SEPOLIA
      ? "Sepolia RPC에 연결할 수 없습니다. RPC 설정을 확인하거나 잠시 후 다시 시도해 주세요."
      : "로컬 Hardhat 노드에 연결할 수 없습니다. 노드가 실행 중인지 확인해 주세요.";
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("polling")
  )
    return "네트워크 응답이 지연되고 있습니다. 트랜잭션이 실패한 것은 아닐 수 있으니 잠시 후 다시 확인해 주세요.";
  if (lower.includes("transaction reverted"))
    return "트랜잭션이 블록에서 실패했습니다. Etherscan 또는 지갑 내역을 확인해 주세요.";
  if (lower.includes("invalidqrsecret") || lower.includes("invalid qr"))
    return "올바르지 않은 QR입니다. 식사권 정보를 다시 확인해 주세요.";
  if (
    lower.includes("voucheralreadyredeemed") ||
    lower.includes("already redeemed")
  )
    return "이미 사용 완료된 식사권입니다. 동일 QR은 다시 사용할 수 없습니다.";
  if (
    lower.includes("restaurantonly") ||
    lower.includes("notvoucherrestaurant") ||
    lower.includes("unauthorizedrestaurant")
  )
    return "이 식사권에 지정된 식당 지갑만 사용 처리할 수 있습니다.";
  if (lower.includes("agencyonly") || lower.includes("unauthorizedagency"))
    return "이 캠페인의 복지기관 지갑만 식사권을 발급할 수 있습니다.";
  if (
    lower.includes("issuancelimitexceeded") ||
    lower.includes("issuequantityexceeded")
  )
    return "후원된 수량보다 더 많은 식사권을 발급할 수 없습니다.";
  if (
    lower.includes("exactpaymentrequired") ||
    lower.includes("incorrectpayment")
  )
    return "식사권 1장당 정확히 0.001 ETH를 전송해야 합니다.";
  if (lower.includes("paused"))
    return "현재 컨트랙트가 일시 중지되어 있습니다.";
  if (lower.includes("contract address"))
    return "컨트랙트 주소가 설정되지 않았습니다. 환경변수를 확인해 주세요.";
  if (lower.includes("next_public_sepolia_restaurant_address"))
    return "Sepolia 지정 식당 공개 주소가 설정되지 않았습니다.";

  return "블록체인 요청을 처리하지 못했습니다. 지갑과 로컬 노드 상태를 확인해 주세요.";
}
