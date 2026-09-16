type PaperActionIconName =
  "plus" | "scan" | "handwriting" | "flag-us" | "flag-br" | "flag-es" | "book";

export function PaperActionIcon({ name }: { name: PaperActionIconName }) {
  const flag = name.startsWith("flag-");
  return (
    <svg
      className="paper-action-icon"
      viewBox="0 0 48 48"
      aria-hidden="true"
      data-paper-icon={name}
    >
      {name === "plus" && (
        <>
          <path fill="#292432" d="M8 10 14 5h24l5 6-2 27-6 5H11l-6-6Z" />
          <path fill="#51465D" d="m8 10 6-5 4 7-5 24-8 1Z" />
          <path fill="#FFF9EF" d="M21 14h7v8h8v7h-8v8h-7v-8h-8v-7h8Z" />
          <path fill="#FACC15" d="m28 14 4 4-4 4Z" />
        </>
      )}
      {name === "scan" && (
        <>
          <path fill="#292432" d="M7 11 13 5h22l6 6v26l-6 6H13l-6-6Z" />
          <path fill="#51465D" d="m7 11 6-6 4 7-3 25H7Z" />
          <path fill="#FFF9EF" d="M14 15h20v22H14Z" />
          <path
            fill="#FACC15"
            d="M11 12h8v3h-5v5h-3Zm18 0h8v8h-3v-5h-5ZM11 29h3v5h5v3h-8Zm23 0h3v8h-8v-3h5Z"
          />
          <path fill="#292432" d="M18 22h12v3H18Zm0 6h9v3h-9Z" />
        </>
      )}
      {name === "handwriting" && (
        <>
          <path fill="#FFF9EF" d="M6 8 11 4h28l4 6-2 29-5 5H10l-5-6Z" />
          <path fill="#51465D" d="m36 44 5-5 2-29-6 7Z" />
          <path fill="#292432" d="m11 35 4-11L33 6l8 8-18 18Z" />
          <path fill="#7C3AED" d="m15 24 8 8-12 3Z" />
          <path fill="#FACC15" d="m33 6 8 8 3-6-5-5Z" />
        </>
      )}
      {name === "book" && (
        <>
          <path fill="#292432" d="M5 10 22 7l3 5 17-4 1 29-17 4-4-3-17 3Z" />
          <path fill="#FFF9EF" d="m9 13 11-2 2 23-12 3Zm17 2 12-3 1 22-12 3Z" />
          <path fill="#FACC15" d="m29 12 5-1 1 16-3-3-3 4Z" />
        </>
      )}
      {flag && (
        <>
          <path fill={name === "flag-br" ? "#27834A" : "#BE3341"} d="m4 12 39-3-1 31-37 3Z" />
          {name === "flag-br" ? (
            <>
              <path fill="#FACC15" d="m23 14 16 11-16 13L8 27Z" />
              <circle fill="#333C88" cx="23" cy="26" r="7" />
            </>
          ) : name === "flag-es" ? (
            <path fill="#FACC15" d="m4 20 39-3-1 15-37 3Z" />
          ) : (
            <>
              <path fill="#FFF9EF" d="m5 17 37-3v3L5 20Zm0 8 37-3v3L5 28Zm0 8 37-3v3L5 36Z" />
              <path fill="#333C88" d="m4 12 18-1v16L5 28Z" />
            </>
          )}
          <path fill="#fff" opacity=".18" d="m4 12 39-3-16 7L5 31Z" />
        </>
      )}
    </svg>
  );
}
