import { toast } from "@/components/ui/use-toast";
import { PDF_GENERATION_CSS } from "@/styles/pdf";

// Helper function to transform markdown content
const transformMarkdown = (content: string) => {
  return `
<div class="content-wrapper">
${content
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line)
    .join('\n\n')}
</div>`;
};

// Common PDF generation logic
const generatePdf = async (
  content: string,
  filename: string,
  setIsGenerating: (value: boolean) => void
): Promise<void> => {
  if (!content) return;

  try {
    setIsGenerating(true);
    const transformedMarkdown = transformMarkdown(content);

    const formData = new URLSearchParams();
    formData.append('markdown', transformedMarkdown);
    formData.append('engine', 'wkhtmltopdf');
    formData.append('css', PDF_GENERATION_CSS);

    const response = await fetch('https://md-to-pdf.fly.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pdfBlob = await response.blob();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating PDF:', error);
    toast({
      title: "PDF Generation Failed",
      description: "Failed to generate PDF. Please try again.",
      duration: 3000,
      className: "bg-red-50 border-red-200 shadow-lg border-2 rounded-xl",
    });
  } finally {
    setIsGenerating(false);
  }
};

// Specific handlers for different types of PDFs
export const generateAnalysisPdf = async (
  analysisContent: string,
  setIsPdfGenerating: (value: boolean) => void
): Promise<void> => {
  await generatePdf(
    analysisContent,
    `Analysis-Report-${new Date().toISOString()}.pdf`,
    setIsPdfGenerating
  );
};

export const generateQuickAnalysisPdf = async (
  quickAnalysisContent: string,
  setIsQuickPdfGenerating: (value: boolean) => void
): Promise<void> => {
  await generatePdf(
    quickAnalysisContent,
    `Quick-Analysis-Report-${new Date().toISOString()}.pdf`,
    setIsQuickPdfGenerating
  );
}; 