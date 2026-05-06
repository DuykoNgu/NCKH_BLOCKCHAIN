import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NFTService } from "@/services/nftService";
import type { CreateNFTRequest } from "@/services/nftService";
import { toast } from "sonner";

export const useAllNFTs = () => {
  return useQuery({
    queryKey: ["nfts", "all"],
    queryFn: () => NFTService.getAllNFTs(),
  });
};

export const useUserNFTs = (account: string) => {
  return useQuery({
    queryKey: ["nfts", "user", account],
    queryFn: () => NFTService.getUserNFTs(account),
    enabled: !!account,
  });
};

export const useNFTDetail = (tokenId: string) => {
  return useQuery({
    queryKey: ["nfts", "detail", tokenId],
    queryFn: async () => {
      const response = await NFTService.getNFT(tokenId);
      if ("error" in response) throw new Error(response.error);
      return response.nft;
    },
    enabled: !!tokenId,
  });
};

export const useMetadataHash = (tokenId: string) => {
  return useQuery({
    queryKey: ["nfts", "metadata-hash", tokenId],
    queryFn: () => NFTService.getMetadataHash(tokenId),
    enabled: !!tokenId,
  });
};

export const useVerifyNFT = (tokenId: string) => {
  return useQuery({
    queryKey: ["nfts", "verify", tokenId],
    queryFn: () => NFTService.verifyNFT(tokenId),
    enabled: !!tokenId,
  });
};

export const useMintNFT = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateNFTRequest) => NFTService.createNFT(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["nfts"] });
        toast.success("Cấp phát chứng chỉ thành công!");
      } else {
        toast.error(response.error || "Có lỗi xảy ra khi cấp phát");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi kết nối máy chủ");
    }
  });
};

export const useRevokeNFT = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tokenId: string) => NFTService.revokeNFT(tokenId),
    onSuccess: (response) => {
      if (response.message) {
        queryClient.invalidateQueries({ queryKey: ["nfts"] });
        toast.success("Đã thu hồi chứng chỉ thành công");
      } else {
        toast.error(response.error || "Không thể thu hồi chứng chỉ");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi kết nối máy chủ");
    }
  });
};
