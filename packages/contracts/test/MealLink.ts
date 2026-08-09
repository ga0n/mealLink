import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();
const PRICE = ethers.parseEther("0.001");
const GOAL = 100n;

async function deployFixture() {
  const [admin, agency, donor, restaurant, outsider] =
    await ethers.getSigners();
  const mealLink = await ethers.deployContract("MealLink", [admin.address]);
  await mealLink.waitForDeployment();
  await mealLink.createCampaign(agency.address, GOAL, PRICE);

  return { mealLink, admin, agency, donor, restaurant, outsider };
}

async function donatedFixture(quantity = 1n) {
  const fixture = await deployFixture();
  await fixture.mealLink.connect(fixture.donor).donate(1, quantity, {
    value: PRICE * quantity,
  });
  return fixture;
}

async function issuedFixture() {
  const fixture = await donatedFixture();
  const secret = ethers.toUtf8Bytes("meal-link-one-time-secret");
  const secretHash = ethers.keccak256(secret);
  await fixture.mealLink
    .connect(fixture.agency)
    .issueVoucher(1, fixture.restaurant.address, secretHash);
  return { ...fixture, secret, secretHash };
}

async function donatedOneFixture() {
  return donatedFixture();
}

async function donatedTwoFixture() {
  return donatedFixture(2n);
}

