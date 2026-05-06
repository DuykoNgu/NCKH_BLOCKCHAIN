import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export const NFT_STATUS_CONFIG = {
  verified: { 
    label: "Đã xác thực", 
    icon: CheckCircle2, 
    className: "bg-green-400/10 text-green-400 border-green-400/20" 
  },
  pending: { 
    label: "Đang chờ", 
    icon: Clock, 
    className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" 
  },
  rejected: { 
    label: "Từ chối", 
    icon: XCircle, 
    className: "bg-destructive/10 text-destructive border-destructive/20" 
  },
  revoked: { 
    label: "Đã thu hồi", 
    icon: XCircle, 
    className: "bg-destructive/10 text-destructive border-destructive/20" 
  },
} as const;

export const PEER_STATUS_CONFIG = {
  ACTIVE: { 
    label: "Hoạt động", 
    icon: CheckCircle2, 
    className: "bg-green-400/10 text-green-400 border-green-400/20" 
  },
  PENDING: { 
    label: "Đang chờ", 
    icon: AlertCircle, 
    className: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20" 
  },
  INACTIVE: { 
    label: "Ngừng hoạt động", 
    icon: XCircle, 
    className: "bg-destructive/10 text-destructive border-destructive/20" 
  },
} as const;

export const ROLE_CONFIG = {
  moet: { 
    label: "MOET", 
    className: "bg-purple-400/10 text-purple-400 border-purple-400/20" 
  },
  validator: { 
    label: "Validator", 
    className: "bg-blue-400/10 text-blue-400 border-blue-400/20" 
  },
  client: { 
    label: "Client", 
    className: "bg-gray-400/10 text-gray-400 border-gray-400/20" 
  },
} as const;

export const VERIFY_STATUS_DISPLAY = {
  verified: { 
    label: "✅ Bằng cấp hợp lệ", 
    className: "border-green-400/30 bg-green-400/5", 
    icon: CheckCircle2, 
    color: "text-green-400" 
  },
  pending: { 
    label: "⏳ Đang chờ xác thực", 
    className: "border-yellow-400/30 bg-yellow-400/5", 
    icon: Clock, 
    color: "text-yellow-400" 
  },
  invalid: { 
    label: "❌ Không tìm thấy", 
    className: "border-destructive/30 bg-destructive/5", 
    icon: XCircle, 
    color: "text-destructive" 
  },
  revoked: { 
    label: "🚫 Đã bị thu hồi", 
    className: "border-destructive/30 bg-destructive/5", 
    icon: XCircle, 
    color: "text-destructive" 
  },
} as const;
