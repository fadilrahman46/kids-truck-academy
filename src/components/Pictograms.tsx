import { useId } from 'react';
import type { CargoTypeId, MolenBlueprintId, VehicleId, WasteKind } from '../types/game';

interface IconProps {
  className?: string;
}

const INK = '#4A321F';

/**
 * Richly shaded 2D realistic storybook SVG illustrations designed for pre-readers (ages 2–6),
 * featuring layered painterly gradients, warm sepia ink linework, specular highlights, and grounded shadows.
 */
export function BlueprintPictogram({
  type,
  className = 'h-7 w-7',
}: {
  type: MolenBlueprintId;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');

  switch (type) {
    case 'house':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-roof`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>
            <linearGradient id={`${uid}-wall`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF3C7" />
              <stop offset="100%" stopColor="#E9C788" />
            </linearGradient>
            <linearGradient id={`${uid}-win`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#7DD3FC" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="31.5" rx="13" ry="2.2" fill="#7A4B21" opacity="0.22" />
          <rect x="23" y="7" width="3.5" height="7" rx="0.8" fill="#B45309" stroke={INK} strokeWidth="1" />
          <rect x="8" y="16" width="20" height="14.5" rx="1.6" fill={`url(#${uid}-wall)`} stroke={INK} strokeWidth="1.2" />
          <path d="M4.5 17.2L18 6l13.5 11.2H4.5z" fill={`url(#${uid}-roof)`} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M10 14.5h16" stroke="#FED7AA" strokeWidth="1" opacity="0.65" />
          <rect x="15" y="21.5" width="6" height="9" rx="1.2" fill="#8B5A2B" stroke={INK} strokeWidth="1" />
          <circle cx="19.5" cy="26.2" r="0.8" fill="#FDE68A" />
          <rect x="10.2" y="19.2" width="3.6" height="3.8" rx="0.7" fill={`url(#${uid}-win)`} stroke={INK} strokeWidth="0.9" />
          <rect x="22.2" y="19.2" width="3.6" height="3.8" rx="0.7" fill={`url(#${uid}-win)`} stroke={INK} strokeWidth="0.9" />
        </svg>
      );
    case 'tower':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-spire`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <linearGradient id={`${uid}-stone`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="65%" stopColor="#E5B96B" />
              <stop offset="100%" stopColor="#C99649" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="32" rx="11.5" ry="2.1" fill="#7A4B21" opacity="0.22" />
          <rect x="10.5" y="19" width="15" height="12" rx="1.5" fill={`url(#${uid}-stone)`} stroke={INK} strokeWidth="1.2" />
          <rect x="12.2" y="11" width="11.6" height="8.5" rx="1.2" fill={`url(#${uid}-stone)`} stroke={INK} strokeWidth="1.2" />
          <path d="M18 3.2l7.5 8.3h-15L18 3.2z" fill={`url(#${uid}-spire)`} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="15.8" y="13.5" width="4.4" height="4.2" rx="2" fill="#BAE6FD" stroke={INK} strokeWidth="0.9" />
          <path d="M15.4 31v-6a2.6 2.6 0 0 1 5.2 0v6z" fill="#78350F" stroke={INK} strokeWidth="1" />
        </svg>
      );
    case 'bridge':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-deck`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>
          <path d="M3 29.5c5-1.5 10 1.5 15 0s10 1.5 15 0" stroke={`url(#${uid}-water)`} strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <rect x="6" y="19" width="5.2" height="10" rx="1" fill="#C28848" stroke={INK} strokeWidth="1.1" />
          <rect x="24.8" y="19" width="5.2" height="10" rx="1" fill="#C28848" stroke={INK} strokeWidth="1.1" />
          <path d="M7.5 16.5C11 9.5 25 9.5 28.5 16.5" stroke="#DC2626" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M12.5 12.2v4.5M18 11v5.5M23.5 12.2v4.5" stroke="#7A4B21" strokeWidth="1.1" />
          <rect x="3.5" y="16" width="29" height="4.2" rx="1.4" fill={`url(#${uid}-deck)`} stroke={INK} strokeWidth="1.1" />
        </svg>
      );
  }
}

export function CargoPictogram({ type, className = 'h-8 w-8' }: { type: CargoTypeId; className?: string }) {
  const uid = useId().replace(/:/g, '');

  switch (type) {
    case 'apple':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-ap`} cx="35%" cy="32%" r="68%">
              <stop offset="0%" stopColor="#FF8A7A" />
              <stop offset="45%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#991B1B" />
            </radialGradient>
            <linearGradient id={`${uid}-lf`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="31.5" rx="9" ry="2.2" fill="#7A4B21" opacity="0.22" />
          <path d="M18 10.5c-5-2.6-11 .6-11 7.8C7 25.4 11.9 31 15.8 31c1.4 0 1.9-.6 2.2-.6s.8.6 2.2.6c3.9 0 8.8-5.6 8.8-12.7 0-7.2-6-10.4-11-7.8z" fill={`url(#${uid}-ap)`} stroke={INK} strokeWidth="1.2" />
          <ellipse cx="13.2" cy="15.8" rx="2.1" ry="4" transform="rotate(-18 13.2 15.8)" fill="#FFF5F5" opacity="0.45" />
          <path d="M18 10.5c0-2.8 1.2-5 2.8-6.1" stroke="#6B3A18" strokeWidth="2.3" strokeLinecap="round" fill="none" />
          <path d="M18.8 8.8c2.6-3 6.6-2.7 8.1-.2-2.2 2.4-5.7 2.7-8.1.2z" fill={`url(#${uid}-lf)`} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
        </svg>
      );
    case 'wood':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-bark`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C97C36" />
              <stop offset="55%" stopColor="#9A531E" />
              <stop offset="100%" stopColor="#6D3711" />
            </linearGradient>
            <radialGradient id={`${uid}-cut`} cx="45%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="100%" stopColor="#E6B87A" />
            </radialGradient>
          </defs>
          <ellipse cx="18" cy="31" rx="12.5" ry="2.2" fill="#7A4B21" opacity="0.22" />
          <rect x="4.5" y="18" width="24" height="10" rx="4.5" fill={`url(#${uid}-bark)`} stroke={INK} strokeWidth="1.2" />
          <ellipse cx="26.5" cy="23" rx="3.4" ry="4.8" fill={`url(#${uid}-cut)`} stroke={INK} strokeWidth="1.1" />
          <ellipse cx="26.5" cy="23" rx="1.6" ry="2.3" fill="none" stroke="#B47638" strokeWidth="0.9" />
          <rect x="7" y="9" width="22" height="9.5" rx="4.5" fill={`url(#${uid}-bark)`} stroke={INK} strokeWidth="1.2" />
          <ellipse cx="10.2" cy="13.8" rx="3.2" ry="4.5" fill={`url(#${uid}-cut)`} stroke={INK} strokeWidth="1.1" />
          <circle cx="10.2" cy="13.8" r="1.4" fill="none" stroke="#B47638" strokeWidth="0.9" />
          <path d="M15.5 13h9.5M8.5 22.5h12" stroke="#FDE68A" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
        </svg>
      );
    case 'box':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-bx`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>
            <linearGradient id={`${uid}-rib`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="31.5" rx="11.5" ry="2.2" fill="#7A4B21" opacity="0.22" />
          <rect x="6.5" y="13.5" width="23" height="16.5" rx="2.5" fill={`url(#${uid}-bx)`} stroke={INK} strokeWidth="1.2" />
          <rect x="5" y="9" width="26" height="5.8" rx="2" fill="#C4B5FD" stroke={INK} strokeWidth="1.2" />
          <rect x="15.5" y="9" width="5" height="21" fill={`url(#${uid}-rib)`} stroke={INK} strokeWidth="1" />
          <path d="M18 9c-3.4-4-7.5-2.8-6.6 0 .6 1.8 4.2 1.2 6.6 0zm0 0c3.4-4 7.5-2.8 6.6 0-.6 1.8-4.2 1.2-6.6 0z" fill="#FACC15" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    case 'brick':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-br1`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#C2410C" />
            </linearGradient>
            <linearGradient id={`${uid}-br2`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#9A3412" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="31" rx="13.5" ry="2.2" fill="#7A4B21" opacity="0.22" />
          <rect x="3.5" y="20" width="13.5" height="9" rx="1.6" fill={`url(#${uid}-br1)`} stroke={INK} strokeWidth="1.2" />
          <rect x="19" y="20" width="13.5" height="9" rx="1.6" fill={`url(#${uid}-br2)`} stroke={INK} strokeWidth="1.2" />
          <rect x="10.5" y="9.5" width="15" height="9.2" rx="1.6" fill={`url(#${uid}-br1)`} stroke={INK} strokeWidth="1.2" />
          <path d="M12.5 12h11M5.5 22.5h9M21 22.5h9" stroke="#FED7AA" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
  }
}

export function WastePictogram({ kind, className = 'h-8 w-8' }: { kind: WasteKind; className?: string }) {
  const uid = useId().replace(/:/g, '');

  switch (kind) {
    case 'banana':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-bn`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="55%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="30.5" rx="11" ry="2.1" fill="#7A4B21" opacity="0.2" />
          <path d="M16.5 6.5h3v4.5c4.6 1.4 8.5 6.8 9.5 13.5-4 1.1-7.4-1.6-9.5-6-1.4 5-5.2 8.4-10.8 8.4 1.6-6.2 4.6-12.2 7.8-15.6V6.5z" fill={`url(#${uid}-bn)`} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="16.3" y="5.5" width="3.4" height="3.2" rx="0.8" fill="#78350F" stroke={INK} strokeWidth="0.9" />
          <path d="M14.5 16.5c-1.5 2.5-2.6 5.2-3.2 7.8" stroke="#FFFBEB" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case 'apple_core':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-ac`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="31" rx="9" ry="2" fill="#7A4B21" opacity="0.2" />
          <path d="M11 9.5c2.2-2 11.8-2 14 0-1.8 2.2-4.5 2.8-4.5 8.5s2.7 6.3 4.5 8.5c-2.2 2-11.8 2-14 0 1.8-2.2 4.5-2.8 4.5-8.5S12.8 11.7 11 9.5z" fill={`url(#${uid}-ac)`} stroke={INK} strokeWidth="1.15" />
          <path d="M11 9.5c2.8-2.3 11.2-2.3 14 0-2.4 2.4-11.6 2.4-14 0z" fill="#DC2626" stroke={INK} strokeWidth="1" />
          <path d="M11 26.5c2.8 2.3 11.2 2.3 14 0-2.4-2.4-11.6-2.4-14 0z" fill="#DC2626" stroke={INK} strokeWidth="1" />
          <ellipse cx="16.8" cy="17" rx="1" ry="1.4" fill="#5C3116" />
          <ellipse cx="19.3" cy="19.5" rx="1" ry="1.4" fill="#5C3116" />
          <path d="M18 7.5V4" stroke="#6B3A18" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-lf`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="60%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="30.5" rx="10" ry="2" fill="#7A4B21" opacity="0.2" />
          <path d="M8 27C8 14.5 17 6.5 29 6.5c0 12.5-8 21.5-20 21.5l-1-1z" fill={`url(#${uid}-lf)`} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M7 29L24 12" stroke="#14532D" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M15.5 20.5h6M19 17v-5" stroke="#14532D" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'bottle':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-bt`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#BAE6FD" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="31.5" rx="7.5" ry="2" fill="#7A4B21" opacity="0.2" />
          <rect x="14.5" y="4" width="7" height="3.8" rx="1.2" fill="#0369A1" stroke={INK} strokeWidth="1.1" />
          <path d="M14.5 7.8h7l2.8 5V28a2.8 2.8 0 0 1-2.8 2.8h-7A2.8 2.8 0 0 1 11.7 28V12.8l2.8-5z" fill={`url(#${uid}-bt)`} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="11.7" y="16.5" width="12.6" height="6.5" fill="#F0F9FF" stroke={INK} strokeWidth="0.9" />
          <path d="M15 13v13" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.72" />
        </svg>
      );
    case 'can':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-cn`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="55%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="31" rx="8.5" ry="2" fill="#7A4B21" opacity="0.22" />
          <rect x="10.2" y="7.5" width="15.6" height="22" rx="3" fill={`url(#${uid}-cn)`} stroke={INK} strokeWidth="1.2" />
          <ellipse cx="18" cy="8" rx="7.8" ry="2.3" fill="#F1F5F9" stroke={INK} strokeWidth="1.1" />
          <rect x="10.2" y="14" width="15.6" height="8" fill="#2563EB" stroke={INK} strokeWidth="0.9" />
          <path d="M13.5 11v15.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case 'cardboard':
      return (
        <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-cb`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E6A962" />
              <stop offset="100%" stopColor="#B46825" />
            </linearGradient>
          </defs>
          <ellipse cx="18" cy="31" rx="12" ry="2.2" fill="#7A4B21" opacity="0.22" />
          <rect x="6" y="11" width="24" height="18.5" rx="2" fill={`url(#${uid}-cb)`} stroke={INK} strokeWidth="1.2" />
          <path d="M6 11.5L10.5 7h15L30 11.5H6z" fill="#F3C382" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="15" y="7" width="6" height="10" fill="#FEF3C7" stroke={INK} strokeWidth="0.9" />
          <path d="M10 23.5h7" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

export function LetterPictogram({ letter, className = 'h-7 w-7' }: { letter: string } & IconProps) {
  const uid = useId().replace(/:/g, '');

  switch (letter.toUpperCase()) {
    case 'A':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FEF08A" />
              <stop offset="55%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          <path d="M14 2.5c2.4 4.2 7 6.5 7 12.8a7 7 0 1 1-14 0c0-3.6 2.1-6.4 4.2-8.2.2 2.3 1.2 3.4 2.1 3.7C12.8 7.8 13.1 4.8 14 2.5z" fill={`url(#${uid}-a)`} stroke={INK} strokeWidth="1.1" />
          <path d="M14 12.5c1.5 1.8 3.2 3.3 3.2 5.8a3.2 3.2 0 0 1-6.4 0c0-2.1 1.4-4 3.2-5.8z" fill="#FEF9C3" />
        </svg>
      );
    case 'B':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-b`} cx="35%" cy="32%" r="68%">
              <stop offset="0%" stopColor="#FEF9C3" />
              <stop offset="55%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#C2410C" />
            </radialGradient>
          </defs>
          <circle cx="14" cy="14" r="10.2" fill={`url(#${uid}-b)`} stroke={INK} strokeWidth="1.2" />
          <path d="M14 3.8a10 10 0 0 0 0 20.4M3.8 14h20.4" stroke="#7C2D12" strokeWidth="1.6" fill="none" />
          <circle cx="14" cy="14" r="3.2" fill="#EF4444" stroke={INK} strokeWidth="1" />
        </svg>
      );
    case 'C':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="9.8" cy="19" r="4.8" fill="#EF4444" stroke={INK} strokeWidth="1.1" />
          <circle cx="18.6" cy="18" r="4.8" fill="#DC2626" stroke={INK} strokeWidth="1.1" />
          <circle cx="8.4" cy="17.4" r="1.2" fill="#FFF5F5" opacity="0.65" />
          <circle cx="17.2" cy="16.4" r="1.2" fill="#FFF5F5" opacity="0.65" />
          <path d="M10.5 14.5C11.5 9.2 15 5.8 18.8 4.8c-1.2 4-.5 7.5 0 8.5" stroke="#15803D" strokeWidth="2.1" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 'D':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M5.5 22.5C5.5 12 12.5 5 23 5c0 10.5-7 17.5-17.5 17.5z" fill="#4ADE80" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M5 23L19 9" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'E':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M3.5 15c3.5-5.8 7-5.8 10.5-1.2 3.5-4.6 7-4.6 10.5 1.2-4.6-1.2-7 1.2-10.5 4.8-3.5-3.6-5.9-6-10.5-4.8z" fill="#D97706" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="14" cy="13.5" r="2.2" fill="#FEF3C7" stroke={INK} strokeWidth="0.9" />
        </svg>
      );
    case 'F':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <rect x="3.5" y="8" width="21" height="14" rx="3.2" fill="#F59E0B" stroke={INK} strokeWidth="1.2" />
          <path d="M9.5 8l1.8-3h5.4L18.5 8" fill="#D97706" stroke={INK} strokeWidth="1.1" />
          <circle cx="14" cy="15" r="4.2" fill="#1E293B" stroke={INK} strokeWidth="1" />
          <circle cx="14" cy="15" r="2" fill="#38BDF8" />
        </svg>
      );
    case 'G':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="7.5" cy="13" r="4.6" fill="#CBD5E1" stroke={INK} strokeWidth="1.1" />
          <circle cx="20.5" cy="13" r="4.6" fill="#CBD5E1" stroke={INK} strokeWidth="1.1" />
          <circle cx="14" cy="14" r="6.8" fill="#E2E8F0" stroke={INK} strokeWidth="1.1" />
          <path d="M14 16.5v5.5a2.2 2.2 0 0 0 2.4 2" stroke="#64748B" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <circle cx="11.6" cy="13" r="1.2" fill="#1E293B" />
          <circle cx="16.4" cy="13" r="1.2" fill="#1E293B" />
        </svg>
      );
    case 'H':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M8 16h12a4.5 4.5 0 0 0 .6-9A5.8 5.8 0 0 0 9.4 6 4 4 0 0 0 8 16z" fill="#F8FAFC" stroke={INK} strokeWidth="1.15" />
          <path d="M9.5 19.5l-1.2 3.5M14 19.5l-1.2 3.5M18.5 19.5l-1.2 3.5" stroke="#0284C7" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      );
    case 'I':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M7.5 14L2.5 9.2v9.6L7.5 14z" fill="#0284C7" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          <ellipse cx="15.5" cy="14" rx="8.2" ry="5.5" fill="#38BDF8" stroke={INK} strokeWidth="1.15" />
          <circle cx="19.5" cy="12.8" r="1.4" fill="#0F172A" />
        </svg>
      );
    case 'J':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="15.2" r="8.2" fill="#FB923C" stroke={INK} strokeWidth="1.2" />
          <circle cx="11.5" cy="12.5" r="2.2" fill="#FEF08A" opacity="0.6" />
          <path d="M14 7c2.3-2.3 4.8-2.3 5.8-1-1.4 2.1-3.6 2.1-5.8 1z" fill="#22C55E" stroke={INK} strokeWidth="0.9" />
        </svg>
      );
    case 'K':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M14 4.5v11.8h8.2L14 4.5z" fill="#FFFDF7" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M4.5 17.5h19l-2.8 5.2H7.3l-2.8-5.2z" fill="#D97706" stroke={INK} strokeWidth="1.15" strokeLinejoin="round" />
        </svg>
      );
    case 'L':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="11.8" r="6.4" fill="#FEF08A" stroke={INK} strokeWidth="1.15" />
          <rect x="11" y="18.2" width="6" height="4.2" rx="1.2" fill="#CBD5E1" stroke={INK} strokeWidth="1.1" />
        </svg>
      );
    case 'M':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M5.5 15.2l2.4-5.2h12.2l2.4 5.2v4.8H5.5v-4.8z" fill="#F59E0B" stroke={INK} strokeWidth="1.15" strokeLinejoin="round" />
          <circle cx="9.2" cy="20.5" r="2.4" fill="#1E293B" />
          <circle cx="18.8" cy="20.5" r="2.4" fill="#1E293B" />
        </svg>
      );
    case 'N':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M10.5 9.5L14 3.5l3.5 6L14 7.8l-3.5 1.7z" fill="#22C55E" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
          <ellipse cx="14" cy="16.8" rx="6.4" ry="7.4" fill="#FACC15" stroke={INK} strokeWidth="1.15" />
          <path d="M10 14l8 5.6M18 14l-8 5.6" stroke="#B45309" strokeWidth="1.4" />
        </svg>
      );
    case 'O':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="15.2" r="8.2" fill="#F97316" stroke={INK} strokeWidth="1.2" />
          <path d="M14 7c1.8-2.3 4.1-2.3 5.2-1.1-1.2 1.8-3.5 1.8-5.2 1.1z" fill="#22C55E" stroke={INK} strokeWidth="0.9" />
        </svg>
      );
    case 'P':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <rect x="12.2" y="16" width="3.6" height="7.5" rx="1" fill="#9A531E" stroke={INK} strokeWidth="1" />
          <circle cx="14" cy="11.5" r="7" fill="#22C55E" stroke={INK} strokeWidth="1.15" />
        </svg>
      );
    case 'Q':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M4.5 19.5L6.2 9l4.8 5.2L14 7l3 7.2L21.8 9l1.7 10.5h-19z" fill="#FACC15" stroke={INK} strokeWidth="1.15" strokeLinejoin="round" />
          <rect x="4.5" y="19.5" width="19" height="3" rx="1" fill="#D97706" stroke={INK} strokeWidth="1" />
        </svg>
      );
    case 'R':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="9.4" fill="#334155" stroke={INK} strokeWidth="1.2" />
          <circle cx="14" cy="14" r="4.6" fill="#E2E8F0" stroke={INK} strokeWidth="1" />
          <circle cx="14" cy="14" r="1.8" fill="#DC2626" />
        </svg>
      );
    case 'S':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="5.8" fill="#FACC15" stroke={INK} strokeWidth="1.15" />
          <path d="M14 2.5v3.2M14 22.3v3.2M2.5 14h3.2M22.3 14h3.2M6 6l2.2 2.2M19.8 19.8L22 22M22 6l-2.2 2.2M8.2 19.8L6 22" stroke="#D97706" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      );
    case 'T':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <rect x="3.5" y="9.2" width="12.8" height="9.4" rx="1.6" fill="#F59E0B" stroke={INK} strokeWidth="1.15" />
          <path d="M16.3 11.6h5.2l3 3.5v3.5h-8.2v-7z" fill="#EF4444" stroke={INK} strokeWidth="1.15" strokeLinejoin="round" />
          <circle cx="8.8" cy="19.8" r="2.4" fill="#1E293B" />
          <circle cx="20.4" cy="19.8" r="2.4" fill="#1E293B" />
        </svg>
      );
    case 'U':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M4.5 15.2a9.5 9.5 0 0 1 19 0h-19z" fill="#F59E0B" stroke={INK} strokeWidth="1.15" strokeLinejoin="round" />
          <path d="M14 15.2v7a2.3 2.3 0 0 1-4.6 0" stroke={INK} strokeWidth="2.1" strokeLinecap="round" fill="none" />
        </svg>
      );
    case 'V':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="7.5" r="3.5" fill="#FACC15" stroke={INK} strokeWidth="1" />
          <path d="M14 11v3" stroke="#15803D" strokeWidth="2.1" />
          <path d="M9.8 14h8.4l1.8 8.8a2.2 2.2 0 0 1-2.2 2.4h-7.6A2.2 2.2 0 0 1 8 22.8L9.8 14z" fill="#38BDF8" stroke={INK} strokeWidth="1.15" strokeLinejoin="round" />
        </svg>
      );
    case 'W':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M16.5 4.8l2.2 4.5 4.5-1.2-3.4 3.4" stroke="#16A34A" strokeWidth="2.1" strokeLinecap="round" fill="none" />
          <path d="M18.8 9.2L7 22.2l-1.2-1.2 9.4-14 3.6 2.2z" fill="#F97316" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
        </svg>
      );
    case 'X':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <rect x="4.5" y="7" width="3.6" height="14" rx="1.1" fill="#FACC15" stroke={INK} strokeWidth="1" />
          <rect x="9.8" y="8.8" width="3.6" height="10.4" rx="1.1" fill="#22C55E" stroke={INK} strokeWidth="1" />
          <rect x="15.1" y="10.6" width="3.6" height="6.8" rx="1.1" fill="#38BDF8" stroke={INK} strokeWidth="1" />
          <rect x="20.4" y="12" width="3.2" height="4.2" rx="1" fill="#A855F7" stroke={INK} strokeWidth="1" />
        </svg>
      );
    case 'Y':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <path d="M14 3.5v5.8" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <circle cx="14" cy="16.4" r="7.5" fill="#FACC15" stroke={INK} strokeWidth="1.15" />
          <circle cx="14" cy="16.4" r="3.2" fill="#F97316" stroke={INK} strokeWidth="1" />
        </svg>
      );
    case 'Z':
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <rect x="4.5" y="6" width="19" height="16" rx="4.5" fill="#FFFDF7" stroke={INK} strokeWidth="1.2" />
          <path d="M8.5 6l2.2 16M13.6 6l2.2 16M18.8 6l1.8 16" stroke="#1E293B" strokeWidth="2.3" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
          <circle cx="14" cy="14" r="8" fill="#FACC15" stroke={INK} strokeWidth="1.1" />
        </svg>
      );
  }
}

