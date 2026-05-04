import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { benefits } from "@/constants/landingData";

const BenefitsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-100px" });

  return (
    <section className="relative py-32 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.p
          className="font-heading text-primary text-sm tracking-[0.3em] uppercase mb-4 text-glow"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          Lợi ích
        </motion.p>
        <motion.h2
          className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Giá trị cốt lõi
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border border-border">
          {benefits.map((benefit: any, index: number) => (
            <motion.div
              key={index}
              className="p-8 bg-card border-b border-r border-border last:border-r-0 [&:nth-child(3n)]:border-r-0 [&:nth-last-child(-n+3)]:border-b-0"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <benefit.icon className="w-5 h-5 text-primary mb-4" />
              <h3 className="font-heading text-sm text-foreground mb-2">{benefit.title}</h3>
              <p className="font-body text-sm text-muted-foreground">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
