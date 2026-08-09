import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MealLinkModule", (module) => {
  const admin = module.getAccount(0);
  const mealLink = module.contract("MealLink", [admin]);
  return { mealLink };
});
