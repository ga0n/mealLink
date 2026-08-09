"use client";

import { useReadContract } from "wagmi";
import { CAMPAIGN_ID, mealLinkAbi } from "@/lib/web3/contract";
import { CONTRACT_ADDRESS, IS_DEMO_MODE } from "@/lib/web3/mode";

export function useOnchainCampaign() {
  const enabled = !IS_DEMO_MODE && Boolean(CONTRACT_ADDRESS);
  const stats = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: mealLinkAbi,
    functionName: "getCampaignStats",
    args: [CAMPAIGN_ID],
    query: { enabled, refetchInterval: 4_000, retry: 1 },
  });
  const campaign = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: mealLinkAbi,
    functionName: "getCampaign",
    args: [CAMPAIGN_ID],
    query: { enabled, refetchInterval: 4_000, retry: 1 },
  });

  const values = stats.data;
  return {
    campaign: campaign.data,
    stats: values
      ? {
          donated: Number(values[0]),
          redeemed: Number(values[1]),
          waiting: Number(values[2]),
          issued: Number(values[3]),
          availableToIssue: Number(values[4]),
        }
      : undefined,
    isLoading: stats.isLoading || campaign.isLoading,
    error: stats.error ?? campaign.error,
    refetch: async () => {
      await Promise.all([stats.refetch(), campaign.refetch()]);
    },
  };
}
