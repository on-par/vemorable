declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion?: string;
    IsAcroFormPresent?: boolean;
    IsXFAPresent?: boolean;
    Title?: string;
    Author?: string;
    Subject?: string;
    Keywords?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
  }

  interface PDFMetadata {
    _metadata?: {
      [key: string]: string;
    };
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info?: PDFInfo;
    metadata?: PDFMetadata;
    text: string;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: unknown) => string;
    max?: number;
    version?: string;
  }

  function pdf(dataBuffer: Buffer | ArrayBuffer | Uint8Array, options?: PDFOptions): Promise<PDFData>;
  
  export = pdf;
}