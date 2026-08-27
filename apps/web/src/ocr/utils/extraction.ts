import {
  buildBlockInventory,
  type ErrorResponse,
  type Response,
  type RawBlock,
  type RawPage,
  LlmQuestionPaperExtractionSchema,
} from '@vedaai/shared';
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';
import path from 'path';
import type { OCRPageObject } from '@mistralai/mistralai/models/components';
import { mistraAIOcrTransformPrompt } from '../lib/constants';

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

// <----------------------------------------------------------------------------->
// Block types that actually carry content + geometry (everything except the Unknown catch-all).
const KNOWN_BLOCK_TYPES = new Set([
  'text',
  'title',
  'list',
  'table',
  'image',
  'footer',
  'header',
  'caption',
  'code',
  'equation',
  'aside_text',
  'references',
  'signature',
]);

// A block guaranteed to have content + coordinates. Derived from the SDK union
// by excluding the Unknown<"type"> member.
type ContentBlock = {
  type: string;
  content: string;
  topLeftX: number;
  topLeftY: number;
  bottomRightX: number;
  bottomRightY: number;
};

/** Narrows a raw union block to one that has content + geometry, or null for the Unknown catch-all. */
function asContentBlock(block: unknown): ContentBlock | null {
  if (
    block &&
    typeof block === 'object' &&
    'type' in block &&
    typeof (block as any).type === 'string' &&
    KNOWN_BLOCK_TYPES.has((block as any).type) &&
    'content' in block &&
    'topLeftX' in block
  ) {
    return block as ContentBlock;
  }
  return null;
}

function toRawPages(pages: OCRPageObject[]): RawPage[] {
  return pages.map((page) => ({
    index: page.index,
    dimensions: {
      width: page.dimensions?.width ?? 0,
      height: page.dimensions?.height ?? 0,
      dpi: page.dimensions?.dpi ?? undefined,
    },
    blocks: (page.blocks ?? []).flatMap((raw) => {
      const b = asContentBlock(raw);
      if (!b) return []; // flatMap + [] = drop, no nulls in the result
      return [
        {
          type: b.type,
          content: b.content,
          box: {
            topLeftX: b.topLeftX,
            topLeftY: b.topLeftY,
            bottomRightX: b.bottomRightX,
            bottomRightY: b.bottomRightY,
          },
        },
      ];
    }),
  }));
}
// <--------------------------------------------------------------------------------->

async function extractOcr(props: OcrGenerationProps): Promise<Response | ErrorResponse> {
  try {
    const input = props;
    const { filePath, fileUrl } = input;

    let pdfBuffer: any;
    let base64Pdf: any;

    if (!filePath && !fileUrl) {
      return {
        success: false,
        message: 'No file path or url provided',
        error: {
          code: 'BAD_REQUEST',
          message: 'No file path or url provided',
        },
      };
    }

    if (filePath) {
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
      includeBlocks: true,
    });

    const pages = ocrResponse.pages;

    let pagesToReturn: RawPage[] = toRawPages(pages);

    return {
      success: true,
      message: 'Extraction successful',
      data: {
        pages: pagesToReturn,
        usageInfo: ocrResponse?.usageInfo,
      },
    };
  } catch (error) {
    console.log('error in ocr extraction...');
    console.log(error);
    return {
      success: false,
      message: 'Something went wrong',
      error,
    };
  }
}

async function transformOcrOutput(pages: RawPage[]) {
  try {
    console.log(`transforming...🤖🤖🤖`);
    const { inventory, geometry } = buildBlockInventory(pages);

    const response = await client.chat.parse({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: mistraAIOcrTransformPrompt },
        { role: 'user', content: `Here is the OCR output: ${JSON.stringify(inventory)}` },
      ],
      responseFormat: LlmQuestionPaperExtractionSchema,
    });

    // console.log('response', response);
    if (!response) return;

    if (response.choices) {
      console.log(`transformed...`);
      console.log(response?.choices[0]?.message?.content);
    }
  } catch (error) {
    console.error('error in transformOcrOutput');
    console.log(error);
  }
}

const res = await extractOcr({
  filePath: path.resolve(import.meta.dirname, '../../../../..', 'public/pdf/rtu-paper.pdf'),
});

console.log('pages...');
console.log(JSON.stringify(res?.data?.pages));

if (res.success) {
  const transformedJSON = await transformOcrOutput(res?.data?.pages);

  console.log('transformed...');
  console.log(JSON.stringify(transformedJSON));
}
