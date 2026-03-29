import pdfFile from "@/assets/[JD] Vị trí TTS_FE.pdf";
import { CollapsibleContent } from "./CollapsibleContent";
import { PDFViewer } from "./PDFViewer";

export const PDF_Preview = () => {
  return (
    <CollapsibleContent title="Chứng chỉ dạng PDF">
      <PDFViewer pdfFile={pdfFile} />
    </CollapsibleContent>
  );
};
