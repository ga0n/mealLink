export type VoucherStatus = "donated" | "issued" | "redeemed";

export type Voucher = {
  id: string;
  donorWallet: string;
  status: VoucherStatus;
  createdAt: string;
  txHash: string;
  recipient?: string;
  restaurant?: string;
  qrSecret?: string;
  issuedAt?: string;
  redeemedAt?: string;
};

export type DemoState = {
  campaignDonated: number;
  campaignRedeemed: number;
  vouchers: Voucher[];
};

export const restaurants = ["온기밥상", "정담식당", "하루한상"];
export const donorWallet = "0x7A31...91F2";
export const agencyWallet = "0xA6E2...184C";
export const restaurantWallet = "0xB8D4...73A1";

export const initialState: DemoState = {
  campaignDonated: 64,
  campaignRedeemed: 51,
  vouchers: [],
};

export type DemoAction =
  | { type: "HYDRATE"; state: DemoState }
  | { type: "DONATE"; quantity: number; now?: string }
  | {
      type: "ISSUE";
      voucherId: string;
      recipient: string;
      restaurant: string;
      secret: string;
      now?: string;
    }
  | { type: "REDEEM"; secret: string; now?: string }
  | { type: "RESET" };

const fakeHash = (seed: string) =>
  `0x${Array.from(seed)
    .map((c) => c.charCodeAt(0).toString(16))
    .join("")
    .padEnd(64, "a")
    .slice(0, 64)}`;

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "HYDRATE") return action.state;
  if (action.type === "RESET") return initialState;
  if (action.type === "DONATE") {
    const now = action.now ?? new Date().toISOString();
    const created = Array.from({ length: action.quantity }, (_, index) => ({
      id: `ML-2026-${String(state.campaignDonated + index + 1).padStart(4, "0")}`,
      donorWallet,
      status: "donated" as const,
      createdAt: now,
      txHash: fakeHash(`${now}-${index}`),
    }));
    return {
      ...state,
      campaignDonated: state.campaignDonated + action.quantity,
      vouchers: [...created, ...state.vouchers],
    };
  }
  if (action.type === "ISSUE") {
    return {
      ...state,
      vouchers: state.vouchers.map((voucher) =>
        voucher.id === action.voucherId && voucher.status === "donated"
          ? {
              ...voucher,
              status: "issued",
              recipient: action.recipient,
              restaurant: action.restaurant,
              qrSecret: action.secret,
              issuedAt: action.now ?? new Date().toISOString(),
            }
          : voucher,
      ),
    };
  }
  const target = state.vouchers.find(
    (voucher) => voucher.qrSecret === action.secret,
  );
  if (!target || target.status !== "issued") return state;
  return {
    ...state,
    campaignRedeemed: state.campaignRedeemed + 1,
    vouchers: state.vouchers.map((voucher) =>
      voucher.id === target.id
        ? {
            ...voucher,
            status: "redeemed",
            redeemedAt: action.now ?? new Date().toISOString(),
          }
        : voucher,
    ),
  };
}

export const campaignStats = (state: DemoState) => ({
  donated: state.campaignDonated,
  redeemed: state.campaignRedeemed,
  waiting: state.campaignDonated - state.campaignRedeemed,
});

export const qrValue = (secret: string) => `MEALLINK:GANAK:${secret}`;
export const parseQrValue = (value: string) =>
  value.trim().replace(/^MEALLINK:GANAK:/, "");
