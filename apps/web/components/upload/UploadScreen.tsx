import { StartMappingButton } from './StartMappingButton';
import { UploadHero } from './UploadHero';
import { UploadPanel } from './UploadPanel';

/**
 * The upload screen, empty state.
 *
 * One column, centred, with a max width so the dropzones do not stretch on wide
 * displays. The whole screen composes from the pieces around it — this file is
 * only responsible for the vertical rhythm between them.
 */
export function UploadScreen() {
  return (
    <div className="mx-auto flex w-full max-w-248 flex-col px-1 py-0 lg:justify-center lg:py-6">
      <UploadHero />

      <div className="mt-7 lg:mt-9">
        <UploadPanel />
      </div>

      <div className="mt-8 flex flex-col items-center lg:mt-9">
        <StartMappingButton disabled />
        <p className="text-ink-muted mt-4 max-w-88 text-center text-[0.85rem] leading-relaxed lg:max-w-none lg:text-[0.9rem]">
          Once both files are uploaded, you&rsquo;ll able to map answers with questions
        </p>
      </div>
    </div>
  );
}
