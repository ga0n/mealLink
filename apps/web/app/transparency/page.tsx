"use client";

import { Check, Clock3, ExternalLink, HeartHandshake, Store } from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { campaignStats } from "@/lib/demo";
import { DemoTag, Eyebrow, Notice, StatCard } from "@/components/ui";

export default function TransparencyPage() {
  const { state } = useDemo(); const stats = campaignStats(state); const settlements = state.vouchers.filter((v) => v.status === "redeemed");
  const events = state.vouchers.flatMap((v) => [{ type: "DonationMade", label: `${v.id} 후원 완료`, date: v.createdAt }, ...(v.issuedAt ? [{ type: "VoucherIssued", label: `${v.id} QR 발급`, date: v.issuedAt }] : []), ...(v.redeemedAt ? [{ type: "VoucherRedeemed", label: `${v.id} 식사·정산 완료`, date: v.redeemedAt }] : [])]).sort((a, b) => b.date.localeCompare(a.date));
  return <section className="section page-section"><div className="shell"><div className="page-heading"><div><Eyebrow>투명한 한 끼 연결</Eyebrow><h1>전달 현황</h1><p>후원된 식사권이 어디까지 이어졌는지 가상 기록으로 확인하세요.</p></div><DemoTag>DEMO 데이터</DemoTag></div><Notice tone="warm">아래 지갑, 거래와 이벤트는 실제 온체인 데이터가 아닌 1단계 시연용 가상 데이터입니다.</Notice><div className="stats-grid four transparency-stats"><StatCard label="전체 누적 후원" value={284 + (stats.donated - 64)} /><StatCard label="전체 전달 완료" value={231 + (stats.redeemed - 51)} accent /><StatCard label="전체 전달 대기" value={53 + (stats.waiting - 13)} /><StatCard label="참여 식당" value={8} suffix="곳" /></div>
  <div className="transparency-grid"><div className="panel"><div className="panel-title"><div><Store /><h2>식당별 가상 정산</h2></div><span>0.001 ETH / 건</span></div><div className="restaurant-rows">{["온기밥상", "정담식당", "하루한상"].map((name, i) => <div key={name}><span className={`restaurant-dot r${i}`}><Store /></span><div><strong>{name}</strong><small>가상 식당</small></div><span className="grow" /><div className="right"><strong>{[22, 17, 12][i] + settlements.filter((v) => v.restaurant?.startsWith(name)).length}건</strong><small>정산 완료</small></div></div>)}</div></div><div className="panel"><div className="panel-title"><div><HeartHandshake /><h2>최근 데모 이벤트</h2></div><DemoTag /></div>{events.length ? <div className="event-list">{events.slice(0, 6).map((event, i) => <div key={`${event.type}-${i}`}><span>{event.type === "VoucherRedeemed" ? <Check /> : <Clock3 />}</span><div><strong>{event.label}</strong><small>{event.type} · {new Date(event.date).toLocaleString("ko-KR")}</small></div><ExternalLink /></div>)}</div> : <div className="mini-empty"><Clock3 /> 새 데모 이벤트는 후원 후 표시됩니다.</div>}</div></div>
  <div className="privacy-strip"><div><Check /><span><strong>개인정보 없이 투명하게</strong>이름이나 연락처 대신 식사권 번호와 축약 지갑 주소만 사용합니다.</span></div><span className="fake-address">0x7A31...91F2</span></div></div></section>;
}
