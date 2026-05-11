import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BlockchainCommitmentModalProps {
  onConfirm: () => void;
  isLoading?: boolean;
}

const BlockchainCommitmentModal = ({
  onConfirm,
  isLoading = false
}: BlockchainCommitmentModalProps) => {
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const handleDownloadPDF = () => {
    try {
      const link = document.createElement('a');
      link.href = '/Ban_Cam_Ket_Blockchain.pdf';
      link.download = 'Ban_Cam_Ket_Blockchain.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setHasDownloaded(true);
      toast.success('File cam kêt đã được tải xuống');
    } catch {
      toast.error('Không thể tải file. Vui lòng thử lại.');
    }
  };

  const handleOpenPdfPreview = () => {
    setShowPdfPreview(true);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* PDF Preview Modal */}
      {showPdfPreview && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between bg-slate-900 p-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Bản Cam Kêt Blockchain
            </h3>
            <button
              onClick={() => setShowPdfPreview(false)}
              className="text-white hover:text-gray-300 text-2xl font-light"
            >
              ✕
            </button>
          </div>
          <iframe
            src="/Ban_Cam_Ket_Blockchain.pdf"
            className="flex-1 w-full"
            style={{ border: 'none' }}
          />
          <div className="bg-slate-900 p-4 flex gap-3">
            <Button
              onClick={() => setShowPdfPreview(false)}
              variant="outline"
              className="flex-1"
            >
              Đóng
            </Button>
            <Button
              onClick={handleDownloadPDF}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Tải xuống
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div
        className="glass-card rounded-2xl p-8 shadow-[0_8px_40px_-12px_hsla(0,0%,0%,0.3)] max-w-md mx-4 w-full"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <AlertCircle className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Bản Cam Kêt Blockchain
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Khi đăng ký, hệ thống sẽ chuẩn bị file chưa có chữ ký số đầy đủ. Bạn cần tải xuống, ký số và gửi lại để hoàn tất quá trình đăng ký.
            </p>
          </div>

          {/* PDF Document Preview */}
          <div
            className="p-4 rounded-xl bg-secondary/50 border border-border/50 cursor-pointer hover:border-primary/50 hover:bg-secondary/70 transition-all flex items-center gap-3"
            onClick={handleOpenPdfPreview}
          >
            <FileText className="w-6 h-6 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Ban_Cam_Ket_Blockchain.pdf</p>
              <p className="text-xs text-muted-foreground">Nhấp để xem toàn bộ nội dung</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>

          {/* Info Box */}
          <div className="space-y-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-xs text-amber-700 font-medium">
                File sẽ được mã hóa và bảo mật trên blockchain
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-xs text-amber-700 font-medium">
                Chỉ người đại diện pháp luật có quyền ký số trên file này
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <span className="text-xs text-amber-700 font-medium">
                Hợp đồng cam kêt hợp lệ khi đã ký số hoàn chỉnh
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleDownloadPDF}
              disabled={isLoading}
              variant="outline"
              className="h-11 rounded-xl font-medium text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Tải file về để ký
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="h-11 rounded-xl font-semibold text-sm shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Đã rõ
                </>
              )}
            </Button>
            {hasDownloaded && (
              <p className="text-xs text-center text-primary font-medium">
                ✓ File đã được tải xuống
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BlockchainCommitmentModal;
