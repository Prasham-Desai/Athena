# Athena UI polish audit

## Scope and concrete deliverables

This audit maps the current App Router pages, shared shell, and UI component groups so follow-up polish can be reviewed against named surfaces. It also records verification limits; source inspection alone is not treated as proof that every interaction works in a running browser.

### Route inventory

| Surface | Route/source | Primary UI and stateful areas |
| --- | --- | --- |
| Dashboard | `/` — `src/app/page.tsx` | Study summary, charts, subject progress, tasks, timer, planner and exam widgets |
| Subjects | `/subjects` — `src/app/subjects/page.tsx` | Search, sort, subject progress cards |
| Subject detail | `/subjects/[id]` — `src/app/subjects/[id]/page.tsx` | Chapters, topics, subtopics, completion/importance, revision controls, audio capture/playback |
| Planner | `/planner` — `src/app/planner/page.tsx` | Daily plan, study blocks, timer and log/task dialogs |
| Tasks | `/tasks` — `src/app/tasks/page.tsx` | Task management surface; inspect its current redirect/render behavior before changing it |
| Notes | `/notes` — `src/app/notes/page.tsx` | Filters, uploads, note edit/delete, document viewer and persistence |
| Revisions | `/revisions` — `src/app/revisions/page.tsx` | Queue filters, sorting, cards and revision actions |
| Revision detail | `/revisions/[id]` — `src/app/revisions/[id]/page.tsx` | Topic review, history and revision recording |
| Exams | `/exams` — `src/app/exams/page.tsx` | Exam management and countdowns |
| Analytics | `/analytics` — `src/app/analytics/page.tsx` | Date/subject filters, charts, heatmap, drill-down and export |
| Settings | `/settings` — `src/app/settings/page.tsx` | Theme, font sizing, preferences, import/export and reset confirmation |
| Stories | `/stories` — `src/app/stories/page.tsx` | Story CRUD, audio recording and playback |
| Anatomy | `/anatomy` — `src/app/anatomy/page.tsx` | Anatomy viewer and selection controls |
| Login | `/login` — `src/app/login/page.tsx` | Authentication form |
| Route error | `src/app/error.tsx` | Recovery and dashboard navigation |

API handlers under `src/app/api/**` are listed in the source inventory but are not visual routes and are outside UI-only edits.

### Shared component inventory

- Shell and navigation: `src/app/layout.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/academic-year-selector.tsx`.
- Shared feedback and layout: `src/components/shared/{page-header,empty-state,confirm-modal,stat-card,progress-ring,time-studied-widget,exam-timer,audio-recorder,audio-autoplay-bar}.tsx`, `src/components/ui/{loading,toaster}.tsx`.
- Planner and time: `src/components/planner/**`, `src/components/providers/timer-provider.tsx`, `src/store/{timer,planner,tasks}-store.ts`.
- Notes/documents: `src/components/notes/**`, `src/store/notes-store.ts`.
- Revision: `src/components/revisions/**`.
- Analytics: `src/components/analytics/**`, `src/lib/analytics-calculations.ts`.
- Stories/audio: `src/components/stories/**`, `src/store/{stories,audio}-store.ts`.
- App infrastructure: `src/components/{providers,auth-guard,data-seeder,font-size-manager,tutorial-overlay}.tsx`, `src/store/**`, `src/services/**`, `src/db/**`.
- Global presentation system: `src/app/globals.css` and Tailwind utility classes in route/component files.

## Implemented shared polish in this pass

- Added shared motion timing/easing and stacking-level tokens in `src/app/globals.css` for gradual consolidation; existing one-off z-index values are not silently rewritten.
- Applied Framer Motion's user reduced-motion preference across the provider tree and disabled CSS animation/transition motion when the OS requests reduced motion.
- Added a visible keyboard focus outline for common focusable controls as a baseline; component-specific focus styles may still take precedence.
- Made toast announcements polite and gave the dismiss control an accessible name.

## Safe change boundaries

1. **Presentation-first scope:** changes to spacing, typography, color, focus, hover/pressed feedback, and animation belong in existing route/component classes, `globals.css`, or the shared component that owns the presentation.
2. **Stateful UI stays mounted:** do not wrap or conditionally replace active recording, playback, timer, editor, unsaved form, or dialog subtrees in route/reveal transitions. Preserve current component identity and event ownership.
3. **No behavior/schema edits for polish:** do not change API contracts, Zustand store semantics, database migrations, persistence formats, or domain calculations unless a separately identified functional defect requires it.
4. **No broad selectors for component appearance:** global CSS is reserved for tokens, browser defaults, accessibility fallbacks, and truly universal behavior. Page-specific layout belongs to the page/component.
5. **No hidden content as an animation technique:** content must remain visible if observers or client animation setup fail. Avoid fixed-height clipping and broad overflow changes.
6. **Preserve user's working tree:** do not revert, reformat, or overwrite unrelated changes. Before touching an already-modified file, review its current diff and keep unrelated hunks intact.
7. **Verification claims are evidence-based:** a compile or type check does not prove browser behavior. Mark a route interaction or viewport verified only after observing it in that context; record access blockers and untested states.

## Verification ledger

| Check | Status | Evidence / limitation |
| --- | --- | --- |
| Source route and shared-component inventory | Inspected | Inventory above is based on current `src/app` routes and `src/components` tree. |
| Cross-route browser visual QA | Not complete | The local app presented an authentication lock screen in the available browser; authenticated route states could not be inspected. |
| Representative viewport matrix (mobile/tablet/desktop) | Not complete | Requires an authenticated browser session to inspect route layouts and overlays. |
| Audio recording/playback regression | Not runtime-verified | Audio code paths are explicitly protected by the safe-change boundary; microphone access/session was unavailable. |
| Timers, note persistence, revision workflows, forms, overlays | Not runtime-verified | Requires an authenticated interactive session and representative data. |
| Reduced-motion and keyboard focus code paths | Implemented, runtime check pending | Provider and global CSS policy are present; assistive-technology/browser preference checks remain open. |
| Type check | Passed | `npx.cmd tsc --noEmit` passed after Next regenerated `.next/types`. |
| Production build | Partial | Next production compile, TypeScript, static page generation and route generation passed. OpenNext Cloudflare packaging then failed on Windows with `EPERM` while removing `.open-next`. |
| Targeted ESLint | Partial | `src/components/ui/toaster.tsx` passed. Linting `providers.tsx` reports its existing `react-hooks/set-state-in-effect` violation at the pre-existing `setMounted(true)` effect. |

## Follow-up QA matrix

For each route in the inventory, record viewport (360, 390, 768, 1366, 1920 px), page state (loading, populated, empty, error), major interactions (focus, submit, filter, sort, expand, open/close overlay), and outcome. Prioritize `/subjects/[id]` audio, `/notes` editing/viewer, `/planner` timers, `/revisions/[id]` recording, `/analytics` heatmap drill-down, and `/settings` import/export/reset because those surfaces carry persistent or stateful interactions.
