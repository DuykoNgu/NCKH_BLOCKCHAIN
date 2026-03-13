import { useState, useEffect } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  pdfFile: any;
}

// Giới hạn kích thước PDF: 10MB
const MAX_PDF_SIZE = 10 * 1024 * 1024;

export const PDFViewer = ({ pdfFile }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const pageWidth = Math.min(800, window.innerWidth - 32);

  // Kiểm tra kích thước file trước khi load
  useEffect(() => {
    if (pdfFile && typeof pdfFile === 'object' && pdfFile.size) {
      if (pdfFile.size > MAX_PDF_SIZE) {
        setError(`File PDF quá lớn (${(pdfFile.size / 1024 / 1024).toFixed(2)}MB). Vui lòng chọn file nhỏ hơn 10MB.`);
        return;
      }
    }
    setError(null);
  }, [pdfFile]);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const handleDocumentLoadError = (err: Error) => {
    console.error("PDF load error:", err);
    setError("Không thể tải file PDF. File có thể bị corrupt hoặc kích thước quá lớn.");
    setNumPages(null);
  };

  return (
    <>
      {error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive">
          {error}
        </div>
      ) : (
        <Document
          file={pdfFile}
          onLoadSuccess={handleDocumentLoadSuccess}
          onLoadError={handleDocumentLoadError}
          loading={<div className="flex justify-center p-4">Đang tải PDF...</div>}
        >
          <Page pageNumber={pageNumber} width={pageWidth} />
        </Document>
      )}

      {numPages && !error && (
        <>
          <div className="flex items-center gap-4">
            <Button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
            >
              Previous
            </Button>

            <span>
              Page {pageNumber} of {numPages}
            </span>

            <Button
              disabled={pageNumber >= (numPages || 1)}
              onClick={() => setPageNumber((p) => p + 1)}
            >
              Next
            </Button>
            <a href={pdfFile} download>
              <Button variant="outline">Tải xuống</Button>
            </a>
          </div>
        </>
      )}
    </>
  );
};