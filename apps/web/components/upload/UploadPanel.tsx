import { UploadDropzone } from './UploadDropzone';

/**
 * The recessed panel holding both dropzones.
 *
 * Side by side from `md` up, stacked below it — which is the only structural
 * difference between the desktop and mobile references.
 */
export function UploadPanel() {
  return (
    <div className="bg-surface-panel rounded-panel flex flex-col gap-3 p-3 md:flex-row lg:gap-4 lg:p-4">
      <UploadDropzone label="Upload" highlight="Question Paper" />
      <UploadDropzone label="Upload" highlight="Answer Sheet" />
    </div>
  );
}