export function VehicleStickerPictogram({
  vehicleId,
  className = 'h-12 w-12',
}: {
  vehicleId: VehicleId;
  className?: string;
}) {
  switch (vehicleId) {
    case 'molen':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <ellipse cx="24" cy="40.5" rx="18" ry="2.6" fill="#7A4B21" opacity="0.2" />
          <rect x="6" y="28" width="34" height="6" rx="2" fill="#475569" stroke={INK} strokeWidth="1.2" />
          <ellipse cx="19" cy="21" rx="11" ry="8" transform="rotate(-14 19 21)" fill="#F59E0B" stroke={INK} strokeWidth="1.2" />
          <path d="M13 17l5 9M20 15l5 10" stroke="#FEF3C7" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 18h8l4 6v7H30V18z" fill="#D97706" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="33" y="20" width="6" height="4.5" rx="1" fill="#BAE6FD" stroke={INK} strokeWidth="0.9" />
          <circle cx="14" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="14" cy="36" r="2" fill="#CBD5E1" />
          <circle cx="34" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="34" cy="36" r="2" fill="#CBD5E1" />
        </svg>
      );
    case 'angkut':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <ellipse cx="24" cy="40.5" rx="18" ry="2.6" fill="#7A4B21" opacity="0.2" />
          <rect x="6" y="16" width="22" height="14" rx="2" fill="#F59E0B" stroke={INK} strokeWidth="1.2" />
          <circle cx="13" cy="14" r="3.5" fill="#EF4444" stroke={INK} strokeWidth="1" />
          <circle cx="21" cy="14" r="3.5" fill="#EF4444" stroke={INK} strokeWidth="1" />
          <path d="M29 19h8l5 5v7H29V19z" fill="#2563EB" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="32" y="21" width="6" height="4.5" rx="1" fill="#DBEAFE" stroke={INK} strokeWidth="0.9" />
          <rect x="6" y="29" width="36" height="4" rx="1.5" fill="#334155" />
          <circle cx="14" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="14" cy="36" r="2" fill="#CBD5E1" />
          <circle cx="35" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="35" cy="36" r="2" fill="#CBD5E1" />
        </svg>
      );
    case 'tangki':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <ellipse cx="24" cy="40.5" rx="18" ry="2.6" fill="#7A4B21" opacity="0.2" />
          <rect x="6" y="16" width="24" height="14" rx="7" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" />
          <path d="M8 24h20a6 6 0 0 1-6 5H14a6 6 0 0 1-6-5z" fill="#38BDF8" />
          <path d="M30 19h8l4 5v7H30V19z" fill="#0284C7" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="33" y="21" width="5.5" height="4.5" rx="1" fill="#BAE6FD" stroke={INK} strokeWidth="0.9" />
          <rect x="7" y="29" width="35" height="4" rx="1.5" fill="#334155" />
          <circle cx="14" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="14" cy="36" r="2" fill="#CBD5E1" />
          <circle cx="35" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="35" cy="36" r="2" fill="#CBD5E1" />
        </svg>
      );
    case 'crane':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <ellipse cx="26" cy="40.5" rx="16" ry="2.6" fill="#7A4B21" opacity="0.2" />
          <path d="M24 24L11 9" stroke="#EAB308" strokeWidth="4" strokeLinecap="round" />
          <path d="M11 10v10" stroke="#475569" strokeWidth="2" />
          <rect x="7.5" y="19" width="7" height="6" rx="1" fill="#3B82F6" stroke={INK} strokeWidth="1" />
          <rect x="19" y="21" width="11" height="9" rx="2" fill="#CA8A04" stroke={INK} strokeWidth="1.2" />
          <path d="M30 19h8l4 5v7H30V19z" fill="#EAB308" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="33" y="21" width="5.5" height="4.5" rx="1" fill="#FEF9C3" stroke={INK} strokeWidth="0.9" />
          <rect x="16" y="29" width="26" height="4" rx="1.5" fill="#334155" />
          <circle cx="21" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="21" cy="36" r="2" fill="#CBD5E1" />
          <circle cx="36" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="36" cy="36" r="2" fill="#CBD5E1" />
        </svg>
      );
    case 'pemadam':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <ellipse cx="24" cy="40" rx="18" ry="2.6" fill="#7A4B21" opacity="0.2" />
          <rect x="33" y="14" width="4" height="3.5" rx="1" fill="#38BDF8" stroke={INK} strokeWidth="0.9" />
          <rect x="7" y="17" width="23" height="13" rx="2" fill="#DC2626" stroke={INK} strokeWidth="1.2" />
          <path d="M9 14h18" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 17h8l4 6v7H30V17z" fill="#EF4444" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="33" y="20" width="5.5" height="4.5" rx="1" fill="#BAE6FD" stroke={INK} strokeWidth="0.9" />
          <rect x="8" y="24" width="20" height="2.5" rx="1" fill="#FEF08A" />
          <circle cx="14" cy="35" r="4.5" fill="#1E293B" />
          <circle cx="14" cy="35" r="2" fill="#CBD5E1" />
          <circle cx="35" cy="35" r="4.5" fill="#1E293B" />
          <circle cx="35" cy="35" r="2" fill="#CBD5E1" />
        </svg>
      );
    case 'sampah':
      return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
          <ellipse cx="24" cy="40.5" rx="18" ry="2.6" fill="#7A4B21" opacity="0.2" />
          <path d="M7 18l4-3h18v15H7V18z" fill="#16A34A" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M14 21h8M14 25h6" stroke="#DCFCE7" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M29 19h8l5 5v6H29V19z" fill="#22C55E" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x="32" y="21" width="6" height="4.5" rx="1" fill="#DCFCE7" stroke={INK} strokeWidth="0.9" />
          <rect x="7" y="29" width="35" height="4" rx="1.5" fill="#334155" />
          <circle cx="14" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="14" cy="36" r="2" fill="#CBD5E1" />
          <circle cx="35" cy="36" r="4.5" fill="#1E293B" />
          <circle cx="35" cy="36" r="2" fill="#CBD5E1" />
        </svg>
      );
  }
}
