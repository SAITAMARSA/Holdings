import { useId } from "react";
import type { TwinColor } from "@/domain/schema";
import { type Expression, TWIN_COLORS } from "@/domain/twin";

/**
 * Temporary, original Twin character drawn in SVG: a rounded creature with
 * big eyes, small limbs, an aqua headband and dumbbells. Replace this
 * component's internals with a final illustration without touching callers.
 * Progress is shown through accessories and expression — never body size.
 */

interface Props {
  color: TwinColor;
  expression?: Expression;
  accessories?: readonly string[];
  size?: number;
  animate?: boolean;
  /** Accessible name. Pass "" when the Twin is purely decorative. */
  label?: string;
  className?: string;
}

const INK = "#2A2340";

export function TwinAvatar({
  color,
  expression = "happy",
  accessories = [],
  size = 160,
  animate = false,
  label = "Your Twin",
  className,
}: Props) {
  const c = TWIN_COLORS[color];
  const clip = useId();
  const has = (a: string) => accessories.includes(a);
  const armsUp = expression === "excited";
  const decorative = label === "";

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <g className={animate ? "motion-safe:animate-bob" : undefined} style={{ transformOrigin: "100px 170px" }}>
        {/* ground shadow */}
        <ellipse cx="100" cy="186" rx="52" ry="7" fill={INK} opacity="0.08" />

        {has("cape") && (
          <path d="M58 92 Q100 80 142 92 L170 176 Q100 190 30 176 Z" fill="#E5654D" stroke="#A63A26" strokeWidth="3" />
        )}

        {/* arms (behind body) with dumbbells */}
        <g>
          <g transform={armsUp ? "rotate(-120 52 118)" : "rotate(25 52 118)"}>
            <rect x="44" y="114" width="16" height="34" rx="8" fill={c.body} stroke={c.shade} strokeWidth="3" />
            <Dumbbell x={52} y={150} />
          </g>
          <g transform={armsUp ? "rotate(120 148 118)" : "rotate(-25 148 118)"}>
            <rect x="140" y="114" width="16" height="34" rx="8" fill={c.body} stroke={c.shade} strokeWidth="3" />
            <Dumbbell x={148} y={150} />
          </g>
        </g>

        {/* feet */}
        {has("sneakers") ? (
          <>
            <Sneaker x={78} />
            <Sneaker x={122} />
          </>
        ) : (
          <>
            <ellipse cx="78" cy="174" rx="15" ry="9" fill={c.shade} />
            <ellipse cx="122" cy="174" rx="15" ry="9" fill={c.shade} />
          </>
        )}

        {/* body */}
        <clipPath id={clip}>
          <path d="M100 44 C142 44 164 78 164 116 C164 154 138 174 100 174 C62 174 36 154 36 116 C36 78 58 44 100 44 Z" />
        </clipPath>
        <path
          d="M100 44 C142 44 164 78 164 116 C164 154 138 174 100 174 C62 174 36 154 36 116 C36 78 58 44 100 44 Z"
          fill={c.body}
        />
        <g clipPath={`url(#${clip})`}>
          <ellipse cx="100" cy="190" rx="90" ry="40" fill={c.shade} opacity="0.35" />
          <ellipse cx="74" cy="66" rx="26" ry="14" fill="#fff" opacity="0.22" />
        </g>
        <ellipse cx="100" cy="142" rx="34" ry="24" fill={c.belly} opacity="0.85" />

        {/* headband */}
        {!has("cap") && (
          <g>
            <path d="M42 88 Q100 64 158 88" stroke="#14A99F" strokeWidth="14" fill="none" strokeLinecap="round" />
            <path d="M42 88 Q100 64 158 88" stroke="#5FDCD3" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
            <path d="M156 86 Q172 72 180 78 Q170 86 158 90 Z" fill="#14A99F" />
            <path d="M156 88 Q174 94 176 104 Q164 100 154 92 Z" fill="#0E8780" />
          </g>
        )}
        {has("cap") && (
          <g>
            <path d="M48 84 Q52 40 100 38 Q148 40 152 84 Q100 70 48 84 Z" fill="#5734CC" />
            <path d="M48 84 Q100 70 152 84" stroke="#14A99F" strokeWidth="6" fill="none" />
            <path d="M120 78 Q160 70 182 86 Q150 88 124 86 Z" fill="#4527A3" />
            <circle cx="100" cy="40" r="5" fill="#14A99F" />
          </g>
        )}

        <Face expression={expression} />

        {has("sunglasses") && (
          <g>
            <rect x="58" y="96" width="38" height="26" rx="10" fill={INK} />
            <rect x="104" y="96" width="38" height="26" rx="10" fill={INK} />
            <path d="M96 106 Q100 102 104 106" stroke={INK} strokeWidth="4" fill="none" />
            <path d="M64 102 L76 102" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            <path d="M110 102 L122 102" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
          </g>
        )}

        {has("bottle") && (
          <g>
            <rect x="166" y="146" width="16" height="32" rx="6" fill="#6AB6FF" stroke="#3C8FE0" strokeWidth="2.5" />
            <rect x="169" y="140" width="10" height="8" rx="2" fill="#2A2340" />
            <rect x="169" y="156" width="10" height="10" rx="2" fill="#fff" opacity="0.7" />
          </g>
        )}

        {expression === "sleepy" && (
          <g fill={INK} opacity="0.55" fontFamily="inherit" fontWeight="800">
            <text x="150" y="58" fontSize="16">z</text>
            <text x="162" y="42" fontSize="12">z</text>
          </g>
        )}
      </g>
    </svg>
  );
}

