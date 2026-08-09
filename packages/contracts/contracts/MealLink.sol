// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title MealLink
/// @notice Native ETH-backed, single-use meal vouchers for local campaigns.
/// @dev No beneficiary personal data or QR plaintext is stored. QR secrets are
///      supplied only when redeeming and compared against their stored hash.
contract MealLink is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant CAMPAIGN_MANAGER_ROLE = keccak256("CAMPAIGN_MANAGER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 public constant DEFAULT_VOUCHER_PRICE = 0.001 ether;

    struct Campaign {
        uint256 id;
        address agency;
        uint256 voucherPrice;
        uint256 goalQuantity;
        uint256 donatedQuantity;
        uint256 issuedQuantity;
        uint256 redeemedQuantity;
        uint256 escrowBalance;
        bool active;
    }

    struct Donation {
        uint256 id;
        address donor;
        uint256 campaignId;
        uint256 quantity;
        uint256 amount;
        uint64 donatedAt;
    }

    struct Voucher {
        uint256 id;
        uint256 campaignId;
        address restaurant;
        bytes32 qrSecretHash;
        uint64 issuedAt;
        uint64 redeemedAt;
        bool redeemed;
    }

    uint256 private _nextCampaignId = 1;
    uint256 private _nextDonationId = 1;
    uint256 private _nextVoucherId = 1;

    mapping(uint256 campaignId => Campaign) private _campaigns;
    mapping(uint256 donationId => Donation) private _donations;
    mapping(uint256 voucherId => Voucher) private _vouchers;
    mapping(bytes32 qrSecretHash => bool used) private _registeredQrHashes;

    error CampaignNotFound(uint256 campaignId);
    error CampaignInactive(uint256 campaignId);
    error InvalidAgency();
    error InvalidRestaurant();
    error InvalidGoal();
    error InvalidVoucherPrice();
    error InvalidQuantity();
    error IncorrectPayment(uint256 expected, uint256 received);
    error CampaignGoalExceeded(uint256 remaining, uint256 requested);
    error UnauthorizedAgency(address caller, address expectedAgency);
    error IssueQuantityExceeded(uint256 available);
    error InvalidQrHash();
    error DuplicateQrHash(bytes32 qrSecretHash);
    error VoucherNotFound(uint256 voucherId);
    error UnauthorizedRestaurant(address caller, address expectedRestaurant);
    error VoucherAlreadyRedeemed(uint256 voucherId);
    error InvalidQrSecret();
    error InsufficientCampaignEscrow(uint256 available, uint256 required);
    error SettlementFailed(address restaurant, uint256 amount);

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed agency,
        uint256 voucherPrice,
        uint256 goalQuantity
    );
    event DonationMade(
        uint256 indexed donationId,
        uint256 indexed campaignId,
        address indexed donor,
        uint256 quantity,
        uint256 amount
    );
    event VoucherIssued(
        uint256 indexed voucherId,
        uint256 indexed campaignId,
        address indexed restaurant,
        bytes32 qrSecretHash
    );
    event VoucherRedeemed(
        uint256 indexed voucherId,
        uint256 indexed campaignId,
        address indexed restaurant,
        uint256 amount
    );

    constructor(address admin) {
        if (admin == address(0)) revert InvalidAgency();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CAMPAIGN_MANAGER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function createCampaign(
        address agency,
        uint256 goalQuantity,
        uint256 voucherPrice
    ) external onlyRole(CAMPAIGN_MANAGER_ROLE) whenNotPaused returns (uint256 campaignId) {
        if (agency == address(0)) revert InvalidAgency();
        if (goalQuantity == 0) revert InvalidGoal();
        if (voucherPrice != DEFAULT_VOUCHER_PRICE) revert InvalidVoucherPrice();

        campaignId = _nextCampaignId++;
        _campaigns[campaignId] = Campaign({
            id: campaignId,
            agency: agency,
            voucherPrice: voucherPrice,
            goalQuantity: goalQuantity,
            donatedQuantity: 0,
            issuedQuantity: 0,
            redeemedQuantity: 0,
            escrowBalance: 0,
            active: true
        });

        emit CampaignCreated(campaignId, agency, voucherPrice, goalQuantity);
    }

    function donate(uint256 campaignId, uint256 quantity)
        external
        payable
        whenNotPaused
        returns (uint256 donationId)
    {
        Campaign storage campaign = _requireActiveCampaign(campaignId);
        if (quantity == 0) revert InvalidQuantity();

        uint256 remaining = campaign.goalQuantity - campaign.donatedQuantity;
        if (quantity > remaining) revert CampaignGoalExceeded(remaining, quantity);

        uint256 expectedPayment = campaign.voucherPrice * quantity;
        if (msg.value != expectedPayment) revert IncorrectPayment(expectedPayment, msg.value);

        donationId = _nextDonationId++;
        _donations[donationId] = Donation({
            id: donationId,
            donor: msg.sender,
            campaignId: campaignId,
            quantity: quantity,
            amount: msg.value,
            donatedAt: uint64(block.timestamp)
        });
        campaign.donatedQuantity += quantity;
        campaign.escrowBalance += msg.value;

        emit DonationMade(donationId, campaignId, msg.sender, quantity, msg.value);
    }

    function issueVoucher(uint256 campaignId, address restaurant, bytes32 qrSecretHash)
        external
        whenNotPaused
        returns (uint256 voucherId)
    {
        Campaign storage campaign = _requireActiveCampaign(campaignId);
        if (msg.sender != campaign.agency) revert UnauthorizedAgency(msg.sender, campaign.agency);
        if (restaurant == address(0)) revert InvalidRestaurant();
        if (campaign.issuedQuantity >= campaign.donatedQuantity) revert IssueQuantityExceeded(0);
        if (qrSecretHash == bytes32(0)) revert InvalidQrHash();
        if (_registeredQrHashes[qrSecretHash]) revert DuplicateQrHash(qrSecretHash);

        voucherId = _nextVoucherId++;
        _registeredQrHashes[qrSecretHash] = true;
        _vouchers[voucherId] = Voucher({
            id: voucherId,
            campaignId: campaignId,
            restaurant: restaurant,
            qrSecretHash: qrSecretHash,
            issuedAt: uint64(block.timestamp),
            redeemedAt: 0,
            redeemed: false
        });
        campaign.issuedQuantity += 1;

        emit VoucherIssued(voucherId, campaignId, restaurant, qrSecretHash);
    }

    function redeemVoucher(uint256 voucherId, bytes calldata qrSecret)
        external
        nonReentrant
        whenNotPaused
    {
        Voucher storage voucher = _vouchers[voucherId];
        if (voucher.id == 0) revert VoucherNotFound(voucherId);
        if (msg.sender != voucher.restaurant) {
            revert UnauthorizedRestaurant(msg.sender, voucher.restaurant);
        }
        if (voucher.redeemed) revert VoucherAlreadyRedeemed(voucherId);
        if (keccak256(qrSecret) != voucher.qrSecretHash) revert InvalidQrSecret();

        Campaign storage campaign = _campaigns[voucher.campaignId];
        if (!campaign.active) revert CampaignInactive(voucher.campaignId);
        uint256 settlementAmount = campaign.voucherPrice;
        if (campaign.escrowBalance < settlementAmount) {
            revert InsufficientCampaignEscrow(campaign.escrowBalance, settlementAmount);
        }

        // Effects before interaction (Checks-Effects-Interactions).
        voucher.redeemed = true;
        voucher.redeemedAt = uint64(block.timestamp);
        campaign.redeemedQuantity += 1;
        campaign.escrowBalance -= settlementAmount;

        (bool success,) = payable(voucher.restaurant).call{value: settlementAmount}("");
        if (!success) revert SettlementFailed(voucher.restaurant, settlementAmount);

        emit VoucherRedeemed(voucherId, voucher.campaignId, voucher.restaurant, settlementAmount);
    }

    function setCampaignActive(uint256 campaignId, bool active)
        external
        onlyRole(CAMPAIGN_MANAGER_ROLE)
    {
        Campaign storage campaign = _campaigns[campaignId];
        if (campaign.id == 0) revert CampaignNotFound(campaignId);
        campaign.active = active;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        Campaign memory campaign = _campaigns[campaignId];
        if (campaign.id == 0) revert CampaignNotFound(campaignId);
        return campaign;
    }

    function getDonation(uint256 donationId) external view returns (Donation memory) {
        return _donations[donationId];
    }

    function getVoucher(uint256 voucherId) external view returns (Voucher memory) {
        Voucher memory voucher = _vouchers[voucherId];
        if (voucher.id == 0) revert VoucherNotFound(voucherId);
        return voucher;
    }

    function getCampaignStats(uint256 campaignId)
        external
        view
        returns (
            uint256 donated,
            uint256 redeemed,
            uint256 waiting,
            uint256 issued,
            uint256 availableToIssue
        )
    {
        Campaign memory campaign = _campaigns[campaignId];
        if (campaign.id == 0) revert CampaignNotFound(campaignId);
        donated = campaign.donatedQuantity;
        redeemed = campaign.redeemedQuantity;
        waiting = donated - redeemed;
        issued = campaign.issuedQuantity;
        availableToIssue = donated - issued;
    }

    function hashQrSecret(bytes calldata qrSecret) external pure returns (bytes32) {
        return keccak256(qrSecret);
    }

    function _requireActiveCampaign(uint256 campaignId)
        private
        view
        returns (Campaign storage campaign)
    {
        campaign = _campaigns[campaignId];
        if (campaign.id == 0) revert CampaignNotFound(campaignId);
        if (!campaign.active) revert CampaignInactive(campaignId);
    }
}
