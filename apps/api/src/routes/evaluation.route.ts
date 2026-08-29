import { Router } from 'express';
import multer from 'multer';
import { MAX_UPLOAD_BYTES, type ApiSuccess } from '@vedaai/shared';

import { HttpError } from '../http-error';
import {
  extractOcr,
  mapAnswersToQuestions,
  transformOcrOutput,
  transformOcrOutputForAnswerSheet,
  SUPPORTED_UPLOAD_MIME_TYPES,
  type OcrExtractionData,
} from '../ocr/utils/extraction';
import {
  createEvaluation,
  documentOf,
  getEvaluation,
  type DocumentKind,
} from '../store/evaluation.store';
import { toEvaluationPayload, type EvaluationPayload } from './evaluation.payload';

export const evaluationRouter: Router = Router();

/**
 * Uploads are held in memory, never written to disk — the product runs without
 * storage of any kind, and the bytes are needed again anyway to render the
 * document in the answers pane.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (SUPPORTED_UPLOAD_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', `${file.mimetype} is not a PDF or an image`));
  },
});

type UploadedFiles = Record<string, Express.Multer.File[] | undefined>;

function requireFile(files: UploadedFiles | undefined, field: string): Express.Multer.File {
  const file = files?.[field]?.[0];
  if (file === undefined) {
    throw HttpError.badRequest(`Missing file field "${field}"`, 'MISSING_FILE');
  }
  return file;
}

/** Runs OCR and surfaces its envelope as an HttpError the error handler can render. */
async function ocrPages(
  file: Express.Multer.File,
  documentType: 'questionPaper' | 'answerSheet',
): Promise<OcrExtractionData> {
  const result = await extractOcr({
    fileBytes: file.buffer,
    mimeType: file.mimetype,
    documentType,
  });

  if (!result.success) {
    throw new HttpError(
      502,
      'OCR_FAILED',
      `OCR failed for ${file.originalname}: ${result.message}`,
    );
  }

  return result.data as OcrExtractionData;
}

function pageDimensions(data: OcrExtractionData) {
  return data.pages.map((p) => ({
    index: p.index,
    width: p.dimensions.width,
    height: p.dimensions.height,
  }));
}

/**
 * POST /api/evaluations
 *
 * multipart/form-data with two files: `questionPaper` and `answerSheet`.
 *
 * Runs the whole pipeline synchronously — OCR both documents, transform each
 * through its own prompt, validate, derive highlight regions, then resolve the
 * student's labels against the paper. That is two OCR calls and two LLM calls,
 * so expect this to take a while; there is no job queue because there is no
 * database to keep job state in.
 */
evaluationRouter.post(
  '/evaluations',
  upload.fields([
    { name: 'questionPaper', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files as UploadedFiles | undefined;
    const paperFile = requireFile(files, 'questionPaper');
    const sheetFile = requireFile(files, 'answerSheet');

    // Both OCR calls are independent, so they overlap rather than queue.
    const [paperOcr, sheetOcr] = await Promise.all([
      ocrPages(paperFile, 'questionPaper'),
      ocrPages(sheetFile, 'answerSheet'),
    ]);

    // The transforms are independent too — resolution is what needs both.
    // Wrapped so an upstream model failure (wrong tier, rate limit, bad schema)
    // reaches the client as something actionable rather than a bare 500.
    let paperResult;
    let sheetResult;
    try {
      [paperResult, sheetResult] = await Promise.all([
        transformOcrOutput(paperOcr.pages),
        transformOcrOutputForAnswerSheet(sheetOcr.pages),
      ]);
    } catch (err) {
      throw new HttpError(502, 'TRANSFORM_FAILED', (err as Error).message);
    }

    const mapping = mapAnswersToQuestions(sheetResult, paperResult.extraction);

    const evaluation = createEvaluation({
      questionPaper: {
        document: {
          bytes: paperFile.buffer,
          mimeType: paperFile.mimetype,
          fileName: paperFile.originalname,
          pages: pageDimensions(paperOcr),
        },
        result: paperResult,
      },
      answerSheet: {
        document: {
          bytes: sheetFile.buffer,
          mimeType: sheetFile.mimetype,
          fileName: sheetFile.originalname,
          pages: pageDimensions(sheetOcr),
        },
        result: sheetResult,
      },
      mapping,
    });

    const body: ApiSuccess<EvaluationPayload> = {
      ok: true,
      data: toEvaluationPayload(evaluation),
    };
    res.status(201).json(body);
  },
);

/** GET /api/evaluations/:evaluationId — the processed result, without re-running anything. */
evaluationRouter.get('/evaluations/:evaluationId', (req, res) => {
  const evaluation = getEvaluation(req.params.evaluationId);
  if (evaluation === undefined) {
    throw HttpError.notFound('No evaluation with that id (the store is in-memory and per-process)');
  }

  const body: ApiSuccess<EvaluationPayload> = {
    ok: true,
    data: toEvaluationPayload(evaluation),
  };
  res.json(body);
});

const DOCUMENT_KINDS = new Set<DocumentKind>(['question-paper', 'answer-sheet']);

/**
 * GET /api/evaluations/:evaluationId/documents/:kind
 *
 * The original upload, byte for byte. The answers pane renders this and draws
 * the highlight rects over it, which is why the regions are normalized 0–1:
 * they hold regardless of the zoom the document is displayed at.
 */
evaluationRouter.get('/evaluations/:evaluationId/documents/:kind', (req, res) => {
  const kind = req.params.kind as DocumentKind;
  if (!DOCUMENT_KINDS.has(kind)) {
    throw HttpError.badRequest(
      `Unknown document kind "${req.params.kind}" — expected question-paper or answer-sheet`,
      'UNKNOWN_DOCUMENT_KIND',
    );
  }

  const evaluation = getEvaluation(req.params.evaluationId);
  if (evaluation === undefined) {
    throw HttpError.notFound('No evaluation with that id');
  }

  const doc = documentOf(evaluation, kind);
  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
  res.send(doc.bytes);
});
