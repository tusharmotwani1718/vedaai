/**
 * Contract shared between the Express API (`@vedaai/api`) and the Next.js
 * frontend (`@vedaai/web`).
 *
 * Both sides import from here so a change to a response shape becomes a
 * compile error on the other side instead of a runtime surprise.
 */

export * from './http';
export type {
  Response,
  ErrorResponse,
} from "./types/response.types";
export * from "./types/ocr.types"
