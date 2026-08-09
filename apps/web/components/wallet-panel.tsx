"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, LogOut, Wallet } from "lucide-react";
import {
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { HARDHAT_CHAIN_ID } from "@/lib/web3/config";
import { getWeb3ErrorMessage } from "@/lib/web3/errors";
import { IS_DEMO_MODE } from "@/lib/web3/mode";
import { shortenAddress } from "@/lib/web3/accounts";

export function WalletPanel() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const connection = useConnection();
  const connectors = useConnectors();
  const { connect, isPending } = useConnect({
    mutation: { onError: (reason) => setError(getWeb3ErrorMessage(reason)) },
  });
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain({
    mutation: { onError: (reason) => setError(getWeb3ErrorMessage(reason)) },
  });

  useEffect(() => setMounted(true), []);

  if (IS_DEMO_MODE) {
    return (
      <section className="wallet-panel" aria-label="실행 모드">
        <span className="mode-chip demo">DEMO MODE</span>
        <p>저장된 데모 데이터로 모든 화면을 체험할 수 있습니다.</p>
      </section>
    );
  }

  const isMetaMaskInstalled = mounted && Boolean(window.ethereum?.isMetaMask);
  const wrongNetwork =
    connection.isConnected && connection.chainId !== HARDHAT_CHAIN_ID;

  return (
    <section className="wallet-panel" aria-label="지갑 연결">
      <div className="wallet-panel-heading">
        <span className="mode-chip local">LOCAL BLOCKCHAIN</span>
        <span className="testnet-label">테스트 전용 네트워크</span>
      </div>

      {!mounted ? (
        <p>지갑 상태를 확인하고 있습니다.</p>
      ) : !isMetaMaskInstalled ? (
        <div className="wallet-warning">
          <AlertTriangle size={18} />
          <span>
            MetaMask가 필요합니다. 브라우저 확장 프로그램을 설치해 주세요.
          </span>
        </div>
      ) : connection.isConnected ? (
        <>
          <div className="wallet-connected">
            <div>
              <strong>{shortenAddress(connection.address)}</strong>
              <small>
                {connection.chain?.name ?? `Chain ${connection.chainId}`}
              </small>
            </div>
            <button
              className="icon-button"
              onClick={() => disconnect()}
              aria-label="지갑 연결 해제"
            >
              <LogOut size={18} />
            </button>
          </div>
          {wrongNetwork && (
            <div className="wallet-warning">
              <AlertTriangle size={18} />
              <span>Hardhat Local 네트워크로 전환해 주세요.</span>
              <button
                className="button secondary button-small"
                onClick={() => switchChain({ chainId: HARDHAT_CHAIN_ID })}
                disabled={isSwitching}
              >
                {isSwitching ? "전환 중" : "네트워크 전환"}
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          className="button button-primary wallet-connect"
          onClick={() => {
            setError("");
            const connector = connectors.find((item) =>
              item.name.toLowerCase().includes("metamask"),
            );
            if (connector) connect({ connector });
            else setError("MetaMask 연결 정보를 찾지 못했습니다.");
          }}
          disabled={isPending}
        >
          <Wallet size={18} /> {isPending ? "승인 대기 중" : "MetaMask 연결"}
        </button>
      )}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
