export const AUTH_SERVER = {
  WALLET_LOGIN: '/users/auth/verify',
  WALLET_REGISTER: '/users/auth/register',
  WALLET_NONCE: '/users/auth/get_nonce',
  PROFILE_UPDATE: '/users/profile/update',
  GET_ALL: '/users/all',
} as const;

export const TRANSACTION_SERVER = {
  GET_ALL: '/transactions/all',
  GET_BY_ADDRESS: '/transactions/address/:address',
} as const;

export const NFT_SERVER = {
  CREATE: '/nft/create',
  GET_BY_ID: '/nft/:tokenId',
  GET_STUDENT_NFTS: '/nft/student/:studentId',
  GET_USER_NFTS: '/nft/user/:recipientAddress',
  GET_ALL: '/nft/all',
  VERIFY: '/nft/:tokenId/verify',
  GET_BY_ISSUER: '/nft/issuer/:issuer_address',
  REVOKE: '/nft/:tokenId/revoke',
  VERIFY_BATCH: '/nft/verify/batch',
  GET_METADATA_HASH: '/nft/:tokenId/metadata-hash',
  BATCH_UPLOAD: '/nft/batch-upload',
} as const;