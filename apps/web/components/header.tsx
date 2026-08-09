"use client";

import Link from "next/link";
import { HeartHandshake, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  ["캠페인", "/campaign"], ["내 식사권", "/my-vouchers"], ["복지기관", "/agency"], ["식당", "/restaurant"], ["투명성", "/transparency"]
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand" aria-label="한끼이음 홈">
          <span className="brand-mark"><HeartHandshake size={22} /></span>
          <span>한끼이음<small>MealLink</small></span>
        </Link>
        <span className="demo-badge">DEMO</span>
        <button className="menu-button" aria-label="메뉴 열기" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        <nav className={open ? "nav open" : "nav"} aria-label="주요 메뉴">
          {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          <Link className="button button-sm" href="/campaign" onClick={() => setOpen(false)}>한 끼 후원</Link>
        </nav>
      </div>
    </header>
  );
}
