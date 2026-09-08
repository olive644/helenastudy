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
  | "theme-light"
  | "theme-dark"
  | "more"
  | "close";

type NavigationIconProps = {
  name: NavigationIconName;
};

const BRAND_ICON_NAMES = new Set<NavigationIconName>([
  "today",
  "planner",
  "focus",
  "learn",
  "more",
  "library",
  "habits",
  "notes",
  "lesson",
  "activity-bank",
  "theme-light",
  "theme-dark",
]);

export function NavigationIcon({ name }: NavigationIconProps) {
  if (BRAND_ICON_NAMES.has(name)) {
    return (
      <span className="navigation-icon navigation-icon--brand" data-icon={name} aria-hidden="true">
        {(["claro", "roxo", "escuro"] as const).map((variant) => (
          <img
            className={`navigation-icon__variant navigation-icon__variant--${variant}`}
            src={`/navigation-icons/${variant}/${name}.png`}
            alt=""
            key={variant}
          />
        ))}
      </span>
    );
  }

  const symbol = `/navigation-icons.svg#${name}`;
  return (
    <span className="navigation-icon" data-icon={name} aria-hidden="true">
      <svg className="navigation-icon__glyph" viewBox="0 0 24 24" focusable="false">
        <use className="navigation-icon__secondary" href={`${symbol}-secondary`} />
        <use className="navigation-icon__base" href={`${symbol}-base`} />
        <use className="navigation-icon__detail" href={`${symbol}-detail`} />
        <use className="navigation-icon__accent" href={`${symbol}-accent`} />
        <use
          className="navigation-icon__line navigation-icon__line--base"
          href={`${symbol}-line`}
        />
      </svg>
    </span>
  );
}