function Dumbbell({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 14} y={y - 3} width="28" height="6" rx="3" fill="#8A93A8" />
      <rect x={x - 18} y={y - 10} width="8" height="20" rx="3" fill="#3B3552" />
      <rect x={x + 10} y={y - 10} width="8" height="20" rx="3" fill="#3B3552" />
    </g>
  );
}

function Sneaker({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 17} 178 Q${x - 17} 164 ${x} 164 Q${x + 17} 164 ${x + 18} 178 Z`} fill="#fff" stroke="#2A2340" strokeWidth="2.5" />
      <path d={`M${x - 10} 172 L${x + 10} 168`} stroke="#14A99F" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

function Face({ expression }: { expression: Expression }) {
  const openEyes = expression === "happy" || expression === "excited" || expression === "caring" || expression === "determined";
  return (
    <g>
      {openEyes ? (
        <>
          <ellipse cx="78" cy="110" rx="17" ry="19" fill="#fff" />
          <ellipse cx="122" cy="110" rx="17" ry="19" fill="#fff" />
          <circle cx="80" cy="113" r="9.5" fill={INK} />
          <circle cx="124" cy="113" r="9.5" fill={INK} />
          <circle cx="84" cy="108" r="3.6" fill="#fff" />
          <circle cx="128" cy="108" r="3.6" fill="#fff" />
          <circle cx="77" cy="117" r="1.6" fill="#fff" />
          <circle cx="121" cy="117" r="1.6" fill="#fff" />
        </>
      ) : expression === "calm" ? (
        <>
          <path d="M64 112 Q78 98 92 112" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M108 112 Q122 98 136 112" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M64 108 Q78 118 92 108" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M108 108 Q122 118 136 108" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
        </>
      )}

      {expression === "caring" && (
        <>
          <path d="M64 88 L88 84" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <path d="M112 84 L136 88" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {expression === "determined" && (
        <>
          <path d="M64 86 L90 92" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M110 92 L136 86" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
        </>
      )}

      {/* cheeks */}
      <ellipse cx="60" cy="132" rx="9" ry="5.5" fill="#FF8FA8" opacity="0.45" />
      <ellipse cx="140" cy="132" rx="9" ry="5.5" fill="#FF8FA8" opacity="0.45" />

      {/* mouth */}
      {expression === "excited" ? (
        <g>
          <path d="M86 134 Q100 156 114 134 Z" fill="#3B1F4A" />
          <path d="M93 145 Q100 152 107 145 Q100 141 93 145 Z" fill="#FF8FA8" />
        </g>
      ) : expression === "sleepy" ? (
        <ellipse cx="100" cy="140" rx="5" ry="4" fill="#3B1F4A" />
      ) : expression === "caring" ? (
        <path d="M91 140 Q100 146 109 140" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : expression === "determined" ? (
        <path d="M86 136 Q100 148 114 136 L86 136 Z" fill="#3B1F4A" />
      ) : (
        <path d="M86 135 Q100 150 114 135" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      )}
    </g>
  );
}
