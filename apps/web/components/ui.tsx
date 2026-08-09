import { Check, Clock3, Info, ShieldCheck } from "lucide-react";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}
export function DemoTag({ children = "DEMO" }: { children?: React.ReactNode }) {
  return (
    <span className="tag">
      <span />
      {children}
    </span>
  );
}
export function Notice({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warm" | "success";
}) {
  const Icon =
    tone === "success" ? Check : tone === "warm" ? ShieldCheck : Info;
  return (
    <div className={`notice ${tone}`}>
      <Icon size={19} />
      <div>{children}</div>
    </div>
  );
}
export function StatCard({
  label,
  value,
  suffix = "장",
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className={accent ? "stat-card accent" : "stat-card"}>
      <span>{label}</span>
      <strong>
        {value.toLocaleString()}
        <small>{suffix}</small>
      </strong>
    </div>
  );
}
export function StatusPill({
  status,
}: {
  status: "donated" | "issued" | "redeemed";
}) {
  const text =
    status === "redeemed"
      ? "한 끼 전달 완료"
      : status === "issued"
        ? "QR 전달 완료"
        : "전달 대기";
  return (
    <span className={`status-pill ${status}`}>
      {status === "redeemed" ? <Check size={14} /> : <Clock3 size={14} />}
      {text}
    </span>
  );
}
