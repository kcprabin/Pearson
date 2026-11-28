| Phase | Skill | What Happens |
| --- | --- | --- |
| 1 | `stitch::extract-design-md` | Reverse-engineer Pearson's design tokens (colors, fonts, radii, layout) from `App.css` and components into a `DESIGN.md` |
| 2 | `stitch::manage-design-system` | Upload `DESIGN.md` to Stitch project `1307347744362967267` and create a project-level design system |
| 3 | `stitch::generate-design` | Edit the Landing Page, generate Dashboard, Customer Feedback, and Feedback Response Console screens — all with enhanced prompts, no theme leakage |
| 4 | `stitch::extract-static-html` | (Optional) Snapshot your running app pages as standalone HTML for Stitch reference |
| 5 | `stitch::react-components` | Download Stitch screens, extract style tokens, and integrate redesigned UI back into `apps/web` while preserving all API calls, auth, and business logic |