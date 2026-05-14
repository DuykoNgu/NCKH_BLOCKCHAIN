import { GraduationCap, Shield, Copy, FileText, ExternalLink, Download, XCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface DegreeDetailModalProps {
  degree: any;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (pdfUrl: string, filename: string) => void;
}

export function DegreeDetailModal({ degree, isOpen, onClose, onDownload }: DegreeDetailModalProps) {
  if (!degree) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl glass-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-xl font-bold">
            <GraduationCap className="h-6 w-6 text-primary" />
            Thông tin Bằng cấp chi tiết
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Loại bằng</p>
              <p className="font-bold text-foreground text-lg leading-tight">{degree.degree || degree.metadata?.degree_type}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Trạng thái xác thực</p>
              <div className="mt-1">
                {degree.is_valid === false ? (
                  <Badge className="bg-destructive/20 text-destructive border-destructive/30 rounded-full px-3">
                    <XCircle className="h-3 w-3 mr-1.5" /> Đã thu hồi
                  </Badge>
                ) : (
                  <Badge className="bg-green-400/20 text-green-400 border-green-400/20 rounded-full px-3">
                    <CheckCircle2 className="h-3 w-3 mr-1.5" /> Đã xác thực
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Tổ chức cấp phát</p>
              <p className="font-bold text-foreground">{degree.university || degree.metadata?.institution || "N/A"}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Ngày cấp phát</p>
              <p className="font-bold text-foreground">{degree.date}</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-4">
            <div className="p-5 rounded-[24px] bg-secondary/30 border border-border/50 space-y-3 group hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <Shield className="h-3 w-3 text-primary" /> Token ID
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-xl hover:bg-primary/10" 
                  onClick={() => {
                    navigator.clipboard.writeText(degree.id || degree.tokenId);
                    toast.success("Đã sao chép Token ID");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="font-mono text-xs text-primary break-all font-bold tracking-tight">{degree.id || degree.tokenId}</p>
            </div>

            <div className="p-5 rounded-[24px] bg-secondary/30 border border-border/50 space-y-3 group hover:border-primary/30 transition-colors">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                   <FileText className="h-3 w-3 text-primary" /> Certificate Metadata Hash
                 </div>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-8 w-8 rounded-xl hover:bg-primary/10" 
                   onClick={() => {
                     navigator.clipboard.writeText(degree.metadata?.hash || "0x...");
                     toast.success("Đã sao chép Hash");
                   }}
                 >
                   <Copy className="h-3.5 w-3.5" />
                 </Button>
               </div>
               <p className="font-mono text-xs text-foreground/50 break-all font-bold tracking-tight">
                 {degree.metadata?.hash || "0x5ea50147556f8f4838b0058b292f706e236531d0446777646546313133313337"}
               </p>
            </div>
          </div>

          {(degree.pdf_url || degree.metadata?.pdf_url) && (
            <div className="flex items-center justify-between p-5 rounded-[24px] bg-primary/5 border border-primary/10 shadow-sm shadow-primary/5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">File bằng cấp PDF</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Original Document</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all" asChild>
                  <a href={degree.pdf_url || degree.metadata.pdf_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Xem
                  </a>
                </Button>
                <Button size="sm" className="rounded-xl h-10 px-4 gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95" onClick={() => onDownload(degree.pdf_url || degree.metadata.pdf_url, `certificate_${degree.id || degree.tokenId}.pdf`)}>
                  <Download className="h-4 w-4" /> Tải về
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={onClose} className="rounded-xl px-10 h-12 font-bold uppercase tracking-widest text-xs">Đóng</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
