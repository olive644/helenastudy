export type NavigationIconName =
  | "today"
  | "planner"
  | "focus"
  | "learn"
  | "habits"
  | "notes"
  | "library"
  | "lesson"
  | "more"
  | "close";

type NavigationIconProps = {
  name: NavigationIconName;
};

const ICON_PATHS: Record<NavigationIconName, readonly string[]> = {
  today: ["M3.5 10.5 12 3.8l8.5 6.7", "M5.8 9.3v10.2h12.4V9.3M9.5 19.5v-6h5v6"],
  planner: [
    "M5.5 5.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2",
    "M7.5 3.5v4M16.5 3.5v4M3.5 10h17M7.5 14h3M13.5 14h3M7.5 17.5h3",
  ],
  focus: ["M19.5 13a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0", "M9 2.8h6M12 5.5V3M12 13l3.2-2.1"],
  learn: [
    "M4 5.5c3.2-.7 5.8.1 8 2.2v12c-2.2-2.1-4.8-2.9-8-2.2z",
    "M20 5.5c-3.2-.7-5.8.1-8 2.2v12c2.2-2.1 4.8-2.9 8-2.2z",
  ],
  habits: ["M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0", "m8 12 2.6 2.6L16.5 9"],
  notes: ["M6 3.5h10l3 3v14H6z", "M15.5 3.5v4h3.5M9 11h6M9 14.5h6M9 18h4"],
  library: ["M4 5.5h6v14H4zM10 5.5h6v14h-6zM16 7l3.3-1 2.2 13.4-3.3.6z"],
  lesson: [
    "M5 4h11.5A2.5 2.5 0 0 1 19 6.5V20H7.5A2.5 2.5 0 0 1 5 17.5z",
    "M5 17.5A2.5 2.5 0 0 1 7.5 15H19M9 8h6M9 11h4",
  ],
  more: [
    "M7.4 6A1.4 1.4 0 1 1 4.6 6a1.4 1.4 0 0 1 2.8 0M19.4 6a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0M7.4 18a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0M19.4 18a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0",
  ],
  close: ["m6 6 12 12M18 6 6 18"],
};

export function NavigationIcon({ name }: NavigationIconProps) {
  return (
    <svg
      className="navigation-icon"
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}
