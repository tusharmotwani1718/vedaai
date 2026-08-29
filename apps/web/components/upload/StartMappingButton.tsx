import { ArrowRightIcon } from '@/components/ui/icons';

/**
 * The primary action. Disabled until both files are chosen, which is the only
 * state the empty screen shows.
 */
export function StartMappingButton({ disabled = true }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'flex h-[3.4rem] items-center justify-center gap-2.5 rounded-full px-8',
        'text-[1.05rem] font-semibold transition-colors',
        disabled
          ? 'bg-disabled text-ink-disabled cursor-not-allowed'
          : 'bg-brand text-ink-inverse hover:brightness-105 active:scale-[0.99]',
      ].join(' ')}
    >
      Start Mapping
      <ArrowRightIcon className="size-[1.15rem]" />
    </button>
  );
}
