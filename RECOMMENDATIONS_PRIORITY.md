# Kota Kendaraan Ceria 3D — Prioritized Recommendations Roadmap

**Generated from:** Functional Module Test Audit  
**Target Audience:** Children aged 2–6 years (Balita 2–3 & Prasekolah 4–6)  
**Stack:** Three.js (WebGL), React, TypeScript, Tailwind CSS, Vite PWA  

---

## Executive Test Summary

| Category | Passed | Warnings | Failed |
| :--- | :---: | :---: | :---: |
| Core Data, Audio SFX & 3D Truck Models | 3 | 0 | 0 |
| Interactive 3D Vehicle Missions (6 Trucks × 2 Age Modes) | 5 | 1 | 0 |
| PWA Manifest, Service Worker, Icons & Live Endpoints | 2 | 0 | 0 |
| **Total** | **10** | **1** | **0** |

> **Key Finding:** All 6 vehicle simulations complete cleanly from start to star celebration across both age modes. The single automated warning (`Truk Tangki` emitting 49 unthrottled React HUD updates during tank filling) and several toddler-ergonomics and mobile-landscape gaps form the basis of the priority list below.

---

## Priority Matrix Overview

| Priority | Item | Impact | Effort | Focus Area |
| :---: | :--- | :---: | :---: | :--- |
| **P0-1** | Throttle `Truk Tangki` HUD fill-progress updates | High | Low | Performance |
| **P0-2** | Reset all articulated 3D truck sub-parts on Garage return | High | Low | Visual Polish / State |
| **P0-3** | Compact Mobile-Landscape HUD layout (`max-height <= 450px`) | High | Medium | Mobile Ergonomics |
| **P1-1** | Add recognizable visual icons/pictograms on pre-reader controls | High | Low | Age 2–4 Accessibility |
| **P1-2** | Press-and-hold smooth movement for `Truk Crane` | High | Low | Toddler Controls |
| **P1-3** | Gentle idle visual hints in Balita (2–3) mode | High | Medium | Guided Learning |
| **P1-4** | Drag-to-spray continuous water jet for `Truk Pemadam` | Medium | Medium | Touch Interaction |
| **P2-1** | Randomized pipe puzzles & multiple paths for `Truk Tangki` | Medium | Medium | Replayability |
| **P2-2** | Multiple 3D build blueprints for `Truk Molen` (House, Tower, Bridge) | Medium | Medium | Replayability |
| **P2-3** | Expand Prasekolah (4–6) curriculum to Numbers 1–10 & Alphabet A–Z | Medium | Low | Educational Depth |
| **P3-1** | Kid-friendly Trophy & Sticker Book + Learning Progress summary | Medium | Medium | Motivation / Retention |
| **P3-2** | "Next Truck" shortcut in `CelebrationModal` for continuous play | Low | Low | Session Flow |

---

## Detailed Action Plan

### P0 — Immediate Fixes & Core Stability

#### P0-1. Throttle React HUD Updates During `Truk Tangki` Water Filling
- **Module:** `src/three/missionScenes.ts` (Truk Tangki)
- **Finding:** Automated testing detected 49 React state emissions during the `FILLING` phase because `emit()` runs every animation frame.
- **Action:** Track `lastEmittedPct` and only invoke `emit()` when `Math.floor(tankFill * 20)` changes (every 5% increment) or on phase transition (`FILLING` → `DRIVE`).
- **Acceptance Criteria:** Tank gauge still animates at 60fps in 3D WebGL while React HUD updates drop from ~49 to ≤ 20 per fill cycle.

