export type NavigationIconName =
  | "today"
  | "planner"
  | "focus"
  | "learn"
  | "habits"
  | "notes"
  | "library"
  | "lesson"
  | "homework"
  | "activity-bank"
  | "more"
  | "close";

type NavigationIconProps = {
  name: NavigationIconName;
};

const ICON_PATHS: Record<NavigationIconName, string> = {
  today: "m3 11 9-8 9 8v10h-6v-6H9v6H3z",
  planner: "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2zm-2 6h18M8 2v4m8-4v4",
  focus: "M9 2h6m-3 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3v5l3 2",
  learn:
    "M7 8h10a5 5 0 0 1 4.8 6.4l-1 3.2a2 2 0 0 1-3.4.7L15 16H9l-2.4 2.3a2 2 0 0 1-3.4-.7l-1-3.2A5 5 0 0 1 7 8zm0 4v4m-2-2h4m7-1h.01m3 2h.01",
  habits:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z",
  notes: "M6 3h11a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 0v18m3-13h5m-5 4h5m-5 4h3",
  library: "M4 19V5h5v14H4zm5 0V3h6v16H9zm6 0V7h5v12h-5z",
  lesson: "M4 3h16v12H4V3zm-2 0h20M12 15v6m-4 0h8M8 8l2 2 5-4",
  homework:
    "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm3-1h6v3H9V2zM6.5 10.5l1.5 1.5 3-3m-4.5 8 1.5 1.5 3-3",
  "activity-bank": "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  close: "M6 6l12 12M18 6 6 18",
};

export function NavigationIcon({ name }: NavigationIconProps) {
  return (
    <span className="navigation-icon" data-icon={name} aria-hidden="true">
      <svg className="navigation-icon__glyph" viewBox="0 0 24 24" focusable="false">
        <path className="navigation-icon__stroke" d={ICON_PATHS[name]} />
      </svg>
    </span>
  );
}
