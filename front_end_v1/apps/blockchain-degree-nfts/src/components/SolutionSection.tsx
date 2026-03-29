import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Link, Fingerprint } from "lucide-react";
import { TrongDongWatermark } from "./TrongDongPattern";

const SolutionSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-100px" });

  return (
    <section id="solution" className="relative py-32 px-6" ref={ref}>
      <TrongDongWatermark className="[&_svg]:-right-48 [&_svg]:-bottom-48 [&_svg]:top-auto" opacity={0.04} />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.p
          className="font-heading text-primary text-sm tracking-[0.3em] uppercase mb-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          Giải pháp
        </motion.p>
        <motion.h2
          className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Blockchain + NFT = <span className="text-primary">Bất biến</span>
        </motion.h2>
        <motion.p
          className="font-body text-lg text-muted-foreground max-w-3xl mb-20 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Mỗi văn bằng đại học được mã hóa thành một token NFT duy nhất trên blockchain.
          Không thể sao chép, không thể chỉnh sửa, và bất kỳ ai cũng có thể xác thực tính hợp lệ trong vài giây.
        </motion.p>

        <div className="grid md:grid-cols-3 gap-0 border border-border">
          {[
            { icon: Shield, title: "Bảo mật tuyệt đối", desc: "Dữ liệu được mã hóa và phân tán trên toàn mạng lưới blockchain, loại bỏ rủi ro tấn công tập trung." },
            { icon: Link, title: "Minh bạch hoàn toàn", desc: "Mọi giao dịch đều được ghi nhận công khai, cho phép kiểm chứng lịch sử cấp phát và chuyển nhượng văn bằng." },
            { icon: Fingerprint, title: "Độc nhất & Bất biến", desc: "Mỗi NFT mang một mã hash riêng biệt, đảm bảo tính xác thực và không thể bị sửa đổi sau khi phát hành." },
          ].map((item, index) => (
            <motion.div
              key={index}
              className={`p-8 md:p-10 bg-card ${index < 2 ? 'md:border-r border-b md:border-b-0 border-border' : ''}`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.15 }}
            >
              <div className="w-10 h-10 border border-primary flex items-center justify-center mb-6">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-heading text-base text-foreground mb-3">{item.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
