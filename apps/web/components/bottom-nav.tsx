"use client";

import Link from "next/link";
import { Building2, Heart, Home, Store, Ticket } from "lucide-react";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "홈", icon: Home },
  { href: "/campaign", label: "후원", icon: Heart },
  { href: "/my-vouchers", label: "식사권", icon: Ticket },
  { href: "/agency", label: "기관", icon: Building2 },
  { href: "/restaurant", label: "식당", icon: Store },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="앱 메뉴">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "active" : ""}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
