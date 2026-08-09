"use client";

import Link from "next/link";
import {
  Check,
  Circle,
  ExternalLink,
  QrCode,
  Ticket,
  Utensils,
} from "lucide-react";
import { useDemo } from "@/components/demo-provider";
import { campaignStats } from "@/lib/demo";
import { Eyebrow, StatCard, StatusPill } from "@/components/ui";

const labels = [
  "후원 완료",
  "복지기관 확인",
  "QR 식사권 전달",
  "식사 제공 및 식당 정산",
];
export default function MyVouchersPage() {
  const { state, ready } = useDemo();
  const stats = campaignStats(state);
  return (
    <section className="section page-section">
      <div className="shell">
        <div className="page-heading">
          <div>
            <Eyebrow>나의 한 끼 연결</Eyebrow>
            <h1>내 식사권</h1>
            <p>후원한 식사권이 어디까지 전달되었는지 한눈에 확인하세요.</p>
          </div>
          <span className="account-chip">0x7A31...91F2</span>
        </div>
        <div className="stats-grid three slim">
          <StatCard label="후원 완료" value={stats.donated} />
          <StatCard label="전달 완료" value={stats.redeemed} accent />
          <StatCard label="전달 대기" value={stats.waiting} />
        </div>
        {!ready ? (
          <div className="empty-state">식사권을 불러오고 있어요…</div>
        ) : state.vouchers.length === 0 ? (
          <div className="empty-state">
            <span>
              <Ticket />
            </span>
            <h2>아직 후원한 식사권이 없어요</h2>
            <p>관악구 캠페인에서 한 끼를 이어보세요.</p>
            <Link href="/campaign" className="button">
              식사권 후원하기
            </Link>
          </div>
        ) : (
          <div className="voucher-list">
            {state.vouchers.map((voucher) => {
              const active =
                voucher.status === "donated"
                  ? 1
                  : voucher.status === "issued"
                    ? 3
                    : 4;
              return (
                <article className="voucher-card" key={voucher.id}>
                  <div className="voucher-head">
                    <div>
                      <span className="ticket-icon">
                        <Ticket />
                      </span>
                      <div>
                        <small>식사권 번호</small>
                        <h2>{voucher.id}</h2>
                      </div>
                    </div>
                    <StatusPill status={voucher.status} />
                  </div>
                  <div className="timeline">
                    {labels.map((label, index) => (
                      <div
                        className={`timeline-item ${index < active ? "done" : ""}`}
                        key={label}
                      >
                        <span>{index < active ? <Check /> : <Circle />}</span>
                        <strong>{label}</strong>
                        <small>
                          {index === 0
                            ? new Date(voucher.createdAt).toLocaleDateString(
                                "ko-KR",
                              )
                            : index === 1 && active > 1
                              ? "확인 완료"
                              : index === 2 && voucher.issuedAt
                                ? "QR 발급 완료"
                                : index === 3 && voucher.redeemedAt
                                  ? "정산 완료"
                                  : "다음 단계 대기"}
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="voucher-meta">
                    <span>
                      <QrCode /> {voucher.restaurant ?? "식당 배정 대기"}
                    </span>
                    <span>
                      <Utensils /> 8,000원 상당
                    </span>
                    <span className="hash">
                      거래 {voucher.txHash.slice(0, 10)}...{" "}
                      <ExternalLink size={13} />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
