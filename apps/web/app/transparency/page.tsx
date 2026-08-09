"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, HeartHandshake, Store } from "lucide-react";
import { usePublicClient } from "wagmi";
import { useDemo } from "@/components/demo-provider";
import { WalletPanel } from "@/components/wallet-panel";
import { campaignStats } from "@/lib/demo";
import { DemoTag, Eyebrow, Notice, StatCard } from "@/components/ui";
import {
  CONTRACT_ADDRESS,
  CONTRACT_DEPLOYMENT_BLOCK,
  IS_DEMO_MODE,
} from "@/lib/web3/mode";
import {
  ACTIVE_CHAIN_ID,
  ACTIVE_NETWORK_NAME,
  IS_SEPOLIA,
} from "@/lib/web3/config";
import { CAMPAIGN_ID, mealLinkAbi } from "@/lib/web3/contract";
import { useOnchainCampaign } from "@/hooks/use-onchain-campaign";
import { getWeb3ErrorMessage } from "@/lib/web3/errors";
import {
  addressExplorerUrl,
  transactionExplorerUrl,
} from "@/lib/web3/links";

type ChainEvent = {
  type: string;
  label: string;
  transactionHash?: string;
  blockNumber?: bigint;
};

export default function TransparencyPage() {
  const { state } = useDemo();
  const demoStats = campaignStats(state);
  const onchain = useOnchainCampaign();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN_ID });
  const [chainEvents, setChainEvents] = useState<ChainEvent[]>([]);
  const [eventError, setEventError] = useState("");
  const settlements = state.vouchers.filter(
    (voucher) => voucher.status === "redeemed",
  );
  const demoEvents = state.vouchers
    .flatMap((voucher) => [
      {
        type: "DonationMade",
        label: `${voucher.id} 후원 완료`,
        date: voucher.createdAt,
      },
      ...(voucher.issuedAt
        ? [
            {
              type: "VoucherIssued",
              label: `${voucher.id} QR 발급`,
              date: voucher.issuedAt,
            },
          ]
        : []),
      ...(voucher.redeemedAt
        ? [
            {
              type: "VoucherRedeemed",
              label: `${voucher.id} 식사·정산 완료`,
              date: voucher.redeemedAt,
            },
          ]
        : []),
    ])
    .sort((a, b) => b.date.localeCompare(a.date));

  useEffect(() => {
    if (IS_DEMO_MODE || !CONTRACT_ADDRESS || !publicClient) return;
    let active = true;
    const load = async () => {
      try {
        const [donations, issues, redemptions] = await Promise.all([
          publicClient.getContractEvents({
            address: CONTRACT_ADDRESS,
            abi: mealLinkAbi,
            eventName: "DonationMade",
            args: { campaignId: CAMPAIGN_ID },
            fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
          }),
          publicClient.getContractEvents({
            address: CONTRACT_ADDRESS,
            abi: mealLinkAbi,
            eventName: "VoucherIssued",
            args: { campaignId: CAMPAIGN_ID },
            fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
          }),
          publicClient.getContractEvents({
            address: CONTRACT_ADDRESS,
            abi: mealLinkAbi,
            eventName: "VoucherRedeemed",
            args: { campaignId: CAMPAIGN_ID },
            fromBlock: CONTRACT_DEPLOYMENT_BLOCK,
          }),
        ]);
        const items: ChainEvent[] = [
          ...donations.map((event) => ({
            type: "DonationMade",
            label: `${event.args.quantity?.toString() ?? "-"}장 후원`,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          })),
          ...issues.map((event) => ({
            type: "VoucherIssued",
            label: `식사권 #${event.args.voucherId?.toString() ?? "-"} 발급`,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          })),
          ...redemptions.map((event) => ({
            type: "VoucherRedeemed",
            label: `식사권 #${event.args.voucherId?.toString() ?? "-"} 사용 완료`,
            transactionHash: event.transactionHash,
            blockNumber: event.blockNumber,
          })),
        ].sort((a, b) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)));
        if (active) setChainEvents(items);
      } catch (reason) {
        if (active) setEventError(getWeb3ErrorMessage(reason));
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [
    publicClient,
    onchain.stats?.donated,
    onchain.stats?.issued,
    onchain.stats?.redeemed,
  ]);

  const stats = IS_DEMO_MODE
    ? demoStats
    : (onchain.stats ?? {
        donated: 0,
        redeemed: 0,
        waiting: 0,
        issued: 0,
        availableToIssue: 0,
      });
  return (
    <section className="section page-section">
      <div className="shell">
        <div className="page-heading">
          <div>
            <Eyebrow>
              {IS_DEMO_MODE
                ? "데모 데이터"
                : `${ACTIVE_NETWORK_NAME} 온체인 데이터`}
            </Eyebrow>
            <h1>전달 현황</h1>
            <p>후원된 식사권이 어디까지 이어졌는지 확인하세요.</p>
          </div>
          <DemoTag>
            {IS_DEMO_MODE
              ? "DEMO"
              : IS_SEPOLIA
                ? "SEPOLIA TESTNET"
                : "LOCAL BLOCKCHAIN"}
          </DemoTag>
        </div>
        <WalletPanel />
        {eventError && <Notice tone="warm">{eventError}</Notice>}
        <div className="stats-grid four transparency-stats">
          <StatCard
            label="전체 후원"
            value={IS_DEMO_MODE ? 284 + (stats.donated - 64) : stats.donated}
          />
          <StatCard
            label="전달 완료"
            value={IS_DEMO_MODE ? 231 + (stats.redeemed - 51) : stats.redeemed}
            accent
          />
          <StatCard
            label="전달 대기"
            value={IS_DEMO_MODE ? 53 + (stats.waiting - 13) : stats.waiting}
          />
          <StatCard
            label="QR 발급"
            value={
              IS_DEMO_MODE
                ? state.vouchers.filter(
                    (voucher) => voucher.status === "issued",
                  ).length
                : (onchain.stats?.issued ?? 0)
            }
          />
        </div>
        <div className="transparency-grid">
          <div className="panel">
            <div className="panel-title">
              <div>
                <Store />
                <h2>정산 현황</h2>
              </div>
              <span>0.001 ETH / 건</span>
            </div>
            <div className="restaurant-rows">
              <div>
                <span className="restaurant-dot r0">
                  <Store />
                </span>
                <div>
                  <strong>온기식당 광운점</strong>
                  <small>
                    {IS_DEMO_MODE ? "제휴 식당" : "Hardhat 계정 #2"}
                  </small>
                </div>
                <span className="grow" />
                <div className="right">
                  <strong>
                    {IS_DEMO_MODE ? settlements.length : stats.redeemed}건
                  </strong>
                  <small>정산 완료</small>
                </div>
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">
              <div>
                <HeartHandshake />
                <h2>최근 활동</h2>
              </div>
              <DemoTag />
            </div>
            {IS_DEMO_MODE ? (
              demoEvents.length ? (
                <div className="event-list">
                  {demoEvents.slice(0, 8).map((event, index) => (
                    <div key={`${event.type}-${index}`}>
                      <span>
                        {event.type === "VoucherRedeemed" ? (
                          <Check />
                        ) : (
                          <Clock3 />
                        )}
                      </span>
                      <div>
                        <strong>{event.label}</strong>
                        <small>
                          {event.type} ·{" "}
                          {new Date(event.date).toLocaleString("ko-KR")}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mini-empty">
                  <Clock3 /> 새로운 활동은 후원 후 표시됩니다.
                </div>
              )
            ) : chainEvents.length ? (
              <div className="event-list">
                {chainEvents.slice(0, 12).map((event, index) => (
                  <div key={`${event.transactionHash}-${index}`}>
                    <span>
                      {event.type === "VoucherRedeemed" ? (
                        <Check />
                      ) : (
                        <Clock3 />
                      )}
                    </span>
                    <div>
                      <strong>{event.label}</strong>
                      <small>
                        {event.type} · 블록 #{event.blockNumber?.toString()}
                        <br />
                        {transactionExplorerUrl(event.transactionHash) ? (
                          <a
                            className="hash-text"
                            href={transactionExplorerUrl(event.transactionHash)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Etherscan에서 트랜잭션 확인
                          </a>
                        ) : (
                          <span className="hash-text">
                            {event.transactionHash}
                          </span>
                        )}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mini-empty">
                <Clock3 /> 아직 기록된 온체인 이벤트가 없습니다.
              </div>
            )}
          </div>
        </div>
        <div className="privacy-strip">
          <div>
            <Check />
            <span>
              <strong>개인정보 없이 투명하게</strong> QR 원문은 체인에 저장하지
              않고 해시만 기록합니다.
            </span>
          </div>
          {addressExplorerUrl(CONTRACT_ADDRESS) ? (
            <a
              className="fake-address"
              href={addressExplorerUrl(CONTRACT_ADDRESS)}
              target="_blank"
              rel="noreferrer"
            >
              컨트랙트 · ETHERSCAN
            </a>
          ) : (
            <span className="fake-address">
              {IS_DEMO_MODE ? "DEMO DATA" : "NO EXPLORER · LOCAL"}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
