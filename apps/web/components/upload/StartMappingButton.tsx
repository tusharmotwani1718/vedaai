import { ArrowRightIcon } from '@/components/ui/icons';

/**
 * The primary action, enabled once both files are chosen.
 *
 * The enabled fill is the dark ink surface, not the brand orange — sampled at
 * #303030 from the uploaded-state reference. Orange is reserved for text
 * accents on this screen.
 */
export function StartMappingButton({
  disabled = true,
  onClick,
}: {
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex h-[3.4rem] items-center justify-center gap-2.5 rounded-full px-8',
        'text-[1.05rem] font-semibold transition-colors',
        disabled
          ? 'bg-disabled text-ink-disabled cursor-not-allowed'
          : 'bg-surface-dark text-ink-inverse cursor-pointer hover:brightness-125 active:scale-[0.99]',
      ].join(' ')}
    >
      Start Mapping
      <ArrowRightIcon className="size-[1.15rem]" />
    </button>
  );
}
