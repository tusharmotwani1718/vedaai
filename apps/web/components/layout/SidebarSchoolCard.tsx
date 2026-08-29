/**
 * The school badge pinned to the bottom of the sidebar.
 *
 * The crest is drawn rather than imported — no crest asset was supplied with
 * the design reference. Swap the <span> for an <Image> when one exists.
 */
export function SidebarSchoolCard({ name, location }: { name: string; location: string }) {
  return (
    <div className="bg-surface-sunken rounded-panel flex items-center gap-3 p-3">
      <span
        aria-hidden="true"
        className="bg-surface text-ink-muted grid size-11 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold"
      >
        DPS
      </span>
      <span className="min-w-0">
        <span className="text-ink block truncate text-[0.9rem] font-semibold">{name}</span>
        <span className="text-ink-muted block truncate text-[0.8rem]">{location}</span>
      </span>
    </div>
  );
}
