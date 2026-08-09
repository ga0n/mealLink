import { network } from "hardhat";

const connection = await network.create("localhost");
const { ethers } = connection;
const [admin, agency, restaurant, donor] = await ethers.getSigners();
const price = ethers.parseEther("0.001");

try {
  console.log("[1/8] MealLink 컨트랙트 배포");
  const mealLink = await ethers.deployContract("MealLink", [admin.address]);
  await mealLink.waitForDeployment();
  console.log(`검증 컨트랙트: ${await mealLink.getAddress()}`);

  console.log("[2/8] 캠페인 초기화");
  await (await mealLink.createCampaign(agency.address, 100n, price)).wait();
  console.log("[3/8] donor 계정으로 0.001 ETH 후원");
  await (await mealLink.connect(donor).donate(1n, 1n, { value: price })).wait();

  const secret = ethers.randomBytes(32);
  console.log("[4/8] welfare agency 계정으로 QR 해시 발급");
  await (
    await mealLink
      .connect(agency)
      .issueVoucher(1n, restaurant.address, ethers.keccak256(secret))
  ).wait();

  console.log("[5/8] restaurant 계정으로 사용 완료");
  const balanceBefore = await ethers.provider.getBalance(restaurant.address);
  await (await mealLink.connect(restaurant).redeemVoucher(1n, secret)).wait();
  const balanceAfter = await ethers.provider.getBalance(restaurant.address);

  console.log("[6/8] restaurant 잔액 증가 확인");
  if (balanceAfter <= balanceBefore)
    throw new Error(
      `식당 잔액이 증가하지 않았습니다: ${balanceBefore} -> ${balanceAfter}`,
    );

  console.log("[7/8] 캠페인 통계 변경 확인");
  const stats = await mealLink.getCampaignStats(1n);
  if (stats.donated !== 1n || stats.redeemed !== 1n || stats.waiting !== 0n)
    throw new Error(`예상하지 못한 통계: ${stats}`);

  console.log("[8/8] 동일 QR 재사용 실패 확인");
  let duplicateRejected = false;
  try {
    await mealLink.connect(restaurant).redeemVoucher(1n, secret);
  } catch {
    duplicateRejected = true;
  }
  if (!duplicateRejected)
    throw new Error("동일 QR 재사용이 거부되지 않았습니다.");

  console.log(
    JSON.stringify(
      {
        verified: true,
        restaurantBalanceIncreaseWei: (balanceAfter - balanceBefore).toString(),
        stats: {
          donated: stats.donated.toString(),
          redeemed: stats.redeemed.toString(),
          waiting: stats.waiting.toString(),
          issued: stats.issued.toString(),
          availableToIssue: stats.availableToIssue.toString(),
        },
        duplicateQrRejected: duplicateRejected,
      },
      null,
      2,
    ),
  );
} finally {
  await connection.close();
}
