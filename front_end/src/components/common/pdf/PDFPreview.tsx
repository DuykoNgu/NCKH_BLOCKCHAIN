// import pdfFile from "@/assets/[JD] Vị trí TTS_FE.pdf";
import { CollapsibleSection as CollapsibleContent } from "../dashboard/CollapsibleSection";
import { PDFViewer } from "./PDFViewer";

export const PDFPreview = () => {
  return (
    <CollapsibleContent title="Chứng chỉ dạng PDF">
      <PDFViewer pdfFile={null} />
    </CollapsibleContent>
  );
};