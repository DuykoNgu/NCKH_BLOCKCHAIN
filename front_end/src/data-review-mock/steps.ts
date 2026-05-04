export interface Step {
  number: string;
  title: string;
  description: string;
}

export const steps: Step[] = [
  {
    number: "01",
    title: "Cấp phát văn bằng",
    description: "Trường đại học nhập thông tin văn bằng vào hệ thống. Dữ liệu được mã hóa và chuẩn bị để ghi lên blockchain.",
  },
  {
    number: "02",
    title: "Mint NFT",
    description: "Hệ thống tạo một token NFT duy nhất chứa toàn bộ thông tin văn bằng, gắn liền với mã hash không thể trùng lặp.",
  },
  {
    number: "03",
    title: "Ghi lên Blockchain",
    description: "NFT được ghi lên mạng blockchain, trở thành bản ghi vĩnh viễn, công khai và không thể chỉnh sửa.",
  },
  {
    number: "04",
    title: "Xác thực tức thì",
    description: "Nhà tuyển dụng hoặc bất kỳ ai có thể quét mã hoặc nhập hash để xác minh tính hợp lệ của văn bằng trong vài giây.",
  },
];
