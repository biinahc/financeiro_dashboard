declare module 'html2pdf.js' {
    interface Html2PdfImage {
      type?: string;
      quality?: number;
    }
  
    interface Html2CanvasOptions {
      scale?: number;
      useCORS?: boolean;
      display?: string;
      windowWidth?: number;
      ignoreElements?: (el: HTMLElement) => boolean;
    }
  
    interface JsPdfOptions {
      unit?: string;
      format?: string | number[];
      orientation?: string;
    }
  
    interface Html2PdfOptions {
      margin?: number | number[];
      filename?: string;
      image?: Html2PdfImage;
      html2canvas?: Html2CanvasOptions;
      jsPDF?: JsPdfOptions;
    }
  
    interface Html2PdfWorker {
      set(opt: Html2PdfOptions): Html2PdfWorker;
      from(el: HTMLElement): Html2PdfWorker;
      save(): Promise<void>;
    }
  
    function html2pdf(): Html2PdfWorker;
    export default html2pdf;
  }
