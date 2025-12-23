import { useState } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import pdfFile from "@/assets/[JD] Vị trí TTS_FE.pdf";
import { Button } from "@/components/ui/button";

export const PDF_Preview = () => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const pageWidth = Math.min(800, window.innerWidth - 32);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* PDF */}
      <div className="w-full max-w-[800px]">
        <Document
          file={pdfFile}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          <Page pageNumber={pageNumber} width={pageWidth} />
        </Document>
      </div>

      {/* Controls */}
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
      </div>
    </div>
  );
};
