"use client";

import { useState } from "react";
import {
  Camera,
  Check,
  CircleAlert,
  LoaderCircle,
  QrCode,
  ReceiptText,
  ScanLine,
} from "lucide-react";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";
import { useDemo } from "@/components/demo-provider";
import { WalletPanel } from "@/components/wallet-panel";
import { parseQrValue, qrValue } from "@/lib/demo";
import { DemoTag, Eyebrow, Notice } from "@/components/ui";
import { CONTRACT_ADDRESS, IS_DEMO_MODE } from "@/lib/web3/mode";
import {
  ACTIVE_CHAIN_ID,
  ACTIVE_NETWORK_NAME,
  IS_SEPOLIA,
} from "@/lib/web3/config";
import { mealLinkAbi } from "@/lib/web3/contract";
import { getWeb3ErrorMessage } from "@/lib/web3/errors";
import {
  hashQrSecret,
  loadLocalVouchers,
  encodeLocalVoucher,
  parseLocalVoucher,
} from "@/lib/web3/qr";
import { useOnchainCampaign } from "@/hooks/use-onchain-campaign";
import {
  savePendingTransaction,
  updateStoredTransaction,
} from "@/lib/web3/pending";
import { transactionExplorerUrl } from "@/lib/web3/links";

type Result = {
  kind: "valid" | "used" | "invalid";
  message: string;
  voucherId?: string;
  restaurant?: string;
} | null;

