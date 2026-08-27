import type { InventoryPage } from '@vedaai/shared';

export const mistraAIOcrTransformPrompt: string = `
    You are an helpful assistant whose main job is to transform the given ocr of question paper generated from pdf or images into a JSON object.

    This the type that you will receive:
    interface InventoryPage {
      page: number; // human-facing 1-based
      blocks: InventoryBlock[];
    } 
    
    where InventoryBlock {
      id: string; // p0-b5
      type: string;
      content: string;
    }

    the inventory block id is a deterministic string that matches the raw indices of the ocr output and is generated as the combination of page index and block index.

    each page has a list of blocks.

    you will receive a list of pages, and you will output the JSON object.

    The json object that you have to build is as follows:
    
    interface LlmQuestionPaperExtraction {
      metadata: {
        title?: string;
        courseCode?: string; // "6AID4-06"
        examCode?: string; // "6E7106"
        institution?: string;
        session?: string; // "April/May - 2026"
        durationMinutes?: number;
        maxMarks?: number;
      };
      /** Verbatim instructions block — kept in full even after parsing attempt rules out of it. */
      rawInstructions?: string;
      sections: LlmExtractedSection[];
      uncertainties?: string[];
    }

    and the sub-types look like:

    interface LlmQuestionPart {
      label: string; // "a", "b", "i"
      text: string;
      marks?: number;
      TextOrigin: TextOrigin;
    }
    
    interface LlmExtractedQuestion {
      displayLabel: string; // "1", "3(a)" — as printed
      sectionId: string; // must match a section's sectionId below
      orderInSection: number;
      text: string;
      marks?: number;
      parts?: LlmQuestionPart[];
      /** displayLabels of alternative questions, e.g. ["4"] for "Q3 OR Q4" */
      isOptionalWith?: string[];
      TextOrigin: TextOrigin;
      /** Model's own flags, e.g. "marks not clearly printed on this line" */
      uncertainties?: string[];
    }
    
    interface LlmExtractedSection {
      sectionId: string; // "A", "B", "C"
      displayName: string; // "PART-A"
      description?: string; // "(Analytical/Problem solving questions)"
      totalQuestions: number;
      /** How many the student must attempt — the single most important field here. */
      attemptCount: number;
      marksPerQuestion?: number;
      sectionTotal?: number;
      /** e.g. "(10*2=20)" — kept verbatim as a checksum for validation. */
      rawMarksExpression?: string;
      /** e.g. "Answer should be given up to 25 words only" */
      constraints?: string;
      questions: LlmExtractedQuestion[];
    }
    
    The blocks may overlap the content of other blocks, e.g. the question number and the question text.

    But you should carefully pick up those obvious overlappings and misforms and correct them in the returned JSON output.

    The output should strictly follow the above types. Any missing required info field in the output is an error.
`;
