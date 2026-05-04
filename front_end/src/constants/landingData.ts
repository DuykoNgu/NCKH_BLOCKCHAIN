import { 
  ShieldAlert, 
  Search, 
  FileWarning, 
  UserCheck, 
  Database, 
  Globe, 
  Zap, 
  Lock, 
  CheckCircle, 
} from "lucide-react";

export const problems = [
  {
    icon: ShieldAlert,
    title: "Vấn nạn bằng giả",
    description: "Công nghệ in ấn hiện đại khiến bằng cấp giả mạo ngày càng tinh vi, khó phân biệt bằng mắt thường, gây tổn hại uy tín giáo dục."
  },
  {
    icon: Search,
    title: "Xác minh chậm trễ",
    description: "Quy trình xác minh bằng cấp truyền thống qua bưu điện hoặc liên hệ nhà trường mất nhiều tuần, làm chậm trễ cơ hội nghề nghiệp."
  },
  {
    icon: FileWarning,
    title: "Dữ liệu thiếu tập trung",
    description: "Hệ thống lưu trữ hồ sơ rời rạc giữa các trường khiến việc tra cứu và quản lý văn bằng ở cấp quốc gia gặp nhiều khó khăn."
  }
];

export const steps = [
  {
    number: "01",
    title: "Mã hóa văn bằng",
    description: "Trường đại học tải lên dữ liệu văn bằng, hệ thống sẽ thực hiện băm nội dung (hash) để tạo ra định danh duy nhất."
  },
  {
    number: "02",
    title: "Ký số & Phát hành",
    description: "Nhà trường sử dụng khóa bí mật (Private Key) để ký số vào văn bằng, sau đó đúc (mint) thành một NFT trên Blockchain."
  },
  {
    number: "03",
    title: "Lưu trữ vĩnh viễn",
    description: "Dữ liệu được ghi vào sổ cái phân tán, đảm bảo tính bất biến. Sinh viên nhận quyền sở hữu văn bằng trong ví kỹ thuật số."
  },
  {
    number: "04",
    title: "Xác thực tức thì",
    description: "Nhà tuyển dụng chỉ cần quét mã hoặc kiểm tra địa chỉ NFT để xác minh tính chính danh của bằng cấp trong vài giây."
  }
];

export const benefits = [
  {
    icon: Lock,
    title: "Bảo mật tuyệt đối",
    desc: "Công nghệ mã hóa đường cong Elliptic (ECDSA) đảm bảo dữ liệu không thể bị giả mạo."
  },
  {
    icon: Zap,
    title: "Tốc độ vượt trội",
    desc: "Xác thực bằng cấp ngay lập tức thông qua mạng lưới Blockchain toàn cầu 24/7."
  },
  {
    icon: CheckCircle,
    title: "Độ tin cậy cao",
    desc: "Dữ liệu được xác thực bởi nhiều nút mạng (PoA), loại bỏ rủi ro sai sót con người."
  },
  {
    icon: Database,
    title: "Lưu trữ trọn đời",
    desc: "Văn bằng tồn tại mãi mãi trên Blockchain, không lo thất lạc hay hư hỏng vật lý."
  },
  {
    icon: UserCheck,
    title: "Chủ quyền dữ liệu",
    desc: "Sinh viên hoàn toàn kiểm soát và dễ dàng chia sẻ bằng cấp của mình với bất kỳ ai."
  },
  {
    icon: Globe,
    title: "Tiêu chuẩn quốc tế",
    desc: "Sử dụng tiêu chuẩn NFT giúp bằng cấp dễ dàng được công nhận rộng rãi trên thế giới."
  }
];
