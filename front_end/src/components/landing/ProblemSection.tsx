import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { problems } from "@/data-review-mock";

const ProblemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-100px" });

  return (
    <section className="relative py-32 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.p
          className="font-heading text-primary text-sm tracking-[0.3em] uppercase mb-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
        >
          Vấn đề
        </motion.p>
        <motion.h2
          className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Tại sao cần thay đổi?
        </motion.h2>

        <div className="space-y-12">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-6 md:gap-10 p-8 bg-card border border-border"
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.15 }}
            >
              <div className="flex-shrink-0 w-12 h-12 border border-primary flex items-center justify-center">
                <problem.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-foreground mb-2">{problem.title}</h3>
                <p className="font-body text-muted-foreground leading-relaxed">{problem.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
