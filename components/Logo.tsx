export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-[22%] shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoTileGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7DD3FC" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="44" fill="url(#logoTileGrad)" />
      <path
        d="M100,26 C72.7,26 50,47.9 50,75.3 C50,108 84,154 95.6,166.4 C97.9,168.9 102.1,168.9 104.4,166.4 C116,154 150,108 150,75.3 C150,47.9 127.3,26 100,26 Z"
        fill="#16A34A"
        stroke="#0F3D2E"
        strokeWidth="6"
      />
    </svg>
  )
}