#### P0-2. Full Sub-Rig Reset When Returning to the 3D Garage
- **Module:** `src/three/GameEngine.ts` (`enterGarage`)
- **Finding:** Returning to the garage resets truck world position/rotation, but mission-modified sub-parts remain altered (e.g., Fire Truck beacons stay lit at `emissiveIntensity: 2.2`, Crane cable/hook stays lowered, Tanker water gauge stays full, Garbage Truck hopper stays angled).
- **Action:** Reset all optional sub-rig states (`sirenLeftMat`, `sirenRightMat`, `cableMesh`, `hookGroup`, `waterFillMesh`, `hopperGroup`, `bedGroup`, `nozzleGroup`) inside `enterGarage()` and before starting a new mission.
- **Acceptance Criteria:** Every truck parked in the 3D Garage returns to its clean default visual state after any mission.

#### P0-3. Compact Mobile-Landscape Responsive HUD (`max-height <= 450px`)
- **Module:** `src/components/TopBar.tsx`, `src/components/BottomDock.tsx`, `src/App.tsx`, `src/index.css`
- **Finding:** Because orientation is locked to landscape, smartphones held sideways have short vertical height (~360–412px). Standard header + prompt strip + bottom dock heights can crowd the central 3D stage.
- **Action:** Introduce compact height-breakpoint styling (`@media (max-height: 480px)`) to slim header padding, condense the bilingual prompt banner to a single compact row, and make the bottom dock horizontally scrollable with slightly tighter vertical padding while preserving ≥ 48px touch targets.
- **Acceptance Criteria:** At `844×390` (typical phone landscape), ≥ 55% of vertical viewport remains completely unobstructed for the 3D truck scene.

---

### P1 — Toddler Usability & Intuitive Touch Controls (Ages 2–6)

#### P1-1. Visual Pictograms for Pre-Reader Controls
- **Module:** `src/components/BottomDock.tsx`
- **Gap:** Cargo types (`Apel`, `Balok Kayu`, `Kotak Mainan`, `Batu Bata`), waste items (`Kulit Pisang`, `Botol Plastik`, etc.), and letter hints rely heavily on text labels, which 2–4 year olds cannot read yet.
- **Action:** Pair every cargo button, waste item chip, and letter card with crisp visual icons/illustrations alongside color cues and bilingual audio on tap.
- **Acceptance Criteria:** A 2-year-old can identify apples, wood blocks, bottles, and organic/non-organic bins purely by visual recognition and voice readout.

#### P1-2. Press-and-Hold Continuous Movement for `Truk Crane`
- **Module:** `src/components/BottomDock.tsx`, `src/three/missionScenes.ts`
- **Gap:** Left/Right crane buttons currently move in discrete clicks (`0.18` per tap), requiring repeated rapid tapping.
- **Action:** Support `onPointerDown` / `onPointerUp` / `onPointerLeave` continuous movement (stepping smoothly while held) in addition to single taps and keyboard arrow keys.
- **Acceptance Criteria:** Holding Left or Right glides the 3D crane smoothly across the balance platform and stops immediately upon release.

#### P1-3. Gentle Idle Visual Hints for Balita (2–3 Tahun) Mode
- **Module:** `src/three/missionScenes.ts`, `src/components/BottomDock.tsx`
- **Gap:** Very young toddlers may pause if unsure which pipe, letter, or bin to tap next.
- **Action:** After 8 seconds of inactivity in `toddler` mode, gently highlight the suggested control or 3D object (and replay a warm bilingual voice cue) without penalizing the player.
- **Acceptance Criteria:** No child gets stuck on any mission step; hints clear immediately upon any interaction.

#### P1-4. Drag-to-Spray Continuous Water Jet for `Truk Pemadam`
- **Module:** `src/three/GameEngine.ts`, `src/three/missionScenes.ts`
- **Gap:** Extinguishing flames currently requires discrete taps per flame cluster.
- **Action:** Add throttled `pointermove` raycasting while pointer is pressed during `Truk Pemadam`'s `SPRAY` phase so dragging a finger across the building sweeps the 3D water cannon smoothly and extinguishes flames on contact.
- **Acceptance Criteria:** Both single-tap and continuous drag-spray work smoothly on desktop mice and mobile touchscreens without interfering with camera orbit.

