export function HomeCardCorners({ color, show }: { color: string; show: boolean }) {
  if (!show) return null;
  return (
    <>
      <span
        aria-hidden
        className="support-ticket-corner pointer-events-none absolute left-[-1px] top-[-1px] z-[2] border-l-2 border-t-2"
        style={{ borderColor: color }}
      />
      <span
        aria-hidden
        className="support-ticket-corner pointer-events-none absolute bottom-[-1px] right-[-1px] z-[2] border-b-2 border-r-2"
        style={{ borderColor: color }}
      />
    </>
  );
}
