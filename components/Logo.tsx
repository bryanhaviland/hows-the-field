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
        <clipPath id="logoPinClip">
          <path d="M100,26 C72.7,26 50,47.9 50,75.3 C50,108 84,154 95.6,166.4 C97.9,168.9 102.1,168.9 104.4,166.4 C116,154 150,108 150,75.3 C150,47.9 127.3,26 100,26 Z" />
        </clipPath>
      </defs>
      <rect width="200" height="200" rx="44" fill="url(#logoTileGrad)" />
      <g clipPath="url(#logoPinClip)">
        <rect width="200" height="200" fill="#16A34A" />
        <rect x="66" y="50" width="68" height="48" fill="none" stroke="#FFFFFF" strokeWidth="3.5" />
        <line x1="76" y1="50" x2="76" y2="98" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="100" y1="50" x2="100" y2="98" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="124" y1="50" x2="124" y2="98" stroke="#FFFFFF" strokeWidth="2" />
        <g transform="translate(100,140) rotate(45)">
          <rect x="-11" y="-11" width="22" height="22" fill="#C08552" stroke="#8A5A34" strokeWidth="2" />
        </g>
      </g>
      <path
        d="M100,26 C72.7,26 50,47.9 50,75.3 C50,108 84,154 95.6,166.4 C97.9,168.9 102.1,168.9 104.4,166.4 C116,154 150,108 150,75.3 C150,47.9 127.3,26 100,26 Z"
        fill="none"
        stroke="#0F3D2E"
        strokeWidth="5"
      />
    </svg>
  )
}
