import { Lock, Zap, Globe, Database, Clock, CheckCircle2 } from "lucide-react";

export interface Benefit {
  icon: React.ElementType;
  title: string;
  desc: string;
}

export const benefits: Benefit[] = [
  { icon: Lock, title: "Chống giả mạo", desc: "Loại bỏ hoàn toàn khả năng làm giả văn bằng" },
  { icon: Zap, title: "Xác thực tức thì", desc: "Kiểm tra tính hợp lệ chỉ trong vài giây" },
  { icon: Globe, title: "Truy cập toàn cầu", desc: "Xác thực từ bất kỳ đâu trên thế giới" },
  { icon: Database, title: "Lưu trữ vĩnh viễn", desc: "Dữ liệu tồn tại mãi mãi trên blockchain" },
  { icon: Clock, title: "Tiết kiệm thời gian", desc: "Giảm quy trình xác minh từ tuần xuống giây" },
  { icon: CheckCircle2, title: "Minh bạch 100%", desc: "Mọi giao dịch đều có thể kiểm chứng" },
];
