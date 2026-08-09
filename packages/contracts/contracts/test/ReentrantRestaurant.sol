// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IMealLinkRedeemer {
    function redeemVoucher(uint256 voucherId, bytes calldata qrSecret) external;
}

/// @dev Test-only receiver that attempts a nested redemption during settlement.
contract ReentrantRestaurant {
    IMealLinkRedeemer private _mealLink;
    uint256 private _voucherId;
    bytes private _secret;

    bool public reentryAttempted;
    bool public reentryBlocked;

    function redeem(address mealLink, uint256 voucherId, bytes calldata secret) external {
        _mealLink = IMealLinkRedeemer(mealLink);
        _voucherId = voucherId;
        _secret = secret;
        _mealLink.redeemVoucher(voucherId, secret);
    }

    receive() external payable {
        if (!reentryAttempted) {
            reentryAttempted = true;
            try _mealLink.redeemVoucher(_voucherId, _secret) {
                reentryBlocked = false;
            } catch {
                reentryBlocked = true;
            }
        }
    }
}
