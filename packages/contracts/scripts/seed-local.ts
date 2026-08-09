import { readFile } from "node:fs/promises";
import { network } from "hardhat";

const connection = await network.create("localhost");
const { ethers } = connection;

try {
  const [admin, agency, restaurant, donor] = await ethers.getSigners();
  const deployed = JSON.parse(
    await readFile(
      new URL("../.local-deployment.json", import.meta.url),
      "utf8",
    ),
  ) as { address?: string };
  if (!deployed.address)
    throw new Error(
      "로컬 배포 주소가 없습니다. 먼저 deploy:local을 실행하세요.",
    );

  const mealLink = await ethers.getContractAt(
    "MealLink",
    deployed.address,
    admin,
  );
  try {
    await mealLink.getCampaign(1);
    console.log("캠페인 #1이 이미 준비되어 있습니다.");
  } catch {
    const transaction = await mealLink.createCampaign(
      agency.address,
      100n,
      ethers.parseEther("0.001"),
    );
    await transaction.wait();
    console.log("캠페인 #1을 생성했습니다.");
  }

  console.log(
    JSON.stringify(
      {
        contract: deployed.address,
        roles: {
          "#0 deployer/admin": admin.address,
          "#1 welfare agency": agency.address,
          "#2 restaurant": restaurant.address,
          "#3 donor": donor.address,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await connection.close();
}
