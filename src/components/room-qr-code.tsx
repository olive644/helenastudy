import qrcode from "qrcode-generator";

export function RoomQrCode({ value, size = 152 }: { value: string; size?: number }) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const quietZone = 12;
  const qrSize = size - quietZone * 2;
  const cell = qrSize / count;
  let path = "";
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        path += `M${quietZone + col * cell},${quietZone + row * cell}h${cell}v${cell}h${-cell}z`;
      }
    }
  }
  return (
    <div className="helena-room-qr">
      <span className="helena-room-qr__ear helena-room-qr__ear--left" aria-hidden="true" />
      <span className="helena-room-qr__ear helena-room-qr__ear--right" aria-hidden="true" />
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label="QR code para entrar na sala"
      >
        <rect width={size} height={size} rx="10" fill="#fff" />
        <path d={path} fill="#0f0f14" />
      </svg>
      <span className="helena-room-qr__face" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="helena-room-qr__star" aria-hidden="true">
        ★
      </span>
    </div>
  );
}
