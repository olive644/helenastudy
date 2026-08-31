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

type IconLayer = "base" | "accent" | "detail";

type IconShape = {
  d: string;
  layer?: IconLayer;
};

const ICON_SHAPES: Record<NavigationIconName, readonly IconShape[]> = {
  today: [
    { d: "M3.5 11.2 12 4l8.5 7.2v8.1a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7z" },
    { d: "M9.2 21v-6.4h5.6V21", layer: "accent" },
    { d: "M7.2 3.8 9 5.4 5.8 8.1zM16.8 3.8 15 5.4l3.2 2.7z", layer: "detail" },
  ],
  planner: [
    {
      d: "M5 5.5h14a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2ZM7 3v5M17 3v5M3 10h18",
    },
    { d: "M7.2 14h3v3h-3zM13.8 14h3v3h-3z", layer: "accent" },
  ],
  focus: [
    { d: "M12 4a8.5 8.5 0 1 1-8.5 8.5A8.5 8.5 0 0 1 12 4ZM9 2h6M12 8v5l3.2 2" },
    { d: "M12 12.5h.01", layer: "accent" },
  ],
  learn: [
    {
      d: "M4 5.5h6.3c1 0 1.7.8 1.7 1.7V21c0-1.2-1-2.2-2.2-2.2H4zM20 5.5h-6.3c-1 0-1.7.8-1.7 1.7V21c0-1.2 1-2.2 2.2-2.2H20z",
    },
    { d: "M7 9.5h2.2M14.8 9.5H17M7 13h2.2M14.8 13H17", layer: "accent" },
  ],
  habits: [
    { d: "M12 21s7-3.2 7-9.2V5.5L12 3 5 5.5v6.3C5 17.8 12 21 12 21Z" },
    { d: "m8.5 12 2.2 2.2 4.8-5", layer: "accent" },
  ],
  notes: [
    { d: "M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM14 3v5h5" },
    { d: "M8 12h7M8 16h5", layer: "accent" },
  ],
  library: [
    { d: "M4 4h5v16H4zM9 6h5v14H9zM16 4.5l4-1 3.5 15.5-4 1z" },
    { d: "M6.5 8v6M11.5 9v6M19.2 8l1.3 6", layer: "accent" },
  ],
  lesson: [{ d: "M4 5h16v14H4zM8 3v4M16 3v4M8 11h8M8 15h5" }, { d: "M17 15h.01", layer: "accent" }],
  more: [
    {
      d: "M5 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z",
    },
  ],
  close: [{ d: "m6 6 12 12M18 6 6 18" }],
};

export function NavigationIcon({ name }: NavigationIconProps) {
  return (
    <svg
      className="navigation-icon"
      data-icon={name}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {ICON_SHAPES[name].map(({ d, layer = "base" }) => (
        <path className={`navigation-icon__${layer}`} d={d} key={d} />
      ))}
    </svg>
  );
}
