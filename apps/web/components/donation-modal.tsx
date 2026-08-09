"use client";

import { Check, LoaderCircle, Minus, Plus, Wallet, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";
import { useDemo } from "./demo-provider";
import { Notice } from "./ui";
import {
  CAMPAIGN_ID,
  mealLinkAbi,
  VOUCHER_PRICE_WEI,
} from "@/lib/web3/contract";
import { HARDHAT_CHAIN_ID } from "@/lib/web3/config";
import { getWeb3ErrorMessage } from "@/lib/web3/errors";
import { CONTRACT_ADDRESS, IS_DEMO_MODE } from "@/lib/web3/mode";

type Phase =
  "idle" | "connecting" | "awaiting" | "submitted" | "success" | "failed";

export function DonationModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}) {
  const [quantity, setQuantity] = useState(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [hash, setHash] = useState<`0x${string}`>();
  const [blockNumber, setBlockNumber] = useState<bigint>();
  const { dispatch } = useDemo();
  const router = useRouter();
  const connection = useConnection();
  const publicClient = usePublicClient({ chainId: HARDHAT_CHAIN_ID });
  const { writeContractAsync } = useWriteContract();

  const donate = async () => {
    setError("");
    if (IS_DEMO_MODE) {
      setPhase("connecting");
      await new Promise((resolve) => setTimeout(resolve, 450));
      setPhase("submitted");
      await new Promise((resolve) => setTimeout(resolve, 900));
      dispatch({ type: "DONATE", quantity });
      setPhase("success");
      return;
    }
    if (!CONTRACT_ADDRESS) {
      setError(
        "로컬 컨트랙트 주소가 설정되지 않았습니다. 환경변수를 확인해 주세요.",
      );
      setPhase("failed");
      return;
    }
    if (!connection.isConnected) {
      setError("먼저 캠페인 화면에서 MetaMask 지갑을 연결해 주세요.");
      return;
    }
    if (connection.chainId !== HARDHAT_CHAIN_ID) {
      setError("Hardhat Local 네트워크로 전환한 뒤 다시 시도해 주세요.");
      return;
    }
    try {
      setPhase("awaiting");
      const transactionHash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: mealLinkAbi,
        functionName: "donate",
        args: [CAMPAIGN_ID, BigInt(quantity)],
        value: VOUCHER_PRICE_WEI * BigInt(quantity),
        chainId: HARDHAT_CHAIN_ID,
      });
      setHash(transactionHash);
      setPhase("submitted");
      if (!publicClient) throw new Error("RPC connection failed");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: transactionHash,
      });
      setBlockNumber(receipt.blockNumber);
      await onSuccess?.();
      setPhase("success");
    } catch (reason) {
      setError(getWeb3ErrorMessage(reason));
      setPhase("failed");
    }
  };

  const busy = ["connecting", "awaiting", "submitted"].includes(phase);
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-title"
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="후원 창 닫기"
        >
          <X />
        </button>
        {phase === "success" ? (
          <div className="success-panel">
            <span className="success-icon">
              <Check />
            </span>
            <p className="eyebrow">후원 완료</p>
            <h2 id="donation-title">한 끼가 안전하게 이어졌어요</h2>
            <p>{quantity}장의 식사권 후원이 확정되었습니다.</p>
            <div className="receipt">
              <div>
                <span>후원 수량</span>
                <strong>{quantity}장</strong>
              </div>
              <div>
                <span>전송 금액</span>
                <strong>{(quantity * 0.001).toFixed(3)} ETH</strong>
              </div>
              <div>
                <span>네트워크</span>
                <strong>{IS_DEMO_MODE ? "데모" : "Hardhat Local"}</strong>
              </div>
              {hash && (
                <div>
                  <span>트랜잭션</span>
                  <strong className="hash-text">{hash}</strong>
                </div>
              )}
              {blockNumber !== undefined && (
                <div>
                  <span>블록</span>
                  <strong>#{blockNumber.toString()}</strong>
                </div>
              )}
            </div>
            <button
              className="button wide"
              onClick={() =>
                router.push(IS_DEMO_MODE ? "/my-vouchers" : "/transparency")
              }
            >
              진행 내역 확인
            </button>
          </div>
        ) : (
          <>
            <p className="eyebrow">한 끼 후원</p>
            <h2 id="donation-title">몇 끼를 이어드릴까요?</h2>
            <p className="muted">선택한 수량만큼 식사권을 후원합니다.</p>
            <div className="quantity-control">
              <button
                aria-label="수량 줄이기"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus />
              </button>
              <div>
                <strong>{quantity}</strong>
                <span>식사권</span>
              </div>
              <button
                aria-label="수량 늘리기"
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
              >
                <Plus />
              </button>
            </div>
            <div className="summary-list">
              <div>
                <span>식사권 표시 기준가</span>
                <strong>{(quantity * 8000).toLocaleString()}원 상당</strong>
              </div>
              <div>
                <span>전송 금액</span>
                <strong>{(quantity * 0.001).toFixed(3)} ETH</strong>
              </div>
              <div>
                <span>네트워크</span>
                <strong className="ok-dot">
                  {IS_DEMO_MODE ? "데모 모드" : "Hardhat Local"}
                </strong>
              </div>
              {!IS_DEMO_MODE && (
                <div>
                  <span>연결 지갑</span>
                  <strong>
                    {connection.address
                      ? `${connection.address.slice(0, 6)}…${connection.address.slice(-4)}`
                      : "연결 필요"}
                  </strong>
                </div>
              )}
            </div>
            <Notice tone="warm">
              8,000원 상당의 표시 기준가와 0.001 ETH 사이에는 환산 관계가
              없습니다.
            </Notice>
            {hash && phase === "submitted" && (
              <p className="transaction-state">
                제출됨 · 트랜잭션 확정을 기다리고 있습니다.
                <br />
                <span className="hash-text">{hash}</span>
              </p>
            )}
            {error && <p className="form-error">{error}</p>}
            <button className="button wide" disabled={busy} onClick={donate}>
              {!busy ? (
                <>
                  <Wallet size={18} /> 식사권 후원하기
                </>
              ) : (
                <>
                  <LoaderCircle className="spin" size={18} />
                  {phase === "awaiting"
                    ? "MetaMask 승인 대기"
                    : phase === "submitted"
                      ? "트랜잭션 확인 중"
                      : "처리 중"}
                </>
              )}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
