export interface NFTMetadata {
  student_id: string;
  degree_type: string;
  pdf_url: string;
  pdf_hash: string;
  institution: string;
  institution_address: string;
  issued_at: string;
}

export interface NFT {
  token_id: string;
  issuer_pubkey: string;
  recipient_address: string;
  is_valid: boolean;
  minted_at: number;
  metadata: NFTMetadata;
  issuer_signature?: string;
}

export interface CreateNFTRequest {
  issuer_id: string;
  student_id: string;
  degree_type: string;
  pdf_url: string;
  pdf_hash: string;
  institution: string;
  institution_address: string;
  recipient_address: string;
  signature?: string;
  issued_at?: number;
}

export interface VerifyResult {
  token_id: string;
  is_valid: boolean;
  issuer_signature?: string;
  is_revoked: boolean;
}