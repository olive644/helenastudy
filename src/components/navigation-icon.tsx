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

type IconLayer = "base" | "accent" | "accent-line" | "detail";

type IconShape = {
  d: string;
  layer?: IconLayer;
};

const ICON_SHAPES: Record<NavigationIconName, readonly IconShape[]> = {
  today: [
    {
      d: "M4.2 6.5 7.7 3.9l4.4 1.9 4.7-2.2 2.9 4.2-.2 8.8c-.1 3.2-2.2 5.4-5.3 5.4H9.6c-3.3 0-5.5-2.1-5.3-5.3z",
    },
    {
      d: "M7.4 11.6a3 3 0 1 0 6 0 3 3 0 0 0-6 0m7 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0",
      layer: "accent",
    },
    {
      d: "M9.8 9.4c.7 0 1 1 2.2 0v4.4c0 .8-.3 1.4-1.1 1.4s-1.1-.6-1.1-1.4zm7 0c.7 0 1 1 2.2 0v4.4c0 .8-.3 1.4-1.1 1.4s-1.1-.6-1.1-1.4z",
      layer: "detail",
    },
  ],
  planner: [
    {
      d: "M4 7.4 7.2 4l4.7 1.8L16.6 4 20 7.5v11.1c0 1.5-1.2 2.7-2.7 2.7H6.7A2.7 2.7 0 0 1 4 18.6z",
    },
    {
      d: "M6.5 9h11v2.2h-11zm1 4.2h3v2.8h-3zm4.5 0h4.5V16H12zm-4.5 4h3v2h-3z",
      layer: "accent",
    },
  ],
  focus: [
    { d: "M5 8.1 8.2 5l3.8 1.5L16 5l3 3.2a8.4 8.4 0 1 1-14-.1" },
    { d: "M11 9h2v4.6l3 1.8-1.1 1.7-3.9-2.4zM9 2.5h6v2H9z", layer: "accent" },
  ],
  learn: [
    { d: "M3.5 6.5 6.8 4l5.1 2.1L17 4l3.5 2.5v12.8l-8.6 2.5-8.4-2.5z" },
    {
      d: "M6.5 8.4h4v4h-4zm5.8 0h5.2v1.8h-5.2zm0 2.8h4.1V13h-4.1zm-5.8 3.3h4v4h-4zm5.8.1h5.2v1.8h-5.2zm0 2.8h3.2v1.8h-3.2z",
      layer: "accent",
    },
  ],
  habits: [
    {
      d: "M4.4 7.4 7.6 4 12 5.8 16.6 4l3 3.5.2 7.8c0 4.1-3.3 6.7-7.8 7.2-4.5-.5-7.8-3.1-7.8-7.2z",
    },
    { d: "m7.7 13.3 2.5-2.4 2 2.1 4.2-4 1.7 1.8-5.9 5.8z", layer: "accent" },
  ],
  notes: [
    {
      d: "M4.5 6.6 7.8 4 12 5.8 16.3 4l3.2 2.7v12c0 1.8-1.4 3.2-3.2 3.2H7.7a3.2 3.2 0 0 1-3.2-3.2z",
    },
    { d: "M7.5 10h9v1.8h-9zm0 3.5h7v1.8h-7zm0 3.5h4.5v1.8H7.5z", layer: "accent" },
  ],
  library: [
    {
      d: "M3.5 7 6.2 4.5 9 6v14.5H3.5zm6.3-.8L12.5 4l2.8 2.2v14.3H9.8zm6.3.7L19.2 4l3 2.4-2.3 14.2-5-.8z",
    },
    {
      d: "M5.5 9h1.6v7H5.5zm6-1h1.6v7h-1.6zm6.3 1.1 1.7.3-1.2 7-1.7-.3z",
      layer: "accent",
    },
  ],
  lesson: [
    {
      d: "M4.3 6.6 7.5 4l4.4 1.8L16.5 4l3.2 2.7v13.1c-2.7-.5-5.3.1-7.7 2.2-2.4-2.1-5-2.7-7.7-2.2z",
    },
    {
      d: "M8.5 17 12 9l3.5 8M9.8 14.1h4.4",
      layer: "accent-line",
    },
  ],
  more: [
    {
      d: "M4.2 7.2 7.5 4l4.5 1.8L16.5 4l3.3 3.3-.2 9.8c-.1 3-2.1 4.9-5 4.9H9.3c-3.1 0-5.1-2-5-5z",
    },
    {
      d: "M7.2 12a2 2 0 1 0 4 0 2 2 0 0 0-4 0m5.7 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
      layer: "accent",
    },
    { d: "M8.7 10.5h1v3h-1zm5.7 0h1v3h-1z", layer: "detail" },
  ],
  close: [
    {
      d: "M4.7 7.2 7.8 4 12 5.7 16.4 4l2.9 3.3-.2 9.8c-.1 3-2.1 4.9-5 4.9H9.4c-3 0-5-2-4.9-5z",
    },
    {
      d: "m8.4 10 1.5-1.5 2.2 2.2 2.2-2.2 1.5 1.5-2.2 2.2 2.2 2.2-1.5 1.5-2.2-2.2-2.2 2.2-1.5-1.5 2.2-2.2z",
      layer: "accent",
    },
  ],
};

export function NavigationIcon({ name }: NavigationIconProps) {
  return (
    <span className="navigation-icon" data-icon={name} aria-hidden="true">
      <svg className="navigation-icon__glyph" viewBox="0 0 24 24" focusable="false">
        {ICON_SHAPES[name].map(({ d, layer = "base" }) => (
          <path className={`navigation-icon__${layer}`} d={d} key={d} />
        ))}
      </svg>
    </span>
  );
}
