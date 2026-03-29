# NCKH Blockchain - Front End

Dự án front-end cho nghiên cứu khoa học về Blockchain, sử dụng React và TypeScript.

## Công nghệ sử dụng

- **React**: 19.2.0 - Thư viện JavaScript cho xây dựng giao diện người dùng
- **TypeScript**: 5.9.3 - Ngôn ngữ lập trình với type checking
- **Vite**: Công cụ build và dev server nhanh
- **Axios**: 1.13.2 - Thư viện HTTP client cho API calls
- **ESLint**: Công cụ linting code
- **Node.js Types**: Type definitions cho Node.js

## Cách clone và chạy dự án

### Yêu cầu hệ thống
- Node.js (phiên bản 18 trở lên)
- npm hoặc yarn

### Các bước cài đặt

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd NCKH_BLOCKCHAIN/front_end
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường:**
   Tạo file `.env` trong thư mục `front_end` và thêm:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```
   (Thay đổi URL theo backend server của bạn)

4. **Chạy development server:**
   ```bash
   npm run dev
   ```
   Server sẽ chạy trên `http://localhost:5173`

5. **Build cho production:**
   ```bash
   npm run build
   ```

6. **Preview build:**
   ```bash
   npm run preview
   ```

## Cấu trúc dự án

- `src/`: Source code React
- `configs/`: Cấu hình axios và các config khác
- `public/`: Static assets
- `dist/`: Build output (sau khi build)

## Lệnh hữu ích

- `npm run dev`: Chạy development server
- `npm run build`: Build cho production
- `npm run lint`: Kiểm tra linting
- `npm run preview`: Preview production build