---

### P2 — Replayability & Educational Curriculum Completeness

#### P2-1. Randomized Pipe Layouts for `Truk Tangki`
- **Module:** `src/three/missionScenes.ts`
- **Gap:** Pipe initial rotations and the 2×3 path shape are currently fixed per age mode, making replays identical.
- **Action:** Define 3 distinct solvable 2×3 pipe path templates for Prasekolah and randomize initial tile rotations (guaranteeing at least 2 tiles need rotating so puzzles never auto-solve on load).
- **Acceptance Criteria:** Replaying `Truk Tangki` generates a fresh solvable puzzle every round and passes automated BFS verification.

#### P2-2. Multiple 3D Structure Blueprints for `Truk Molen`
- **Module:** `src/three/missionScenes.ts`
- **Gap:** `Truk Molen` currently builds the same 4-block house each round.
- **Action:** Rotate or let players pick between 3 simple storybook 3D structures: **Rumah (House)**, **Menara (Tower)**, and **Jembatan (Bridge)** rendered in the child's chosen/mixed color.
- **Acceptance Criteria:** Each blueprint animates cleanly block-by-block from the cement chute with bilingual name announcement upon completion.

#### P2-3. Expand Prasekolah (4–6) Numbers (1–10) & Full Alphabet (A–Z)
- **Module:** `src/types/game.ts`, `src/three/missionScenes.ts`
- **Gap:** Current curriculum covers numbers 1–6 and 14 letters in Prasekolah mode.
- **Action:** Extend `NUMBER_WORDS` to 1–10 (bilingual Indonesian/English) and complete `LETTERS_PRESCHOOL` across all 26 letters (`A–Z`) with child-friendly Indonesian & English example words, updating cargo/crate slots to stack cleanly up to 8–10 items.
- **Acceptance Criteria:** All 26 letters and numbers 1–10 have accurate bilingual labels, speech cues, and 3D visual placement without clipping.

---

### P3 — Motivation, Progression & Continuous Play

#### P3-1. Trophy & Sticker Book Modal (Learning Progress)
- **Module:** New `src/components/StickerBookModal.tsx`, `src/components/TopBar.tsx`, `src/App.tsx`
- **Gap:** Stars accumulate in `localStorage`, but children and parents cannot see a celebratory collection of earned stickers or practiced topics.
- **Action:** Make the Star counter in `TopBar` clickable to open a bright, visual Sticker Book displaying earned stars per truck, unlocked vehicle stickers, and a simple parent summary of practiced skills (Colors, Numbers, Letters, Sorting, Pipes, Balance).
- **Acceptance Criteria:** Persists locally offline via `localStorage` and requires zero login.

#### P3-2. "Next Truck" Quick Action on `CelebrationModal`
- **Module:** `src/components/CelebrationModal.tsx`, `src/App.tsx`
- **Gap:** After completing a mission, players can only replay the same truck or go back to the garage.
- **Action:** Add a **"Truk Berikutnya · Next Truck"** button alongside "Main Lagi" and "Garasi" to let toddlers seamlessly cycle through all 6 vehicles in one joyful session.
- **Acceptance Criteria:** Cycles cleanly through all 6 vehicles and immediately transitions the 3D camera and mission state.

---

## Suggested Implementation Order

1. **Sprint 1 (Core Polish — P0-1, P0-2, P0-3):** Smooth performance, spotless 3D resets, and crisp mobile-landscape fit.
2. **Sprint 2 (Toddler UX — P1-1, P1-2, P1-3, P1-4):** Pre-reader icons, hold-to-move crane, gentle idle hints, and drag-to-spray fire hose.
3. **Sprint 3 (Content & Progression — P2-1, P2-2, P2-3, P3-1, P3-2):** Randomized pipes, 3 Molen blueprints, full A–Z / 1–10 curriculum, Sticker Book, and Next Truck flow.
