import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { steps } from "@/data-review-mock";

const ProcessSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-100px" });

  return (
    <section id="process" className="relative py-32 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.p
          className="font-heading text-primary text-sm tracking-[0.3em] uppercase mb-4 text-glow"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          Quy trình
        </motion.p>
        <motion.h2
          className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Văn bằng NFT hoạt động
          <br />
          <span className="text-primary text-glow">như thế nào?</span>
        </motion.h2>

        <div className="relative">
          {/* Chain line */}
          <motion.div
            className="absolute left-6 top-0 bottom-0 chain-line z-0"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
          />

          <div className="space-y-16 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative flex items-start gap-8 pl-16"
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
              >
                {/* Node on the chain */}
                <div className="absolute left-[14px] top-1 w-5 h-5 border-2 border-primary bg-background flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary animate-pulse-glow" />
                </div>

                <div>
                  <span className="font-heading text-primary text-xs tracking-[0.3em] text-glow">{step.number}</span>
                  <h3 className="font-heading text-xl text-foreground mt-1 mb-3">{step.title}</h3>
                  <p className="font-body text-muted-foreground leading-relaxed max-w-lg">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
