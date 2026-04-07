import { useState, useEffect } from "react";
import { CollapsibleSection as CollapsibleContent } from "../dashboard/CollapsibleSection";
import { PDFViewer } from "./PDFViewer";
import { useAuth } from "@/hooks/useAuth";
import { NFTService } from "@/services/nftService";

export const PDFPreview = () => {
  const { isUser, isValidator } = useAuth();
  const address = localStorage.getItem("address") || "";
  const [pdfs, setPdfs] = useState<{ name: string; url: string; tokenId: string }[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPDFs = async () => {
      if (!address) return;
      setIsLoading(true);
      try {
        if (isValidator) {
          // Trường học: lấy các NFT do trường cấp
          const res = await NFTService.getAllNFTs();
          const nfts = res.nfts?.filter(n => n.metadata?.institution_address === address) || [];
          setPdfs(nfts.map(n => ({
            name: `${n.metadata?.degree_type || "Chứng chỉ"} - ${n.token_id.slice(0, 8)}`,
            url: n.metadata?.pdf_url || "",
            tokenId: n.token_id
          })).filter(p => p.url));
        } else if (isUser) {
          // Học sinh: lấy các NFT của mình
          const res = await NFTService.getUserNFTs(address);
          setPdfs((res.nfts || []).map(n => ({
            name: `${n.metadata?.degree_type || "Chứng chỉ"} - ${n.metadata?.institution || n.metadata?.institution_address?.slice(0, 8)}`,
            url: n.metadata?.pdf_url || "",
            tokenId: n.token_id
          })).filter(p => p.url));
        }
      } catch (err) {
        console.error("Failed to fetch PDFs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPDFs();
  }, [address, isValidator, isUser]);

  return (
    <CollapsibleContent title={isValidator ? "Các bằng cấp đã xuất (PDF)" : "Chứng chỉ dạng PDF"}>
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground p-4 text-center">Đang tải danh sách PDF...</p>
        ) : pdfs.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">Không có file PDF nào</p>
        ) : (
          <div className="flex gap-2 flex-wrap mb-4">
            {pdfs.map((pdf) => (
              <button
                key={pdf.tokenId}
                onClick={() => setSelectedPdf(pdf.url)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  selectedPdf === pdf.url 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                }`}
              >
                {pdf.name}
              </button>
            ))}
          </div>
        )}
        
        {selectedPdf && (
          <div className="border border-border/50 rounded-lg overflow-hidden">
            <PDFViewer pdfFile={selectedPdf} />
          </div>
        )}
      </div>
    </CollapsibleContent>
  );
};