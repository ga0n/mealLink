"use client";

import { useState } from "react";
import { ArrowRight, Building2, Check, MapPin, Store, Users } from "lucide-react";
import { DonationModal } from "@/components/donation-modal";
import { DemoTag, Eyebrow, Notice, StatCard } from "@/components/ui";
import { useDemo } from "@/components/demo-provider";
import { campaignStats, restaurants } from "@/lib/demo";

export default function CampaignPage() {
  const [modal, setModal] = useState(false); const { state } = useDemo(); const stats = campaignStats(state);
  return <><section className="page-hero compact"><div className="shell"><div className="breadcrumb">홈 <span>/</span> 캠페인 <span>/</span> 서울 관악구</div><div className="campaign-title"><div><div className="label-row"><span className="location-chip"><MapPin size={15} /> 서울 관악구</span><DemoTag>가상 캠페인</DemoTag></div><h1>중장년 1인 가구<br />따뜻한 한 끼</h1><p>공공 식사 지원을 받지 않는 주거취약 40~64세 1인 가구에게 지역의 따뜻한 한 끼를 연결합니다.</p></div><div className="campaign-symbol"><div className="bowl large"><span /><span /><span /></div></div></div></div></section>
    <section className="section campaign-detail"><div className="shell two-column"><div className="content-column"><Eyebrow>캠페인 현황</Eyebrow><div className="stats-grid three"><StatCard label="후원 완료" value={stats.donated} /><StatCard label="전달 완료" value={stats.redeemed} accent /><StatCard label="전달 대기" value={stats.waiting} /></div><div className="goal-block"><div><span>100장 목표까지</span><strong>{stats.donated}%</strong></div><div className="progress big"><span style={{ width: `${Math.min(stats.donated, 100)}%` }} /></div><small>{Math.max(0, 100 - stats.donated)}장의 식사권이 더 필요해요.</small></div>
      <div className="info-section"><h2>지역 안에서 이어지는 한 끼</h2><p>공공 지원의 경계에 놓인 이웃에게 익명 식사권을 전합니다. 이용자의 개인정보 없이 복지기관의 확인과 지정 식당의 사용 처리만 기록합니다.</p><div className="detail-list"><div><Building2 /><span>운영기관</span><strong>관악온기복지센터 <DemoTag>가상 기관</DemoTag></strong></div><div><Users /><span>지원 대상</span><strong>공공 식사 지원 미수혜 40~64세 1인 가구</strong></div><div><Store /><span>제휴 식당</span><strong>{restaurants.map((r) => <small key={r}><Check size={14} /> {r}</small>)}</strong></div></div></div>
      <Notice>본 캠페인의 기관, 식당과 이용 기록은 서비스 시연을 위한 가상 데이터입니다.</Notice></div>
      <aside className="donation-box"><DemoTag>DEMO 후원</DemoTag><h2>한 끼를 이어주세요</h2><p>식사권 한 장이 지역 식당의 따뜻한 식사 한 끼로 전달됩니다.</p><div className="price-box"><div><span>식사권 표시 기준가</span><strong>8,000원 <small>상당</small></strong></div><div><span>테스트 후원 단위</span><strong>0.001 <small>Sepolia ETH / 장</small></strong></div></div><p className="tiny-note">식사권 표시 가격과 테스트 ETH는 환산 관계가 없습니다.</p><button className="button wide" onClick={() => setModal(true)}>식사권 후원하기 <ArrowRight size={18} /></button><ul className="trust-list"><li><Check />실제 자금이 이동하지 않아요</li><li><Check />개인정보를 저장하지 않아요</li><li><Check />전달 전 과정을 확인할 수 있어요</li></ul></aside></div></section>
    {modal && <DonationModal onClose={() => setModal(false)} />}</>;
}
