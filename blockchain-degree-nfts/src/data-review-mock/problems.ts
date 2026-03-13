import { FileWarning, Search, AlertTriangle } from "lucide-react";

export interface Problem {
  icon: React.ElementType;
  title: string;
  description: string;
}

export const problems: Problem[] = [
  {
    icon: FileWarning,
    title: "Giả mạo văn bằng",
    description: "Hàng ngàn văn bằng giả được phát hiện mỗi năm, gây tổn thất uy tín cho các cơ sở giáo dục và nhà tuyển dụng.",
  },
  {
    icon: Search,
    title: "Xác thực tốn kém",
    description: "Quy trình xác minh bằng cấp hiện tại mất nhiều thời gian, chi phí và phụ thuộc vào bên thứ ba.",
  },
  {
    icon: AlertTriangle,
    title: "Thiếu minh bạch",
    description: "Không có hệ thống trung tâm nào cho phép xác thực tức thì và công khai trạng thái của một văn bằng.",
  },
];
