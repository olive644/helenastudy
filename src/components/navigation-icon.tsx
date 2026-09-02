export type NavigationIconName =
  | "today"
  | "planner"
  | "focus"
  | "learn"
  | "habits"
  | "notes"
  | "library"
  | "lesson"
  | "activity-bank"
  | "more"
  | "close";

type NavigationIconProps = {
  name: NavigationIconName;
};

// Cada glifo usa curvas e círculos generosos — a mesma linguagem redonda e
// amigável dos olhos grandes da Helena — em vez de traços genéricos retos.
// Círculos/elipses/retângulos arredondados são expressos como comandos de
// arco dentro de um único path (em vez de vários elementos <circle>/<rect>)
// para manter o bundle pequeno; os valores continuam matematicamente exatos.
const ICON_PATHS: Record<NavigationIconName, string> = {
  today:
    "M4 12 12 5 20 12 M8 12H16A2 2 0 0 1 18 14V18A2 2 0 0 1 16 20H8A2 2 0 0 1 6 18V14A2 2 0 0 1 8 12Z M10.4 16.5a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0",
  planner:
    "M7 5H17A3 3 0 0 1 20 8V17A3 3 0 0 1 17 20H7A3 3 0 0 1 4 17V8A3 3 0 0 1 7 5Z M8 3L8 7 M16 3L16 7 M4 10L20 10 M7 14.5L17 14.5",
  focus: "M4 13a8 8 0 1 0 16 0a8 8 0 1 0 -16 0 M9.5 3L14.5 3 M12 13L12 9 M12 13L15 13",
  learn:
    "M11 6H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4 M13 6h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4 M12 6L12 20",
  habits:
    "M12 20.5s-6.8-4-9-8C1 9 3.2 5 6.8 5c2 0 4 1 5.2 3 1.2-2 3.2-3 5.2-3 3.6 0 5.8 4 3.8 7.5-2.2 4-9 8-9 8Z",
  notes:
    "M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M14 3v4h5 M8 13L15 13 M8 17L13 17",
  library: "M4 5H8V20H4Z M10 7H14V20H10Z M16 4H20V20H16Z",
  lesson:
    "M6 4H18A2 2 0 0 1 20 6V18A2 2 0 0 1 18 20H6A2 2 0 0 1 4 18V6A2 2 0 0 1 6 4Z M9 2H15V5H9Z M7.5 10.5L14 10.5 M7.5 14.5L16.5 14.5",
  "activity-bank":
    "M7.5 15.5a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0 M3.5 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M7.1 6.3a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0 M12.5 6.3a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0 M16.5 10a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  more: "M4.4 12a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0 M10.4 12a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0 M16.4 12a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0",
  close: "M6 6L18 18 M18 6L6 18",
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
