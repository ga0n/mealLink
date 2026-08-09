import { describe, expect, it } from "vitest";
import { campaignStats, demoReducer, initialState } from "./demo";

describe("demo journey", () => {
  it("moves 64/51/13 to 65/52/13", () => {
    const donated = demoReducer(initialState, { type: "DONATE", quantity: 1, now: "2026-08-09T00:00:00Z" });
    expect(campaignStats(donated)).toEqual({ donated: 65, redeemed: 51, waiting: 14 });
    const voucher = donated.vouchers[0];
    const issued = demoReducer(donated, { type: "ISSUE", voucherId: voucher.id, recipient: "USER-018", restaurant: "온기밥상 · 가상 식당", secret: "safe-demo-secret" });
    const redeemed = demoReducer(issued, { type: "REDEEM", secret: "safe-demo-secret" });
    expect(campaignStats(redeemed)).toEqual({ donated: 65, redeemed: 52, waiting: 13 });
  });

  it("rejects duplicate QR redemption", () => {
    const donated = demoReducer(initialState, { type: "DONATE", quantity: 1 });
    const issued = demoReducer(donated, { type: "ISSUE", voucherId: donated.vouchers[0].id, recipient: "USER-018", restaurant: "온기밥상 · 가상 식당", secret: "once" });
    const first = demoReducer(issued, { type: "REDEEM", secret: "once" });
    const second = demoReducer(first, { type: "REDEEM", secret: "once" });
    expect(first).toEqual(second);
  });
});