export default function RestaurantPage() {
  const { state, dispatch } = useDemo();
  const onchain = useOnchainCampaign();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [transactionHash, setTransactionHash] = useState<`0x${string}`>();

  const validate = async (raw = input) => {
    setStatus("");
    if (IS_DEMO_MODE) {
      const secret = parseQrValue(raw);
      const voucher = state.vouchers.find((item) => item.qrSecret === secret);
      if (!voucher)
        return setResult({
          kind: "invalid",
          message: "유효하지 않은 QR입니다. 문자를 다시 확인해 주세요.",
        });
      if (voucher.status === "redeemed")
        return setResult({
          kind: "used",
          message: "이미 사용 완료된 식사권입니다.",
          voucherId: voucher.id,
          restaurant: voucher.restaurant,
        });
      if (voucher.status !== "issued")
        return setResult({
          kind: "invalid",
          message: "아직 발급되지 않은 식사권입니다.",
        });
      return setResult({
        kind: "valid",
        message: "사용 가능한 식사권입니다.",
        voucherId: voucher.id,
        restaurant: voucher.restaurant,
      });
    }
    try {
      if (!CONTRACT_ADDRESS) throw new Error("contract address missing");
      if (!publicClient) throw new Error("RPC connection failed");
      const parsed = parseLocalVoucher(raw);
      if (!parsed) throw new Error("InvalidQrSecret");
      const voucher = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: mealLinkAbi,
        functionName: "getVoucher",
        args: [parsed.voucherId],
      });
      if (
        voucher.qrSecretHash.toLowerCase() !==
        hashQrSecret(parsed.secret).toLowerCase()
      )
        throw new Error("InvalidQrSecret");
      if (voucher.redeemed)
        return setResult({
          kind: "used",
          message:
            "이미 사용 완료된 식사권입니다. 동일 QR은 다시 사용할 수 없습니다.",
          voucherId: parsed.voucherId.toString(),
          restaurant: voucher.restaurant,
        });
      if (
        !connection.address ||
        connection.address.toLowerCase() !== voucher.restaurant.toLowerCase()
      )
        return setResult({
          kind: "invalid",
          message: "이 식사권에 지정된 식당 지갑만 사용 처리할 수 있습니다.",
          voucherId: parsed.voucherId.toString(),
          restaurant: voucher.restaurant,
        });
      setResult({
        kind: "valid",
        message: "사용 가능한 온체인 식사권입니다.",
        voucherId: parsed.voucherId.toString(),
        restaurant: voucher.restaurant,
      });
    } catch (reason) {
      setResult({ kind: "invalid", message: getWeb3ErrorMessage(reason) });
    }
  };

  const loadSample = async () => {
    if (IS_DEMO_MODE) {
      const voucher = state.vouchers.find(
        (item) => item.status === "issued" && item.qrSecret,
      );
      if (!voucher?.qrSecret)
        return setResult({
          kind: "invalid",
          message: "먼저 복지기관 화면에서 QR을 발급해 주세요.",
        });
      const value = qrValue(voucher.qrSecret);
      setInput(value);
      await validate(value);
      return;
    }
    const voucher = loadLocalVouchers()[0];
    if (!voucher)
      return setResult({
        kind: "invalid",
        message:
          "이 브라우저에 저장된 QR이 없습니다. QR 문자를 직접 입력해 주세요.",
      });
    const value = encodeLocalVoucher(voucher);
    setInput(value);
    await validate(value);
  };

  const redeem = async () => {
    if (!result?.voucherId) return;
    setPending(true);
    setStatus("");
    try {
      if (IS_DEMO_MODE) {
        await new Promise((resolve) => setTimeout(resolve, 900));
        dispatch({ type: "REDEEM", secret: parseQrValue(input) });
      } else {
        if (!CONTRACT_ADDRESS) throw new Error("contract address missing");
        if (connection.chainId !== ACTIVE_CHAIN_ID)
          throw new Error("chain mismatch");
        if (!publicClient) throw new Error("RPC connection failed");
        const parsed = parseLocalVoucher(input);
        if (!parsed) throw new Error("InvalidQrSecret");
        if (!connection.address) throw new Error("UnauthorizedRestaurant");
        setStatus("MetaMask 승인을 기다리고 있습니다.");
        const [walletBalance, gasPrice, estimatedGas] = await Promise.all([
          publicClient.getBalance({ address: connection.address }),
          publicClient.getGasPrice(),
          publicClient.estimateContractGas({
            account: connection.address,
            address: CONTRACT_ADDRESS,
            abi: mealLinkAbi,
            functionName: "redeemVoucher",
            args: [parsed.voucherId, parsed.secret],
          }),
        ]);
        if (walletBalance < estimatedGas * gasPrice)
          throw new Error("insufficient funds for restaurant gas");
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: mealLinkAbi,
          functionName: "redeemVoucher",
          args: [parsed.voucherId, parsed.secret],
          chainId: ACTIVE_CHAIN_ID,
        });
        setTransactionHash(hash);
        savePendingTransaction(hash, "redeem");
        setStatus("트랜잭션이 제출되었습니다. 정산 확정을 기다립니다.");
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
          timeout: 300_000,
        });
        updateStoredTransaction(
          hash,
          receipt.status === "success" ? "confirmed" : "failed",
          receipt.blockNumber,
        );
        if (receipt.status !== "success")
          throw new Error("transaction reverted");
        setStatus(
          `블록 #${receipt.blockNumber.toString()}에서 0.001 ETH 정산이 확정되었습니다.`,
        );
        await onchain.refetch();
      }
      setResult({
        ...result,
        kind: "used",
        message: "식사 제공과 정산이 완료되었습니다.",
      });
    } catch (reason) {
      setResult({
        ...result,
        kind: "invalid",
        message: getWeb3ErrorMessage(reason),
      });
    } finally {
      setPending(false);
    }
  };

  const settlements = state.vouchers.filter(
    (voucher) => voucher.status === "redeemed",
  );
  return (
    <section className="section page-section">
      <div className="shell">
        <div className="page-heading">
          <div>
            <Eyebrow>제휴 식당 업무 화면</Eyebrow>
            <h1>QR을 확인하고 식사를 제공해요</h1>
            <p>지정된 일회용 식사권인지 확인하고 완료 처리합니다.</p>
          </div>
          <DemoTag>{IS_DEMO_MODE ? "DEMO" : "ONCHAIN"}</DemoTag>
        </div>
        <WalletPanel />
        {!IS_DEMO_MODE && (
          <Notice tone="warm">
            {IS_SEPOLIA
              ? "Sepolia 테스트넷 · 실제 결제가 아닙니다. 정산 확정 전에는 페이지를 닫지 마세요."
              : `${ACTIVE_NETWORK_NAME} 테스트 환경입니다.`}
          </Notice>
        )}
        <div className="workspace-grid">
          <div className="scanner-card">
            <div className="scanner-visual">
              <ScanLine />
              <div>
                <Camera />
                <span>카메라 QR 스캔</span>
                <small>
                  현재는 QR 문자 직접 입력과 발급 QR 불러오기를 지원합니다.
                </small>
              </div>
            </div>
            <button className="button secondary wide" onClick={loadSample}>
              발급된 QR 불러오기
            </button>
            <div className="divider">
              <span>또는 QR 문자 직접 입력</span>
            </div>
            <label className="sr-only" htmlFor="qr-input">
              QR 문자열
            </label>
            <textarea
              id="qr-input"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setResult(null);
              }}
              placeholder={
                IS_DEMO_MODE
                  ? "MEALLINK:GANAK:ML-..."
                  : `MEALLINK:${IS_SEPOLIA ? "SEPOLIA" : "LOCAL"}:1:0x...`
              }
            />
            <button
              className="button dark wide"
              disabled={!input}
              onClick={() => validate()}
            >
              식사권 유효성 확인
            </button>
          </div>
          <div className="validation-card">
            {!result ? (
              <div className="empty-validation">
                <span>
                  <QrCode />
                </span>
                <h2>식사권을 확인해 주세요</h2>
                <p>QR 문자를 입력하면 온체인 상태와 지정 식당을 확인합니다.</p>
              </div>
            ) : (
              <div className={`result ${result.kind}`}>
                <span>
                  {result.kind === "valid" ? <Check /> : <CircleAlert />}
                </span>
                <DemoTag>
                  {result.kind === "valid" ? "검증 완료" : "사용 상태"}
                </DemoTag>
                <h2>{result.message}</h2>
                {result.voucherId && (
                  <div className="receipt">
                    <div>
                      <span>식사권 번호</span>
                      <strong>#{result.voucherId}</strong>
                    </div>
                    <div>
                      <span>지정 식당</span>
                      <strong className="hash-text">{result.restaurant}</strong>
                    </div>
                    <div>
                      <span>정산 단위</span>
                      <strong>0.001 ETH</strong>
                    </div>
                  </div>
                )}
                {status && (
                  <p className="transaction-state">
                    {status}
                    {transactionHash && (
                      <>
                        <br />
                        {transactionExplorerUrl(transactionHash) ? (
                          <a
                            className="hash-text"
                            href={transactionExplorerUrl(transactionHash)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Etherscan에서 확인
                          </a>
                        ) : (
                          <span className="hash-text">{transactionHash}</span>
                        )}
                      </>
                    )}
                  </p>
                )}
                {result.kind === "valid" && (
                  <button
                    className="button wide"
                    disabled={pending}
                    onClick={redeem}
                  >
                    {pending ? (
                      <>
                        <LoaderCircle className="spin" /> 정산 처리 중
                      </>
                    ) : (
                      <>
                        식사 제공 완료 <Check />
                      </>
                    )}
                  </button>
                )}
                {result.kind === "used" && (
                  <Notice tone="success">캠페인 통계가 갱신되었습니다.</Notice>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="settlement-section">
          <div className="section-heading">
            <div>
              <h2>정산 현황</h2>
              <p>
                {IS_DEMO_MODE
                  ? "완료된 식사권 정산 내역입니다."
                  : `온체인 사용 완료 ${onchain.stats?.redeemed ?? 0}건`}
              </p>
            </div>
            <DemoTag />
          </div>
          {IS_DEMO_MODE && settlements.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>식사권</th>
                    <th>식당</th>
                    <th>상태</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((voucher) => (
                    <tr key={voucher.id}>
                      <td>{voucher.id}</td>
                      <td>{voucher.restaurant}</td>
                      <td>
                        <span className="status-pill redeemed">
                          <Check />
                          정산 완료
                        </span>
                      </td>
                      <td>0.001 ETH</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mini-empty">
              <ReceiptText />{" "}
              {IS_DEMO_MODE
                ? "아직 정산된 식사권이 없습니다."
                : "트랜잭션은 로컬 블록체인에서 조회됩니다."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
