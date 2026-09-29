export default function GrowingTree() {
  return (
    <div className="grow-scene" aria-hidden="true">
      <svg className="grow-tree" viewBox="0 0 240 260">
        {/* sun */}
        <g className="gt-sun">
          <circle cx="205" cy="34" r="15" fill="#f9cf3f" />
          <circle cx="205" cy="34" r="22" fill="#f9cf3f" opacity="0.25" />
        </g>

        {/* clouds */}
        <g className="gt-cloud" fill="#ffffff" opacity="0.85">
          <ellipse cx="52" cy="42" rx="20" ry="9" />
          <ellipse cx="70" cy="36" rx="14" ry="8" />
        </g>
        <g className="gt-cloud gt-cloud-2" fill="#ffffff" opacity="0.7">
          <ellipse cx="150" cy="60" rx="16" ry="7" />
          <ellipse cx="164" cy="55" rx="11" ry="6" />
        </g>

        {/* ground */}
        <ellipse cx="120" cy="240" rx="72" ry="12" fill="#8d6e63" opacity="0.35" />
        <ellipse cx="120" cy="238" rx="46" ry="8" fill="#6d4c41" opacity="0.3" />

        {/* stage 1: seed */}
        <g className="gt-seed">
          <ellipse cx="120" cy="234" rx="8" ry="6" fill="#6d4c41" />
          <path d="M115 232 q5 -4 10 0" stroke="#4e342e" strokeWidth="1.5" fill="none" />
        </g>

        {/* stage 2: sprout */}
        <g className="gt-sprout">
          <path d="M120 234 C120 220 118 210 113 200" stroke="#43a047" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M116 214 C104 210 99 200 100 194 C110 197 116 205 116 214 Z" fill="#66bb6a" />
          <path d="M118 202 C128 192 138 190 143 193 C139 202 128 207 118 202 Z" fill="#66bb6a" />
        </g>

        {/* stage 3: sapling */}
        <g className="gt-sapling">
          <path d="M120 234 C120 210 120 185 118 158" stroke="#43a047" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M119 206 C104 200 98 188 99 180 C111 184 118 194 119 206 Z" fill="#4caf50" />
          <path d="M120 188 C134 180 144 178 150 181 C146 191 132 196 120 188 Z" fill="#4caf50" />
          <path d="M119 170 C106 164 101 153 102 146 C113 149 119 159 119 170 Z" fill="#66bb6a" />
          <path d="M118 158 C130 148 141 147 147 150 C142 159 129 164 118 158 Z" fill="#66bb6a" />
        </g>

        {/* stage 4: tree */}
        <g className="gt-tree">
          <g className="gt-tree-inner">
            <path
              d="M112 234 C114 205 115 185 113 168 L127 168 C125 185 126 205 128 234 Z"
              fill="#6d4c41"
            />
            <path d="M120 178 C112 162 104 154 92 148" stroke="#6d4c41" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M120 178 C130 160 140 152 152 148" stroke="#6d4c41" strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="120" cy="118" r="46" fill="#2e7d32" />
            <circle cx="88" cy="140" r="30" fill="#388e3c" />
            <circle cx="152" cy="140" r="30" fill="#388e3c" />
            <circle cx="104" cy="98" r="24" fill="#43a047" />
            <circle cx="140" cy="96" r="22" fill="#43a047" />
          </g>
        </g>

        {/* falling leaves while tree is up */}
        <g transform="translate(150 112)">
          <path className="gt-leaf gt-leaf-1" d="M0 0 C7 -6 14 -6 18 -2 C13 4 5 4 0 0 Z" fill="#81c784" />
        </g>
        <g transform="translate(90 122)">
          <path className="gt-leaf gt-leaf-2" d="M0 0 C7 -6 14 -6 18 -2 C13 4 5 4 0 0 Z" fill="#a5d6a7" />
        </g>
      </svg>
    </div>
  )
}
