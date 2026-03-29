import { motion } from "framer-motion";
import { TrongDongWatermark } from "./TrongDongPattern";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  const handleRedirect = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      navigate("/login");
    }, 800);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <TrongDongWatermark opacity={0.06} />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <p className="font-heading text-primary text-sm tracking-[0.3em] uppercase mb-8">
            Blockchain · NFT · Xác thực
          </p>
        </motion.div>

        <motion.h1
          className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        >
          Xác Thực Bằng Đại Học
          <br />
          <span className="text-primary">Dưới Dạng NFT</span>
        </motion.h1>

        <motion.p
          className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        >
          Nghiên cứu và xây dựng ứng dụng công nghệ Blockchain để lưu trữ và xác thực
          văn bằng đại học — bất biến, minh bạch và không thể giả mạo.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        >
          <a href="#solution" className="inline-block bg-primary text-primary-foreground font-heading text-sm tracking-wider uppercase px-8 py-4 hover:opacity-90 transition-opacity">
            Tìm Hiểu Thêm
          </a>
          <button 
            onClick={handleRedirect}
            disabled={isRedirecting}
            className="inline-block border border-foreground text-foreground font-heading text-sm tracking-wider uppercase px-8 py-4 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang chuyển...
              </>
            ) : (
              "Truy Cập App"
            )}
          </button>
          <a href="#process" className="inline-block border border-foreground text-foreground font-heading text-sm tracking-wider uppercase px-8 py-4 hover:border-primary hover:text-primary transition-colors">
            Quy Trình
          </a>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 chain-line h-24"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1, delay: 1.2, ease: "easeOut" }}
        style={{ transformOrigin: "top" }}
      />
    </section>
  );
};

export default HeroSection;
