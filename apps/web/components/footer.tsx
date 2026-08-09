"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useDemo } from "./demo-provider";

export function Footer() {
  const { dispatch } = useDemo();
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div><strong>한끼이음</strong><p>가상의 캠페인으로 한 끼의 연결 과정을 보여주는 데모 서비스입니다.</p></div>
        <div className="footer-links"><Link href="/transparency">투명성</Link><Link href="/campaign">캠페인</Link><button onClick={() => { dispatch({ type: "RESET" }); localStorage.removeItem("meallink-demo-v1"); }}><RotateCcw size={15} /> 데모 초기화</button></div>
      </div>
    </footer>
  );
}
