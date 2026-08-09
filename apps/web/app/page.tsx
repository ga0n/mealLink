import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Heart,
  MapPin,
  QrCode,
  Store,
  TicketCheck,
  Utensils,
} from "lucide-react";
import { DemoTag, Eyebrow, StatCard } from "@/components/ui";

const steps = [
  [Heart, "한 끼 후원", "원하는 수량만큼 식사권을 후원해요."],
  [Building2, "기관 확인", "복지기관이 익명 대상자를 확인하고 배정해요."],
  [QrCode, "QR 전달", "지정 식당에서만 쓸 수 있는 QR을 전해요."],
  [Utensils, "식사 완료", "한 끼 제공과 정산 결과를 확인해요."],
] as const;

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <Eyebrow>지역과 마음을 잇는 식사권</Eyebrow>
            <h1>
              후원한 마음이
              <br />
              <em>따뜻한 한 끼</em>로 이어집니다.
            </h1>
            <p>
              공공 식사 지원을 받지 못하는 주거취약 1인 가구와 지역 식당을
              연결합니다. 후원부터 식사 제공, 식당 정산까지 확인할 수 있습니다.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/campaign">
                식사권 후원하기 <ArrowRight size={18} />
              </Link>
              <Link className="button secondary" href="/my-vouchers">
                전달 과정 보기
              </Link>
            </div>
            <div className="hero-note">
              <CheckCircle2 size={17} /> 개인정보 없이 익명 식사권 번호만
              사용합니다.
            </div>
          </div>
          <div
            className="hero-visual"
            aria-label="식사권이 한 끼로 이어지는 모습"
          >
            <div className="sun-shape" />
            <div className="meal-card">
              <div className="meal-card-top">
                <span className="brand-mark">
                  <Heart size={19} />
                </span>
                <DemoTag />
              </div>
              <TicketCheck size={48} />
              <div>
                <small>서울 관악구</small>
                <strong>따뜻한 한 끼 식사권</strong>
                <span>8,000원 상당</span>
              </div>
              <div className="ticket-dots" />
            </div>
            <div className="connection-line" />
            <div className="mini-card">
              <span>
                <Store />
              </span>
              <div>
                <small>제휴 식당</small>
                <strong>온기밥상</strong>
                <em>제휴 식당</em>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="stats-band">
        <div className="shell stats-grid">
          <StatCard label="누적 후원 식사권" value={284} />
          <StatCard label="전달 완료" value={231} accent />
          <StatCard label="전달 대기" value={53} />
          <StatCard label="참여 식당" value={8} suffix="곳" />
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <div className="section-heading">
            <div>
              <Eyebrow>진행 중인 캠페인</Eyebrow>
              <h2>우리 동네에서 시작되는 연결</h2>
            </div>
            <Link href="/campaign" className="text-link">
              캠페인 자세히 보기 <ArrowRight size={16} />
            </Link>
          </div>
          <Link href="/campaign" className="campaign-card">
            <div className="campaign-art">
              <span className="location-chip">
                <MapPin size={15} /> 서울 관악구
              </span>
              <div className="bowl">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="campaign-info">
              <DemoTag>진행 중</DemoTag>
              <h3>
                중장년 1인 가구
                <br />
                따뜻한 한 끼
              </h3>
              <p>관악온기복지센터</p>
              <div className="progress-label">
                <span>후원 현황</span>
                <strong>64 / 100장</strong>
              </div>
              <div className="progress">
                <span style={{ width: "64%" }} />
              </div>
              <div className="campaign-bottom">
                <span>
                  전달 완료 <strong>51장</strong>
                </span>
                <span>
                  전달 대기 <strong>13장</strong>
                </span>
                <em>
                  <ArrowRight />
                </em>
              </div>
            </div>
          </Link>
        </div>
      </section>
      <section className="section process-section">
        <div className="shell">
          <div className="center-heading">
            <Eyebrow>한 끼가 이어지는 과정</Eyebrow>
            <h2>후원 이후도 함께 확인하세요</h2>
            <p>
              식사권이 만들어지고 전달되는 모든 단계를 투명하게 보여드립니다.
            </p>
          </div>
          <div className="steps">
            {steps.map(([Icon, title, body], i) => (
              <div className="step" key={title}>
                <span className="step-num">0{i + 1}</span>
                <div className="step-icon">
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                {i < 3 && <ArrowRight className="step-arrow" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
