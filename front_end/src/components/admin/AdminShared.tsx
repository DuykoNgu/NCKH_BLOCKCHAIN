import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// Shared Page Header
interface AdminPageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({ title, description, children }) => (
  <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {children}
  </motion.div>
);

// Shared Stat Card
interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  bgColor?: string;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({ label, value, icon: Icon, iconColor, bgColor }) => (
  <Card className="glass-card border-none shadow-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", bgColor || "bg-primary/20")}>
        <Icon className={cn("h-5 w-5", iconColor || "text-primary")} />
      </div>
      <div>
        <p className="text-2xl font-bold font-display text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

// Motion Wrapper
export const AdminPageContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="show"
    className={cn("space-y-6", className)}
  >
    {children}
  </motion.div>
);
