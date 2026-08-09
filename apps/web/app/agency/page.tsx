"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import {
  Check,
  Download,
  LoaderCircle,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import { parseEventLogs, type Hex } from "viem";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";
import { useDemo } from "@/components/demo-provider";
import { WalletPanel } from "@/components/wallet-panel";
import { qrValue, restaurants } from "@/lib/demo";
import { DemoTag, Eyebrow, Notice, StatCard } from "@/components/ui";
import { useOnchainCampaign } from "@/hooks/use-onchain-campaign";
import { CAMPAIGN_ID, mealLinkAbi } from "@/lib/web3/contract";
import { HARDHAT_CHAIN_ID } from "@/lib/web3/config";
import { LOCAL_RESTAURANTS } from "@/lib/web3/accounts";
import { CONTRACT_ADDRESS, IS_DEMO_MODE } from "@/lib/web3/mode";
import { getWeb3ErrorMessage } from "@/lib/web3/errors";
import {
  createQrSecret,
  encodeLocalVoucher,
  hashQrSecret,
  saveLocalVoucher,
} from "@/lib/web3/qr";

export default function AgencyPage() {
  const { state, dispatch } = useDemo();
  const onchain = useOnchainCampaign();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: HARDHAT_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const availableDemo = state.vouchers.filter(
    (voucher) => voucher.status === "donated",
  );
  const [voucherId, setVoucherId] = useState("");
  const [restaurant, setRestaurant] = useState(restaurants[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [qr, setQr] = useState("");
  const [qrText, setQrText] = useState("");
  const [issuedId, setIssuedId] = useState("");
  const [transactionHash, setTransactionHash] = useState<Hex>();

  useEffect(() => {
    if (IS_DEMO_MODE && !voucherId && availableDemo[0])
      setVoucherId(availableDemo[0].id);
  }, [availableDemo, voucherId]);

  const latestIssued = useMemo(
    () => state.vouchers.find((voucher) => voucher.status === "issued"),
    [state.vouchers],
  );
  const agencyAddress = onchain.campaign?.agency;
  const isAgency = Boolean(
    connection.address &&
    agencyAddress &&
    connection.address.toLowerCase() === agencyAddress.toLowerCase(),
  );
  const canIssue = IS_DEMO_MODE
    ? Boolean(voucherId)
    : Boolean(
        CONTRACT_ADDRESS &&
        isAgency &&
        connection.chainId === HARDHAT_CHAIN_ID &&
        (onchain.stats?.availableToIssue ?? 0) > 0,
      );

  const issue = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    try {
      if (IS_DEMO_MODE) {
        if (!voucherId) return;
        await new Promise((resolve) => setTimeout(resolve, 700));
        const secret = `ML-${crypto.randomUUID()}`;
        dispatch({
          type: "ISSUE",
          voucherId,
          recipient: "USER-018",
          restaurant,
          secret,
        });
        const text = qrValue(secret);
        setQrText(text);
        setIssuedId(voucherId);
        setQr(
          await QRCode.toDataURL(text, {
            width: 300,
            margin: 2,
            color: { dark: "#173f36", light: "#ffffff" },
          }),
        );
        return;
      }
      if (!CONTRACT_ADDRESS) throw new Error("contract address missing");
      if (!isAgency) throw new Error("UnauthorizedAgency");
      if (!publicClient) throw new Error("RPC connection failed");

      const secret = createQrSecret();
      const targetRestaurant = LOCAL_RESTAURANTS[0];
      setStatus("MetaMask 승인을 기다리고 있습니다.");
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: mealLinkAbi,
        functionName: "issueVoucher",
        args: [CAMPAIGN_ID, targetRestaurant.address, hashQrSecret(secret)],
        chainId: HARDHAT_CHAIN_ID,
      });
      setTransactionHash(hash);
      setStatus("트랜잭션이 제출되었습니다. 블록 확정을 기다립니다.");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = parseEventLogs({
        abi: mealLinkAbi,
        logs: receipt.logs,
        eventName: "VoucherIssued",
        strict: false,
      });
      const event = logs.find((log) => log.eventName === "VoucherIssued");
      const newVoucherId = event?.args.voucherId;
      if (newVoucherId === undefined)
        throw new Error("VoucherIssued event missing");
      const text = encodeLocalVoucher({
        voucherId: newVoucherId.toString(),
        secret,
      });
      saveLocalVoucher({
        voucherId: newVoucherId.toString(),
        campaignId: CAMPAIGN_ID.toString(),
        secret,
        restaurant: targetRestaurant.address,
        recipientReference: "USER-018",
        issuedAt: new Date().toISOString(),
        transactionHash: hash,
      });
      setIssuedId(newVoucherId.toString());
      setQrText(text);
      setQr(
        await QRCode.toDataURL(text, {
          width: 300,
          margin: 2,
          color: { dark: "#173f36", light: "#ffffff" },
        }),
      );
      setStatus(
        `블록 #${receipt.blockNumber.toString()}에서 발급이 확정되었습니다.`,
      );
      await onchain.refetch();
    } catch (reason) {
      setError(getWeb3ErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  };

  const available = IS_DEMO_MODE
    ? availableDemo.length
    : (onchain.stats?.availableToIssue ?? 0);
  const issued = IS_DEMO_MODE
    ? state.vouchers.filter((voucher) => voucher.status === "issued").length
    : (onchain.stats?.issued ?? 0);
  const redeemed = IS_DEMO_MODE
    ? state.vouchers.filter((voucher) => voucher.status === "redeemed").length
    : (onchain.stats?.redeemed ?? 0);

  return (
    <section className="section page-section">
      <div className="shell">
        <div className="page-heading">
          <div>
            <Eyebrow>복지기관 업무 화면</Eyebrow>
            <h1>안전하게 한 끼를 전달해요</h1>
            <p>개인정보 없이 익명 대상자에게 일회용 식사권을 발급합니다.</p>
          </div>
          <DemoTag>{IS_DEMO_MODE ? "DEMO" : "ONCHAIN"}</DemoTag>
        </div>
        <WalletPanel />
        {!IS_DEMO_MODE &&
          connection.isConnected &&
          agencyAddress &&
          !isAgency && (
            <Notice tone="warm">
              현재 지갑은 이 캠페인의 복지기관 지갑이 아닙니다. 발급 버튼을
              사용할 수 없습니다.
            </Notice>
          )}
        <div className="stats-grid three slim">
          <StatCard label="발급 가능" value={available} />
          <StatCard label="QR 발급" value={issued} />
          <StatCard label="사용 완료" value={redeemed} accent />
        </div>
        <div className="workspace-grid">
          <div className="form-card">
            <div className="card-title">
              <span>1</span>
              <div>
                <h2>익명 대상자 확인</h2>
                <p>개인정보 대신 업무용 익명 번호만 사용합니다.</p>
              </div>
            </div>
            <label>
              익명 대상자 번호
              <input value="USER-018" readOnly />
            </label>
            <div className="verified-row">
              <ShieldCheck />
              <div>
                <strong>지원 기준 확인 완료</strong>
                <small>상세 개인정보는 입력하거나 저장하지 않습니다.</small>
              </div>
              <Check />
            </div>
            <div className="card-title next">
              <span>2</span>
              <div>
                <h2>식사권과 식당 선택</h2>
                <p>후원된 수량 범위에서만 발급할 수 있습니다.</p>
              </div>
            </div>
            {IS_DEMO_MODE && (
              <label>
                발급할 식사권
                <select
                  value={voucherId}
                  onChange={(event) => setVoucherId(event.target.value)}
                >
                  <option value="">
                    {availableDemo.length
                      ? "식사권 선택"
                      : "발급 가능한 식사권 없음"}
                  </option>
                  {availableDemo.map((voucher) => (
                    <option key={voucher.id}>{voucher.id}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              지정 제휴 식당
              <select
                value={restaurant}
                onChange={(event) => setRestaurant(event.target.value)}
                disabled={!IS_DEMO_MODE}
              >
                {IS_DEMO_MODE
                  ? restaurants.map((name) => (
                      <option key={name}>{name}</option>
                    ))
                  : LOCAL_RESTAURANTS.map((item) => (
                      <option key={item.address}>
                        {item.name} · {item.address}
                      </option>
                    ))}
              </select>
            </label>
            {!IS_DEMO_MODE && !isAgency && (
              <p className="form-error">
                복지기관 권한 지갑을 연결해야 발급할 수 있습니다.
              </p>
            )}
            {status && (
              <p className="transaction-state">
                {status}
                {transactionHash && (
                  <>
                    <br />
                    <span className="hash-text">{transactionHash}</span>
                  </>
                )}
              </p>
            )}
            {error && <p className="form-error">{error}</p>}
            <button
              className="button wide"
              disabled={!canIssue || loading}
              onClick={issue}
            >
              {loading ? (
                <>
                  <LoaderCircle className="spin" /> 처리 중
                </>
              ) : (
                <>
                  <QrCode /> 일회용 QR 발급
                </>
              )}
            </button>
          </div>
          <div className="qr-card">
            <DemoTag>일회용 QR</DemoTag>
            {qr ? (
              <>
                <h2>식사권이 준비됐어요</h2>
                <p>지정된 식당에서 한 번만 사용할 수 있습니다.</p>
                <Image
                  src={qr}
                  alt="발급된 식사권 QR 코드"
                  width={220}
                  height={220}
                  unoptimized
                />
                <strong>식사권 #{issuedId}</strong>
                <span>USER-018 · QR 원문은 체인에 저장되지 않습니다.</span>
                <a
                  className="button secondary wide"
                  href={qr}
                  download={`mealLink-${issuedId}.png`}
                >
                  <Download /> QR 이미지 저장
                </a>
                <details className="qr-text-details">
                  <summary>QR 문자 직접 보기</summary>
                  <code>{qrText}</code>
                </details>
              </>
            ) : latestIssued && IS_DEMO_MODE ? (
              <>
                <QrCode size={58} />
                <h2>발급된 QR이 있어요</h2>
                <p>
                  {latestIssued.id}의 QR을 식당 화면에서 불러올 수 있습니다.
                </p>
              </>
            ) : (
              <>
                <div className="qr-placeholder">
                  <QrCode />
                </div>
                <h2>아직 발급된 QR이 없어요</h2>
                <p>왼쪽에서 식당을 확인하고 발급해 주세요.</p>
              </>
            )}
          </div>
        </div>
        <Notice>
          이용자의 이름, 연락처, 주소, 소득 정보는 입력하거나 저장하지 않습니다.
          로컬 QR secret은 이 브라우저에만 보관됩니다.
        </Notice>
      </div>
    </section>
  );
}
