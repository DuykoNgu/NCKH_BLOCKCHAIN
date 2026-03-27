interface StatsCardProps {
  title: string;
  value: string;
  icon: any;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
}: StatsCardProps) => {
  return (
    <div className="glass-card p-5 rounded-2xl group border hover:!border-primary transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
};

