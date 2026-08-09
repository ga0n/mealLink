"use client";

import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { DemoAction, DemoState, demoReducer, initialState } from "@/lib/demo";

type DemoContextValue = { state: DemoState; dispatch: React.Dispatch<DemoAction>; ready: boolean };
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, initialState);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("meallink-demo-v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DemoState;
        if (Array.isArray(parsed.vouchers)) dispatch({ type: "HYDRATE", state: parsed });
      } catch { localStorage.removeItem("meallink-demo-v1"); }
    }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("meallink-demo-v1", JSON.stringify(state)); }, [state, ready]);
  return <DemoContext.Provider value={{ state, dispatch, ready }}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used inside DemoProvider");
  return context;
}
