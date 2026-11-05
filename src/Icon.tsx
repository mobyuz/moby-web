const icons = {
  arrow: "M4 12h15m-6-6 6 6-6 6",
  external: "M7 17 17 7M8 7h9v9",
  back: "M20 12H5m6-6-6 6 6 6",
  chevron: "m6 9 6 6 6-6",
  message: "M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3.1A7.5 7.5 0 1 1 20 11.5Z",
  mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5Zm-3 6v1a6 6 0 0 0 12 0v-1m-6 7v4m-3 0h6",
  account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2",
  chart: "M4 20h16M7 16v-4m5 4V8m5 8V4",
  usb: "M12 3v14a3 3 0 0 1-3 3H7m5-17-3 3m3-3 3 3m-3 8h5l2-2m-7-2H7L5 8",
  shield: "m12 3 7 3v5c0 4-2.4 7.5-7 10-4.6-2.5-7-6-7-10V6l7-3Zm-3 9 2 2 4-4",
  eye: "M2 12s3.6-5 10-5 10 5 10 5-3.6 5-10 5-10-5-10-5Zm10 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  eyeOff: "M3 3l18 18M10 7.2c.6-.1 1.3-.2 2-.2 6.4 0 10 5 10 5a17 17 0 0 1-3.4 3.2M6 8.7A16.8 16.8 0 0 0 2 12s3.6 5 10 5c1.4 0 2.7-.2 3.8-.6",
  check: "m5 12 4 4L19 6",
  spark: "M12 3v4m0 10v4M3 12h4m10 0h4m-3.5-6.5-2.5 2.5m-6 6-2.5 2.5m0-11 2.5 2.5m6 6 2.5 2.5",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2",
  refresh: "M20 11a8 8 0 0 0-14.5-4M4 4v4h4m-4 5a8 8 0 0 0 14.5 4M20 20v-4h-4",
  send: "m21 3-9.5 18-2.2-7.8L3 11l18-8Zm-11.7 10.2L21 3",
  server: "M4 5h16v5H4V5Zm0 9h16v5H4v-5Zm3-6.5h.01M7 16.5h.01",
  download: "M12 4v11m-4-4 4 4 4-4M5 20h14",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3Z",
  bolt: "M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z",
} as const;

export function Icon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  );
}