describe("MealLink", function () {
  describe("campaigns and donations", function () {
    it("creates a campaign with the manager role and emits CampaignCreated", async function () {
      const [admin, agency] = await ethers.getSigners();
      const mealLink = await ethers.deployContract("MealLink", [admin.address]);

      await expect(mealLink.createCampaign(agency.address, GOAL, PRICE))
        .to.emit(mealLink, "CampaignCreated")
        .withArgs(1, agency.address, PRICE, GOAL);

      const campaign = await mealLink.getCampaign(1);
      expect(campaign.agency).to.equal(agency.address);
      expect(campaign.voucherPrice).to.equal(PRICE);
      expect(campaign.active).to.equal(true);
    });

    it("rejects campaign creation by an account without the manager role", async function () {
      const { mealLink, agency, outsider } =
        await networkHelpers.loadFixture(deployFixture);
      const role = await mealLink.CAMPAIGN_MANAGER_ROLE();

      await expect(
        mealLink.connect(outsider).createCampaign(agency.address, GOAL, PRICE),
      )
        .to.be.revertedWithCustomError(
          mealLink,
          "AccessControlUnauthorizedAccount",
        )
        .withArgs(outsider.address, role);
    });

    it("enforces the 0.001 ETH voucher price", async function () {
      const [admin, agency] = await ethers.getSigners();
      const mealLink = await ethers.deployContract("MealLink", [admin.address]);

      await expect(
        mealLink.createCampaign(
          agency.address,
          GOAL,
          ethers.parseEther("0.002"),
        ),
      ).to.be.revertedWithCustomError(mealLink, "InvalidVoucherPrice");
    });

    it("accepts exact native ETH payment and records a donation", async function () {
      const { mealLink, donor } =
        await networkHelpers.loadFixture(deployFixture);

      await expect(mealLink.connect(donor).donate(1, 2, { value: PRICE * 2n }))
        .to.emit(mealLink, "DonationMade")
        .withArgs(1, 1, donor.address, 2, PRICE * 2n);

      const donation = await mealLink.getDonation(1);
      const campaign = await mealLink.getCampaign(1);
      expect(donation.donor).to.equal(donor.address);
      expect(donation.quantity).to.equal(2);
      expect(campaign.donatedQuantity).to.equal(2);
      expect(campaign.escrowBalance).to.equal(PRICE * 2n);
    });

    it("rejects zero quantity and incorrect payment", async function () {
      const { mealLink, donor } =
        await networkHelpers.loadFixture(deployFixture);

      await expect(
        mealLink.connect(donor).donate(1, 0, { value: 0 }),
      ).to.be.revertedWithCustomError(mealLink, "InvalidQuantity");
      await expect(mealLink.connect(donor).donate(1, 1, { value: PRICE - 1n }))
        .to.be.revertedWithCustomError(mealLink, "IncorrectPayment")
        .withArgs(PRICE, PRICE - 1n);
    });

    it("rejects donations above the campaign goal", async function () {
      const { mealLink, donor } =
        await networkHelpers.loadFixture(deployFixture);
      await expect(
        mealLink.connect(donor).donate(1, 101, { value: PRICE * 101n }),
      )
        .to.be.revertedWithCustomError(mealLink, "CampaignGoalExceeded")
        .withArgs(100, 101);
    });
  });

  describe("voucher issuance", function () {
    it("lets only the campaign agency issue a voucher and stores only its hash", async function () {
      const { mealLink, agency, restaurant, outsider } =
        await networkHelpers.loadFixture(donatedOneFixture);
      const secret = ethers.toUtf8Bytes("private-qr-value");
      const secretHash = ethers.keccak256(secret);

      await expect(
        mealLink
          .connect(outsider)
          .issueVoucher(1, restaurant.address, secretHash),
      )
        .to.be.revertedWithCustomError(mealLink, "UnauthorizedAgency")
        .withArgs(outsider.address, agency.address);

      await expect(
        mealLink
          .connect(agency)
          .issueVoucher(1, restaurant.address, secretHash),
      )
        .to.emit(mealLink, "VoucherIssued")
        .withArgs(1, 1, restaurant.address, secretHash);

      const voucher = await mealLink.getVoucher(1);
      expect(voucher.qrSecretHash).to.equal(secretHash);
      expect(voucher.restaurant).to.equal(restaurant.address);
      expect(voucher.redeemed).to.equal(false);
    });

    it("rejects issuance above donated quantity", async function () {
      const { mealLink, agency, restaurant } =
        await networkHelpers.loadFixture(donatedOneFixture);
      await mealLink
        .connect(agency)
        .issueVoucher(
          1,
          restaurant.address,
          ethers.keccak256(ethers.toUtf8Bytes("first")),
        );

      await expect(
        mealLink
          .connect(agency)
          .issueVoucher(
            1,
            restaurant.address,
            ethers.keccak256(ethers.toUtf8Bytes("second")),
          ),
      ).to.be.revertedWithCustomError(mealLink, "IssueQuantityExceeded");
    });

    it("rejects a duplicate QR hash", async function () {
      const { mealLink, agency, restaurant } =
        await networkHelpers.loadFixture(donatedTwoFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes("same-secret"));
      await mealLink.connect(agency).issueVoucher(1, restaurant.address, hash);
      await expect(
        mealLink.connect(agency).issueVoucher(1, restaurant.address, hash),
      )
        .to.be.revertedWithCustomError(mealLink, "DuplicateQrHash")
        .withArgs(hash);
    });
  });

  describe("voucher redemption and settlement", function () {
    it("rejects a non-designated restaurant and an invalid QR secret", async function () {
      const { mealLink, restaurant, outsider, secret } =
        await networkHelpers.loadFixture(issuedFixture);

      await expect(mealLink.connect(outsider).redeemVoucher(1, secret))
        .to.be.revertedWithCustomError(mealLink, "UnauthorizedRestaurant")
        .withArgs(outsider.address, restaurant.address);
      await expect(
        mealLink
          .connect(restaurant)
          .redeemVoucher(1, ethers.toUtf8Bytes("wrong-secret")),
      ).to.be.revertedWithCustomError(mealLink, "InvalidQrSecret");
    });

    it("pays the restaurant and changes campaign statistics", async function () {
      const { mealLink, restaurant, secret } =
        await networkHelpers.loadFixture(issuedFixture);
      const balanceBefore = await ethers.provider.getBalance(
        restaurant.address,
      );

      const transaction = await mealLink
        .connect(restaurant)
        .redeemVoucher(1, secret);
      const receipt = await transaction.wait();
      const balanceAfter = await ethers.provider.getBalance(restaurant.address);
      const transactionFee = receipt!.fee;

      expect(balanceAfter + transactionFee - balanceBefore).to.equal(PRICE);
      await expect(transaction)
        .to.emit(mealLink, "VoucherRedeemed")
        .withArgs(1, 1, restaurant.address, PRICE);

      const voucher = await mealLink.getVoucher(1);
      const campaign = await mealLink.getCampaign(1);
      const stats = await mealLink.getCampaignStats(1);
      expect(voucher.redeemed).to.equal(true);
      expect(voucher.redeemedAt).to.be.greaterThan(0);
      expect(campaign.escrowBalance).to.equal(0);
      expect(stats.donated).to.equal(1);
      expect(stats.redeemed).to.equal(1);
      expect(stats.waiting).to.equal(0);
      expect(stats.issued).to.equal(1);
      expect(stats.availableToIssue).to.equal(0);
    });

    it("rejects reuse of the same voucher and QR", async function () {
      const { mealLink, restaurant, secret } =
        await networkHelpers.loadFixture(issuedFixture);
      await mealLink.connect(restaurant).redeemVoucher(1, secret);

      await expect(mealLink.connect(restaurant).redeemVoucher(1, secret))
        .to.be.revertedWithCustomError(mealLink, "VoucherAlreadyRedeemed")
        .withArgs(1);
    });

    it("blocks a reentrant redemption during restaurant settlement", async function () {
      const { mealLink, agency, donor } =
        await networkHelpers.loadFixture(deployFixture);
      const attacker = await ethers.deployContract("ReentrantRestaurant");
      const secret = ethers.toUtf8Bytes("reentrant-secret");

      await mealLink.connect(donor).donate(1, 1, { value: PRICE });
      await mealLink
        .connect(agency)
        .issueVoucher(1, await attacker.getAddress(), ethers.keccak256(secret));
      await attacker.redeem(await mealLink.getAddress(), 1, secret);

      expect(await attacker.reentryAttempted()).to.equal(true);
      expect(await attacker.reentryBlocked()).to.equal(true);
      expect(
        await ethers.provider.getBalance(await attacker.getAddress()),
      ).to.equal(PRICE);
      expect((await mealLink.getCampaignStats(1)).redeemed).to.equal(1);
    });
  });

  describe("emergency pause", function () {
    it("rejects campaign creation, donation, issuance and redemption while paused", async function () {
      const { mealLink, admin, agency, donor, restaurant, secret } =
        await networkHelpers.loadFixture(issuedFixture);
      await mealLink.connect(admin).pause();

      await expect(
        mealLink.createCampaign(agency.address, GOAL, PRICE),
      ).to.be.revertedWithCustomError(mealLink, "EnforcedPause");
      await expect(
        mealLink.connect(donor).donate(1, 1, { value: PRICE }),
      ).to.be.revertedWithCustomError(mealLink, "EnforcedPause");
      await expect(
        mealLink
          .connect(agency)
          .issueVoucher(
            1,
            restaurant.address,
            ethers.keccak256(ethers.toUtf8Bytes("new")),
          ),
      ).to.be.revertedWithCustomError(mealLink, "EnforcedPause");
      await expect(
        mealLink.connect(restaurant).redeemVoucher(1, secret),
      ).to.be.revertedWithCustomError(mealLink, "EnforcedPause");
    });

    it("allows only the pauser role to pause and resumes after unpause", async function () {
      const { mealLink, admin, donor, outsider } =
        await networkHelpers.loadFixture(deployFixture);
      const pauserRole = await mealLink.PAUSER_ROLE();

      await expect(mealLink.connect(outsider).pause())
        .to.be.revertedWithCustomError(
          mealLink,
          "AccessControlUnauthorizedAccount",
        )
        .withArgs(outsider.address, pauserRole);
      await mealLink.connect(admin).pause();
      await mealLink.connect(admin).unpause();
      await (
        await mealLink.connect(donor).donate(1, 1, { value: PRICE })
      ).wait();
      expect((await mealLink.getCampaignStats(1)).donated).to.equal(1);
    });
  });
});
