import Image from 'next/image';

/**
 * The school badge pinned to the bottom of the sidebar.
 *
 * The crest is drawn rather than imported — no crest asset was supplied with
 * the design reference. Swap the <span> for an <Image> when one exists.
 */
export function SidebarSchoolCard({ name, location }: { name: string; location: string }) {
  return (
    <div className="bg-surface-sunken rounded-panel flex items-center gap-3 p-3">
      <Image
        src={'/assets/school.png'}
        alt="School logo"
        width={40}
        height={40}
        className="size-9 rounded-[0.65rem]"
      />
      <span className="min-w-0">
        <span className="text-ink block truncate text-[0.9rem] font-semibold">{name}</span>
        <span className="text-ink-muted block truncate text-[0.8rem]">{location}</span>
      </span>
    </div>
  );
}
