"use client";

import { Check, LoaderCircle, Minus, Plus, Wallet, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "./demo-provider";
import { Notice } from "./ui";

export function DonationModal({ onClose }: { onClose: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [phase, setPhase] = useState<"idle" | "connecting" | "pending" | "success">("idle");
  const { dispatch } = useDemo();
  const router = useRouter();
  const donate = async () => {
    setPhase("connecting"); await new Promise((r) => setTimeout(r, 450));
    setPhase("pending"); await new Promise((r) => setTimeout(r, 900));
    dispatch({ type: "DONATE", quantity }); setPhase("success");
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="donation-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label="후원 창 닫기"><X /></button>
      {phase === "success" ? <div className="success-panel">
        <span className="success-icon"><Check /></span><p className="eyebrow">가상 거래 완료</p><h2 id="donation-title">한 끼가 새롭게 이어졌어요</h2>
        <p>{quantity}장의 식사권이 생성되었습니다. 이제 복지기관이 익명 이용자에게 QR을 전달할 수 있어요.</p>
        <div className="receipt"><div><span>후원 수량</span><strong>{quantity}장</strong></div><div><span>테스트 거래</span><strong>{(quantity * 0.001).toFixed(3)} Sepolia ETH</strong></div><div><span>현재 상태</span><strong>전달 대기</strong></div></div>
        <button className="button wide" onClick={() => router.push("/my-vouchers")}>내 식사권 확인</button>
      </div> : <>
        <p className="eyebrow">한 끼 후원</p><h2 id="donation-title">몇 끼를 이어드릴까요?</h2><p className="muted">실제 거래 없이 데모 데이터만 변경됩니다.</p>
        <div className="quantity-control"><button aria-label="수량 줄이기" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus /></button><div><strong>{quantity}</strong><span>식사권</span></div><button aria-label="수량 늘리기" onClick={() => setQuantity(Math.min(10, quantity + 1))}><Plus /></button></div>
        <div className="summary-list"><div><span>식사권 표시 기준가</span><strong>{(quantity * 8000).toLocaleString()}원 상당</strong></div><div><span>예상 테스트 거래</span><strong>{(quantity * 0.001).toFixed(3)} Sepolia ETH</strong></div><div><span>네트워크</span><strong className="ok-dot">Sepolia · 데모</strong></div><div><span>연결 지갑</span><strong>0x7A31...91F2</strong></div></div>
        <Notice tone="warm">표시 가격과 테스트 ETH는 환산 관계가 없습니다. 실제 돈은 사용되지 않습니다.</Notice>
        <button className="button wide" disabled={phase !== "idle"} onClick={donate}>{phase === "idle" ? <><Wallet size={18} /> 데모 후원 시작</> : <><LoaderCircle className="spin" size={18} /> {phase === "connecting" ? "가상 지갑 연결 중" : "거래 처리 중"}</>}</button>
      </>}
    </section>
  </div>;
}
