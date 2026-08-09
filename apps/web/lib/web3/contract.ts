import { parseAbi } from "viem";

export const mealLinkAbi = parseAbi([
  "function donate(uint256 campaignId, uint256 quantity) payable returns (uint256 donationId)",
  "function issueVoucher(uint256 campaignId, address restaurant, bytes32 qrSecretHash) returns (uint256 voucherId)",
  "function redeemVoucher(uint256 voucherId, bytes qrSecret)",
  "function getCampaign(uint256 campaignId) view returns ((uint256 id, address agency, uint256 voucherPrice, uint256 goalQuantity, uint256 donatedQuantity, uint256 issuedQuantity, uint256 redeemedQuantity, uint256 escrowBalance, bool active))",
  "function getCampaignStats(uint256 campaignId) view returns (uint256 donated, uint256 redeemed, uint256 waiting, uint256 issued, uint256 availableToIssue)",
  "function getVoucher(uint256 voucherId) view returns ((uint256 id, uint256 campaignId, address restaurant, bytes32 qrSecretHash, uint64 issuedAt, uint64 redeemedAt, bool redeemed))",
  "event CampaignCreated(uint256 indexed campaignId, address indexed agency, uint256 voucherPrice, uint256 goalQuantity)",
  "event DonationMade(uint256 indexed donationId, uint256 indexed campaignId, address indexed donor, uint256 quantity, uint256 amount)",
  "event VoucherIssued(uint256 indexed voucherId, uint256 indexed campaignId, address indexed restaurant, bytes32 qrSecretHash)",
  "event VoucherRedeemed(uint256 indexed voucherId, uint256 indexed campaignId, address indexed restaurant, uint256 amount)",
  "error CampaignGoalExceeded(uint256 remaining, uint256 requested)",
  "error CampaignInactive(uint256 campaignId)",
  "error CampaignNotFound(uint256 campaignId)",
  "error DuplicateQrHash(bytes32 qrSecretHash)",
  "error EnforcedPause()",
  "error IncorrectPayment(uint256 expected, uint256 received)",
  "error InvalidQrSecret()",
  "error IssueQuantityExceeded(uint256 available)",
  "error UnauthorizedAgency(address caller, address expectedAgency)",
  "error UnauthorizedRestaurant(address caller, address expectedRestaurant)",
  "error VoucherAlreadyRedeemed(uint256 voucherId)",
  "error VoucherNotFound(uint256 voucherId)",
]);

export const CAMPAIGN_ID = 1n;
export const VOUCHER_PRICE_WEI = 1_000_000_000_000_000n;
