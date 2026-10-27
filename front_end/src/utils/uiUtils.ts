import { NFT_STATUS_CONFIG, ROLE_CONFIG, PEER_STATUS_CONFIG, VERIFY_STATUS_DISPLAY } from "@/constants/ui";

export const getRoleInfo = (role: string) => {
  return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.client;
};

export const getNftStatusConfig = (status: string) => {
  return NFT_STATUS_CONFIG[status as keyof typeof NFT_STATUS_CONFIG] || NFT_STATUS_CONFIG.pending;
};

export const getPeerStatusConfig = (status: string) => {
  return PEER_STATUS_CONFIG[status as keyof typeof PEER_STATUS_CONFIG] || PEER_STATUS_CONFIG.PENDING;
};

export const getVerifyStatusConfig = (status: string) => {
  return VERIFY_STATUS_DISPLAY[status as keyof typeof VERIFY_STATUS_DISPLAY] || VERIFY_STATUS_DISPLAY.invalid;
};
