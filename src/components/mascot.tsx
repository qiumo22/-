export function Mascot({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 460"
      className={className}
      role="img"
      aria-label="校园写作看板娘小笺"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="mascot-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a2c3f" />
          <stop offset="100%" stopColor="#7a4560" />
        </linearGradient>
        <linearGradient id="mascot-eye" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fb6e8" />
          <stop offset="100%" stopColor="#c94a76" />
        </linearGradient>
        <linearGradient id="mascot-skirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3555" />
          <stop offset="100%" stopColor="#2b2740" />
        </linearGradient>
        <linearGradient id="mascot-book" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7c9d8" />
          <stop offset="100%" stopColor="#f2a6bf" />
        </linearGradient>
      </defs>

      {/* twin tails */}
      <path
        d="M128 148 C70 162 48 240 62 322 C70 362 100 372 118 338 C100 286 104 214 148 178 Z"
        fill="url(#mascot-hair)"
        stroke="#3f2433"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M272 148 C330 162 352 240 338 322 C330 362 300 372 282 338 C300 286 296 214 252 178 Z"
        fill="url(#mascot-hair)"
        stroke="#3f2433"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* back hair */}
      <ellipse
        cx="200"
        cy="176"
        rx="108"
        ry="102"
        fill="url(#mascot-hair)"
        stroke="#3f2433"
        strokeWidth="3"
      />

      {/* neck */}
      <path
        d="M184 244 L216 244 L216 276 L184 276 Z"
        fill="#ffe6da"
        stroke="#3f2433"
        strokeWidth="3"
      />

      {/* face */}
      <ellipse
        cx="200"
        cy="184"
        rx="82"
        ry="78"
        fill="#ffe6da"
        stroke="#3f2433"
        strokeWidth="3"
      />

      {/* bangs */}
      <path
        d="M122 170 C118 108 158 86 200 86 C242 86 282 108 278 170 C262 150 246 140 228 138 C218 158 206 168 192 170 C178 160 156 150 122 170 Z"
        fill="url(#mascot-hair)"
        stroke="#3f2433"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M150 104 C170 116 182 132 186 150"
        stroke="#a06a88"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M232 100 C242 114 246 130 246 146"
        stroke="#a06a88"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* eyes */}
      <g>
        <ellipse
          cx="164"
          cy="200"
          rx="22"
          ry="27"
          fill="#fffafc"
          stroke="#3f2433"
          strokeWidth="3"
        />
        <ellipse cx="164" cy="202" rx="15" ry="20" fill="url(#mascot-eye)" />
        <circle cx="164" cy="205" r="7" fill="#2b1b24" />
        <circle cx="158" cy="195" r="5.5" fill="#fff" />
        <circle cx="170" cy="213" r="2.5" fill="#fff" opacity="0.85" />
        <path
          d="M142 182 C152 172 178 172 186 184"
          stroke="#3f2433"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      <g>
        <ellipse
          cx="236"
          cy="200"
          rx="22"
          ry="27"
          fill="#fffafc"
          stroke="#3f2433"
          strokeWidth="3"
        />
        <ellipse cx="236" cy="202" rx="15" ry="20" fill="url(#mascot-eye)" />
        <circle cx="236" cy="205" r="7" fill="#2b1b24" />
        <circle cx="230" cy="195" r="5.5" fill="#fff" />
        <circle cx="242" cy="213" r="2.5" fill="#fff" opacity="0.85" />
        <path
          d="M214 184 C222 172 248 172 258 182"
          stroke="#3f2433"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* eyebrows */}
      <path
        d="M140 166 C152 160 176 160 188 166"
        stroke="#5a3548"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M212 166 C224 160 248 160 260 166"
        stroke="#5a3548"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* blush */}
      <ellipse cx="132" cy="224" rx="16" ry="8" fill="#f7b6c8" opacity="0.7" />
      <ellipse cx="268" cy="224" rx="16" ry="8" fill="#f7b6c8" opacity="0.7" />

      {/* nose and mouth */}
      <path
        d="M198 214 C200 216 202 216 204 214"
        stroke="#d99aa9"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M186 230 C194 240 206 240 214 230"
        stroke="#a84a66"
        strokeWidth="3"
        strokeLinecap="round"
        fill="#f7b6c8"
        fillOpacity="0.35"
      />

      {/* blouse */}
      <path
        d="M150 270 C122 286 106 316 100 352 L300 352 C294 316 278 286 250 270 C232 286 220 294 200 300 C180 294 168 286 150 270 Z"
        fill="#fffaf8"
        stroke="#3f2433"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* collar */}
      <path
        d="M170 272 L200 300 L230 272 L220 262 L200 282 L180 262 Z"
        fill="#fdeaf0"
        stroke="#3f2433"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* ribbon */}
      <path
        d="M200 284 C186 272 174 280 179 294 C183 305 196 298 200 292 C204 298 217 305 221 294 C226 280 214 272 200 284 Z"
        fill="#c94a76"
        stroke="#3f2433"
        strokeWidth="2"
      />
      <circle
        cx="200"
        cy="289"
        r="5"
        fill="#e86a92"
        stroke="#3f2433"
        strokeWidth="2"
      />

      {/* sleeves */}
      <path
        d="M150 276 C128 292 118 322 122 352 L152 352 C152 322 160 300 172 288 Z"
        fill="#fffaf8"
        stroke="#3f2433"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M250 276 C272 292 282 322 278 352 L248 352 C248 322 240 300 228 288 Z"
        fill="#fffaf8"
        stroke="#3f2433"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* skirt */}
      <path
        d="M140 352 L118 422 L282 422 L260 352 Z"
        fill="url(#mascot-skirt)"
        stroke="#2b2740"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M165 354 L158 420 M200 354 L200 422 M235 354 L242 420"
        stroke="#4a4566"
        strokeWidth="3"
        opacity="0.8"
      />

      {/* notebook */}
      <g transform="rotate(-6 200 340)">
        <rect
          x="145"
          y="318"
          width="110"
          height="80"
          rx="10"
          fill="url(#mascot-book)"
          stroke="#3f2433"
          strokeWidth="3"
        />
        <rect
          x="156"
          y="329"
          width="88"
          height="58"
          rx="6"
          fill="#fffafc"
          stroke="#e0a9bb"
          strokeWidth="2"
        />
        <path
          d="M200 332 L207 345 L221 347 L211 357 L213 371 L200 364 L187 371 L189 357 L179 347 L193 345 Z"
          fill="#f2c14e"
          opacity="0.9"
        />
      </g>
      <circle
        cx="148"
        cy="360"
        r="14"
        fill="#ffe6da"
        stroke="#3f2433"
        strokeWidth="3"
      />
      <circle
        cx="252"
        cy="360"
        r="14"
        fill="#ffe6da"
        stroke="#3f2433"
        strokeWidth="3"
      />

      {/* hairpin */}
      <g transform="translate(270 128)">
        <path
          d="M0 -16 C8 -16 12 -8 7 -2 C14 1 14 9 7 12 C4 19 -4 19 -7 12 C-14 9 -14 1 -7 -2 C-12 -8 -8 -16 0 -16 Z"
          fill="#f7a8c4"
          stroke="#c94a76"
          strokeWidth="2"
        />
        <circle cx="0" cy="0" r="4" fill="#f2c14e" />
      </g>

      {/* sparkles */}
      <path
        d="M82 118 L87 130 L99 135 L87 140 L82 152 L77 140 L65 135 L77 130 Z"
        fill="#f2c14e"
        opacity="0.9"
      />
      <path
        d="M318 180 L322 189 L331 193 L322 197 L318 206 L314 197 L305 193 L314 189 Z"
        fill="#f7a8c4"
        opacity="0.9"
      />
      <path
        d="M92 300 L96 309 L105 313 L96 317 L92 326 L88 317 L79 313 L88 309 Z"
        fill="#7fb6e8"
        opacity="0.7"
      />
    </svg>
  );
}
