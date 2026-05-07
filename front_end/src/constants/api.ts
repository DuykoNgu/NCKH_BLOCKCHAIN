export const AUTH_SERVER = {
  WALLET_LOGIN: '/users/auth/verify',
  WALLET_REGISTER: '/users/auth/register',
  WALLET_NONCE: '/users/auth/get_nonce',
  PROFILE_UPDATE: '/users/profile/update',
  GET_ALL: '/users/all',
  GET_PROFILE: '/users/profile/:address',
  GET_PENDING_VALIDATORS: '/users/validators/pending',
  APPROVE_VALIDATOR: '/users/validators/approve',
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
  REVOKE: '/nft/:tokenId/revoke',
  VERIFY_BATCH: '/nft/verify/batch',
  BATCH_UPLOAD: '/nft/batch/upload',
  GET_METADATA_HASH: '/nft/:tokenId/metadata-hash',
} as const;

export const BLOCK_SERVER = {
  GET_ALL: '/block/all',
  GET_LATEST: '/block/latest',
  GET_BY_ID: '/block/:blockId',
  GET_BY_INDEX: '/block/index/:index',
  COUNT: '/block/count',
  RANGE: '/block/range',
} as const;

export const NETWORK_SERVER = {
  HEALTH: '/network/health',
  PEERS: '/network/peers',
  STATS: '/network/stats',
  SLOT_INFO: '/network/consensus/slot',
  PENDING_PEERS: '/network/peers/pending',
  APPROVE_PEER: '/network/peers/:peerId/approve',
  REGISTER_PEER: '/network/peers/register',
} as const;