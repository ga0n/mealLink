"use client";

import Link from "next/link";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { IS_DEMO_MODE } from "@/lib/web3/mode";

export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="한끼이음 홈">
          <span className="brand-mark">
            <HeartHandshake size={22} />
          </span>
          <span>
            한끼이음<small>MealLink</small>
          </span>
        </Link>
        <span className="demo-badge">{IS_DEMO_MODE ? "DEMO" : "LOCAL"}</span>
        <Link
          className="header-action"
          href="/transparency"
          aria-label="전달 현황"
        >
          <ShieldCheck />
        </Link>
      </div>
    </header>
  );
}
