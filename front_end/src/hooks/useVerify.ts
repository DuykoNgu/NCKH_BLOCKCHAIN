import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { NFTService } from "@/services/nftService";
import { toast } from "sonner";

export type VerifyStatus = "verified" | "invalid" | "pending" | "revoked";

export const useVerify = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VerifyStatus | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const nftRes = await NFTService.getNFT(tokenId);
      if ("error" in nftRes) {
        throw new Error("Không tìm thấy bằng cấp!");
      }
      const verifyRes = await NFTService.verifyNFT(tokenId);
      return { nft: nftRes.nft, verifyResult: verifyRes };
    },
    onSuccess: (data) => {
      if (data.verifyResult.is_revoked) setStatus("revoked");
      else if (data.verifyResult.is_valid) setStatus("verified");
      else setStatus("pending");
      toast.success("Xác thực hoàn tất!");
    },
    onError: (error: any) => {
      setStatus("invalid");
      toast.error(error.message || "Có lỗi xảy ra khi xác thực");
    }
  });

  const handleVerify = async () => {
    if (!query.trim()) {
      toast.error("Vui lòng nhập Mã chứng chỉ (Token ID)");
      return;
    }
    verifyMutation.mutate(query.trim());
  };

  return {
    query,
    setQuery,
    status,
    loading: verifyMutation.isPending,
    nft: verifyMutation.data?.nft || null,
    verifyResult: verifyMutation.data?.verifyResult || null,
    handleVerify
  };
};
