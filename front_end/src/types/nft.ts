export interface NFTMetadata {
  student_id: string;
  degree_type: string;
  pdf_url: string;
  pdf_hash: string;
  institution: string;
}

export interface NFT {
  token_id: string;
  issuer_pubkey: string;
  recipient_address: string;
  is_valid: boolean;
  minted_at: string;
  metadata?: NFTMetadata;
  issuer_signature?: string;
}

export interface CreateNFTRequest {
  issuer_id: string;
  student_id: string;
  degree_type: string;
  pdf_url: string;
  institution: string;
  recipient_address: string;
  issuer_private_key?: string;
}

export interface VerifyResult {
  token_id: string;
  is_valid: boolean;
  issuer_signature?: string;
  is_revoked: boolean;
}