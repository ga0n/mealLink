"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { AlertTriangle, ExternalLink, LogOut, Wallet } from "lucide-react";
import {
  useBalance,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import {
  ACTIVE_CHAIN_ID,
  ACTIVE_NETWORK_NAME,
  IS_SEPOLIA,
} from "@/lib/web3/config";
import { getWeb3ErrorMessage } from "@/lib/web3/errors";
import {
  getPublicConfigurationError,
  IS_DEMO_MODE,
  MODE_LABEL,
} from "@/lib/web3/mode";
import { shortenAddress } from "@/lib/web3/accounts";
import { addressExplorerUrl, transactionExplorerUrl } from "@/lib/web3/links";
import {
  latestActiveTransaction,
  type StoredTransaction,
  updateStoredTransaction,
} from "@/lib/web3/pending";

export function WalletPanel() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [recentTransaction, setRecentTransaction] =
    useState<StoredTransaction>();
  const connection = useConnection();
  const connectors = useConnectors();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN_ID });
  const balance = useBalance({
    address: connection.address,
    chainId: ACTIVE_CHAIN_ID,
    query: { enabled: connection.isConnected },
  });
  const { connect, isPending } = useConnect({
    mutation: { onError: (reason) => setError(getWeb3ErrorMessage(reason)) },
  });
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain({
    mutation: { onError: (reason) => setError(getWeb3ErrorMessage(reason)) },
  });

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (IS_DEMO_MODE || !publicClient) return;
    const stored = latestActiveTransaction();
    setRecentTransaction(stored);
    if (!stored || stored.status !== "pending") return;
    let active = true;
    const checkReceipt = async () => {
      try {
        const receipt = await publicClient.getTransactionReceipt({
          hash: stored.hash,
        });
        if (!active) return;
        const status = receipt.status === "success" ? "confirmed" : "failed";
        updateStoredTransaction(stored.hash, status, receipt.blockNumber);
        setRecentTransaction({
          ...stored,
          status,
          blockNumber: receipt.blockNumber.toString(),
        });
      } catch (reason) {
        const message =
          reason instanceof Error ? reason.message : String(reason);
        if (!message.toLowerCase().includes("not found") && active) {
          setError(getWeb3ErrorMessage(reason));
        }
      }
    };
    void checkReceipt();
    const interval = window.setInterval(checkReceipt, 6_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [publicClient]);

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
    connection.isConnected && connection.chainId !== ACTIVE_CHAIN_ID;
  const configurationError = getPublicConfigurationError();
  const addressLink = addressExplorerUrl(connection.address);
  const transactionLink = transactionExplorerUrl(recentTransaction?.hash);

  return (
    <section className="wallet-panel" aria-label="지갑 연결">
      <div className="wallet-panel-heading">
        <span className={`mode-chip ${IS_SEPOLIA ? "sepolia" : "local"}`}>
          {MODE_LABEL}
        </span>
        <span className="testnet-label">
          {IS_SEPOLIA
            ? "Sepolia 테스트넷 · 실제 결제가 아닙니다"
            : "테스트 전용 로컬 네트워크"}
        </span>
      </div>
      {configurationError && (
        <div className="wallet-warning">
          <AlertTriangle size={18} /> <span>{configurationError}</span>
        </div>
      )}

      {!mounted ? (
        <p>지갑 상태를 확인하고 있습니다.</p>
      ) : !isMetaMaskInstalled ? (
        <div className="wallet-warning">
          <AlertTriangle size={18} />
          <span>MetaMask 브라우저 확장 프로그램을 설치해 주세요.</span>
        </div>
      ) : connection.isConnected ? (
        <>
          <div className="wallet-connected">
            <div>
              {addressLink ? (
                <a href={addressLink} target="_blank" rel="noreferrer">
                  <strong>{shortenAddress(connection.address)}</strong>{" "}
                  <ExternalLink size={12} />
                </a>
              ) : (
                <strong>{shortenAddress(connection.address)}</strong>
              )}
              <small>
                {connection.chain?.name ?? `Chain ${connection.chainId}`} ·{" "}
                {balance.data
                  ? `${Number(formatEther(balance.data.value)).toFixed(4)} ETH`
                  : "잔액 조회 중"}
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
              <span>{ACTIVE_NETWORK_NAME} 네트워크로 전환해 주세요.</span>
              <button
                className="button secondary button-small"
                onClick={() => switchChain({ chainId: ACTIVE_CHAIN_ID })}
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

      {recentTransaction && (
        <div className={`recovered-transaction ${recentTransaction.status}`}>
          <span>
            최근 {recentTransaction.action} 트랜잭션 ·{" "}
            {recentTransaction.status === "pending"
              ? "블록 확정 대기 중"
              : recentTransaction.status === "confirmed"
                ? `확정됨${recentTransaction.blockNumber ? ` · #${recentTransaction.blockNumber}` : ""}`
                : "실패"}
          </span>
          {transactionLink && (
            <a href={transactionLink} target="_blank" rel="noreferrer">
              Etherscan <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
      {recentTransaction?.status === "pending" && (
        <p>
          네트워크가 느릴 수 있습니다. 실패로 단정하지 말고 이 화면에서 확정을
          기다려 주세요.
        </p>
      )}
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
