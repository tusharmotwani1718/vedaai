import type { ErrorResponse, Response } from '@vedaai/shared';
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';

type OcrGenerationProps =
  | {
      fileUrl: string; // for cloud docs
      filePath?: never; // for local docs
    }
  | {
      fileUrl?: never;
      filePath: string;
    };

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({ apiKey: apiKey });

async function extractOcr(props: OcrGenerationProps): Promise<Response | ErrorResponse> {
  try {

    const input = props;
    const { filePath, fileUrl } = input;

    let pdfBuffer : any;
    let base64Pdf : any;

    if(!filePath || !fileUrl) {
      return {
        success: false,
        message: 'No file path or url provided',
        error: {
          code: 'BAD_REQUEST',
          message: 'No file path or url provided',
        },
      };
    }

    if(filePath) {
      pdfBuffer = fs.readFileSync(filePath);
      base64Pdf = pdfBuffer.toString('base64');
    }

    // cloud url:
    const ocrResponse = await client.ocr.process({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        documentUrl: fileUrl ? fileUrl : `data:application/pdf;base64,${base64Pdf}`,
      },
      tableFormat: 'html', // default is null
      // extractHeader: False, // default is False
      // extractFooter: False, // default is False
      includeImageBase64: true,
      includeBlocks: true
    });

    const pages = ocrResponse.pages;

    console.log('pages: 📖📖📖...');
    console.log(JSON.stringify(pages, null, 2));

    for (const page of pages) {
      console.log(`page ${page.index + 1} 📃📃📃...`);
      console.log(page.markdown);
    }

    return {
        success: true,
        message: 'Extraction successful',
        data: ocrResponse
    }
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong',
      error,
    };
  }
}
