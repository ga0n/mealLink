"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import { Check, Download, LoaderCircle, QrCode, ShieldCheck, Wallet } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { agencyWallet, qrValue, restaurants } from "@/lib/demo";
import { DemoTag, Eyebrow, Notice, StatCard } from "@/components/ui";

export default function AgencyPage() {
  const { state, dispatch } = useDemo(); const available = state.vouchers.filter((v) => v.status === "donated");
  const [voucherId, setVoucherId] = useState(""); const [restaurant, setRestaurant] = useState(restaurants[0]); const [loading, setLoading] = useState(false); const [qr, setQr] = useState("");
  useEffect(() => { if (!voucherId && available[0]) setVoucherId(available[0].id); }, [available, voucherId]);
  const latestIssued = useMemo(() => state.vouchers.find((v) => v.status === "issued"), [state.vouchers]);
  const issue = async () => { if (!voucherId) return; setLoading(true); await new Promise((r) => setTimeout(r, 700)); const secret = `ML-${crypto.randomUUID()}`; dispatch({ type: "ISSUE", voucherId, recipient: "USER-018", restaurant, secret }); setQr(await QRCode.toDataURL(qrValue(secret), { width: 300, margin: 2, color: { dark: "#173f36", light: "#ffffff" } })); setLoading(false); };
  return <section className="section page-section"><div className="shell"><div className="page-heading"><div><Eyebrow>복지기관 업무 화면</Eyebrow><h1>안전하게 한 끼를 전달해요</h1><p>개인정보 없이 익명 대상자에게 일회용 식사권을 발급합니다.</p></div><div className="wallet-chip"><Wallet size={16} /><span>기관 지갑</span><strong>{agencyWallet}</strong><DemoTag /></div></div><div className="stats-grid three slim"><StatCard label="발급 가능" value={available.length} /><StatCard label="QR 발급" value={state.vouchers.filter((v) => v.status === "issued").length} /><StatCard label="사용 완료" value={state.vouchers.filter((v) => v.status === "redeemed").length} accent /></div>
    <div className="workspace-grid"><div className="form-card"><div className="card-title"><span>1</span><div><h2>익명 대상자 확인</h2><p>개인정보 대신 익명 번호만 사용합니다.</p></div></div><label>익명 대상자 번호<input value="USER-018" readOnly /></label><div className="verified-row"><ShieldCheck /><div><strong>공공 식사 지원 미수혜 확인 완료</strong><small>기관 내부 절차로 확인 · 상세 정보 저장 안 함</small></div><Check /></div><div className="card-title next"><span>2</span><div><h2>식사권과 식당 선택</h2><p>후원된 식사권만 발급할 수 있습니다.</p></div></div><label>발급할 식사권<select value={voucherId} onChange={(e) => setVoucherId(e.target.value)}><option value="">{available.length ? "식사권 선택" : "발급 가능한 식사권 없음"}</option>{available.map((v) => <option key={v.id}>{v.id}</option>)}</select></label><label>지정 제휴 식당<select value={restaurant} onChange={(e) => setRestaurant(e.target.value)}>{restaurants.map((r) => <option key={r}>{r}</option>)}</select></label><button className="button wide" disabled={!voucherId || loading} onClick={issue}>{loading ? <><LoaderCircle className="spin" /> QR 생성 중</> : <><QrCode /> 일회용 QR 발급</>}</button></div>
    <div className="qr-card"><DemoTag>일회용 데모 QR</DemoTag>{qr ? <><h2>식사권이 준비됐어요</h2><p>지정된 가상 식당에서 한 번만 사용할 수 있습니다.</p><Image src={qr} alt="발급된 데모 식사권 QR 코드" width={220} height={220} unoptimized /><strong>{voucherId}</strong><span>USER-018 · {restaurant}</span><a className="button secondary wide" href={qr} download={`${voucherId}.png`}><Download /> QR 이미지 저장</a></> : latestIssued ? <><QrCode size={58} /><h2>발급된 QR이 있어요</h2><p>{latestIssued.id}의 QR은 식당 화면에서 바로 불러올 수 있습니다.</p></> : <><div className="qr-placeholder"><QrCode /></div><h2>아직 발급된 QR이 없어요</h2><p>왼쪽에서 식사권과 식당을 선택해 발급하세요.</p></>}</div></div><Notice>이용자의 이름, 연락처, 주소, 소득 정보는 입력하거나 저장하지 않습니다.</Notice></div></section>;
}
