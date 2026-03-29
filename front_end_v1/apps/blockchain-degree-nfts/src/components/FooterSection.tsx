const FooterSection = () => {
  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <p className="font-heading text-sm text-foreground tracking-wider uppercase">
            BlockDegree<span className="text-primary">_</span>
          </p>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Nghiên cứu ứng dụng Blockchain & NFT cho xác thực văn bằng
          </p>
        </div>
        <p className="font-body text-xs text-muted-foreground">
          © 2026 — Đề tài nghiên cứu
        </p>
      </div>
    </footer>
  );
};

export default FooterSection;
