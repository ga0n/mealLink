import { describe, expect, it } from "vitest";
import { LOCAL_ACCOUNTS, shortenAddress } from "./accounts";
import { getWeb3ErrorMessage } from "./errors";
import {
  createQrSecret,
  encodeLocalVoucher,
  hashQrSecret,
  parseLocalVoucher,
} from "./qr";

describe("web3 utilities", () => {
  it("creates an unpredictable 32-byte secret and hashes it", () => {
    const first = createQrSecret();
    const second = createQrSecret();
    expect(first).toMatch(/^0x[0-9a-f]{64}$/);
    expect(second).not.toBe(first);
    expect(hashQrSecret(first)).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("round-trips a local voucher QR payload", () => {
    const secret = createQrSecret();
    const payload = encodeLocalVoucher({ voucherId: "42", secret });
    expect(parseLocalVoucher(payload)).toEqual({ voucherId: 42n, secret });
    expect(parseLocalVoucher("MEALLINK:LOCAL:42:not-a-secret")).toBeUndefined();
  });

  it("maps common wallet and contract failures to Korean guidance", () => {
    expect(getWeb3ErrorMessage(new Error("User rejected request"))).toContain(
      "취소",
    );
    expect(
      getWeb3ErrorMessage(new Error("VoucherAlreadyRedeemed(1)")),
    ).toContain("이미 사용 완료");
    expect(getWeb3ErrorMessage(new Error("InvalidQrSecret"))).toContain(
      "올바르지 않은 QR",
    );
  });

  it("exposes documented Hardhat roles and shortens addresses", () => {
    expect(LOCAL_ACCOUNTS.welfareAgency).toBe(
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    );
    expect(shortenAddress(LOCAL_ACCOUNTS.donor)).toBe("0x90F7…b906");
  });
});
