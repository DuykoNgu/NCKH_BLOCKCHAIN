export const AUTH_SERVER = {
  WALLET_LOGIN: '/auth/wallet/login',
  WALLET_REGISTER: '/auth/wallet/register',
  WALLET_NONCE: '/auth/nonce',
} as const;

export const NFT_SERVER = {
  CREATE: '/create',
  GET_BY_ID: '/:tokenId',
  GET_STUDENT_NFTS: '/student/:studentId',
  GET_USER_NFTS: '/user/:recipientAddress',
  GET_ALL: '/all',
  VERIFY: '/:tokenId/verify',
  REVOKE: '/:tokenId/revoke',
  VERIFY_BATCH: '/verify/batch',
  GET_METADATA_HASH: '/:tokenId/metadata-hash',
} as const;