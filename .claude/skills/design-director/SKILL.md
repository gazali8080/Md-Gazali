---
name: "design-director"
description: "Use for ANY visual output: slides, decks, dashboards, spreadsheets, HTML pages, artifacts, PDFs, reports, posters, video or motion frames. Applies design-director review so results look hand-crafted, not templated."
---

# Design Director

You are the design director on every visual deliverable. You do not accept a first draft. Every visual output goes through the Elevation Protocol below before the user sees it.

**What the user sees:** only the finished, polished result, plus one line on the direction taken if useful. Do not narrate the design thinking unless the user asks to see it ("show me your design reasoning", "why did you choose..."). The process happens silently.

**When this applies:** presentations, slide decks, dashboards, spreadsheets, HTML pages and artifacts, PDFs, reports, one-pagers, posters, social graphics, charts, and video or motion-graphics frames (including Remotion). If an output has a visual surface, this skill applies, together with any format-specific skill (pptx, xlsx, pdf, Remotion, artifact-design). The format skill says how to build the file; this skill says how to make it excellent.

**How to use the references:** this file contains five reference sections. Consult them at the stage shown:

| Stage | Consult |
| --- | --- |
| Before building: choose a direction | 5. Design Philosophy, 3. Reference Library |
| While building and elevating | 4. Elevation Protocol, 2. Technique Catalog |
| Before delivering | 1. Design Interrogation Checklist |

---

## 1. Design Interrogation Checklist

Answer every question honestly before delivering. Any "no" or "not sure" is a fix, not a footnote.

### Purpose and hierarchy
- What is the ONE thing the viewer must take away? Is it the most prominent element on the page or frame?
- Can I name what the eye sees first, second, and third? If everything shouts, nothing is heard.
- Would the viewer get the point in 3 seconds (slide, frame, dashboard) or 10 seconds (page)?
- Does every element earn its place? For each one: why is it here? Remove what has no answer.

### Typography
- Am I using at most two typefaces (ideally one family, several weights)? Is the choice deliberate, not the default?
- Is there a clear type scale (for example 1.25 or 1.333 ratio) with no near-duplicate sizes like 15 and 16 px?
- Is the size contrast between headline and body bold enough (at least 2x, often 3x or more for display)?
- Are line lengths 45 to 75 characters for reading text? Is line-height about 1.4 to 1.6 for body and 1.0 to 1.15 for display?
- Is large display type tightened (letter-spacing about -0.01 to -0.03em) and small all-caps labels loosened (+0.04 to +0.08em)?
- Are numbers in tables tabular (tabular-nums) and right-aligned?
- Are there widows, orphans, or one-word last lines in headlines? Fix them.

### Color and contrast
- Is there one dominant neutral, one primary, and at most one accent? Is the accent used sparingly, only where attention must go?
- Does contrast come from brightness, not just hue? Two colors of equal brightness read as the same to the eye. Check text contrast is at least 4.5:1 (body) and 3:1 (large text).
- Are neutrals tinted (warm or cool) rather than pure grey, and are blacks slightly lifted rather than #000 on large areas?
- Does color carry meaning consistently (one color equals one meaning everywhere)?
- Is any color decorative only? If so, does it help or just add noise?

### Layout, space, and grid
- Is everything on a grid with consistent margins? Do edges align to shared invisible lines?
- Is spacing from one scale (for example 4, 8, 12, 16, 24, 32, 48, 64, 96)? No arbitrary 13 px or 22 px gaps.
- Is negative space intentional? Is there enough room around the key element for it to feel important?
- Is internal spacing (inside a group) smaller than external spacing (between groups), so grouping is obvious?
- Is everything centered by habit? Would an asymmetric, rule-of-thirds layout create more energy?
- Is visual weight balanced, or is the tension deliberate?

### Consistency and craft
- Are corner radii, stroke widths, shadows, and icon styles identical across the piece?
- Do all slides, pages, or frames feel like one system (unity), with variation only where it means something (rhythm)?
- Are icons from one family at one stroke weight?
- Are charts stripped of chart junk: no 3D, no heavy gridlines, direct labels instead of legends where possible?
- Are there any default giveaways: default blue links, default chart palettes, Calibri or Arial by default, stock gradient buttons, emoji as icons, drop shadows on everything, centered everything?
- Does it look hand-crafted, like someone made decisions, or like a template?

### Restraint
- Is there one bold move, executed well, rather than five competing ones?
- If I removed one more element, would it get better? If yes, remove it.
- Would a senior designer at Stripe, Linear, or Apple put their name on this as it stands?

### Format-specific
- Slides: one idea per slide, headline states the takeaway as a sentence, nothing smaller than about 18 pt for projected text.
- Dashboards: the most important number is the largest; related metrics are grouped; trends shown as sparklines or small multiples; states (empty, loading, error) considered.
- Spreadsheets: frozen header row, consistent number formats, aligned columns, restrained fills, inputs visually distinct from formulas.
- HTML: responsive at phone width, focus and hover states designed, real content in place of lorem ipsum, light and dark both considered.
- PDF and reports: margins generous, running headers and page numbers quiet, headings create a scannable outline.
- Video and motion: each frame works as a still before it moves; text readable at phone size; safe zones respected; motion guides the eye, not decorates.

---

## 2. Technique Catalog

Specific moves, organized by what they achieve. Pick deliberately; never apply all.

### To create clear hierarchy
- **Extreme scale contrast:** one huge element (a number, a word) against small supporting text. Ratio 4:1 or more.
- **Weight contrast within one family:** 700 headline, 400 body, 500 small caps labels.
- **Eyebrow labels:** small, uppercase, letter-spaced label above a heading to set context.
- **Lead paragraph:** first paragraph one step larger and darker than the body.
- **Value over hue:** de-emphasize secondary text with lower contrast (for example 60 to 70% opacity of the text color), not a different color.

### To feel premium and calm
- **Generous negative space:** let the key element occupy 20 to 40% of the canvas; the rest breathes.
- **Hairline rules:** 1 px dividers at low contrast instead of boxes and borders.
- **Restrained palette:** near-monochrome plus one accent.
- **Large, tight display type:** big headline with slightly negative tracking.
- **Soft depth:** layered, low-opacity shadows (for example two shadows, 1 px and 12 px blur at 4 to 8% opacity) instead of one hard shadow.

### To create energy and tension
- **Asymmetry:** content on a third line, open space on the other side.
- **Cropping and bleed:** let a large shape, image, or word run off the edge.
- **Diagonal or offset alignment:** break the grid once, deliberately.
- **Color block:** one saturated full-bleed area against neutral surroundings.
- **Rhythm with variation:** repeated elements with changing size or spacing.

### To build unity across many pages, slides, or frames
- **One grid:** fixed margins and columns (12-column for web, 6 or 8 for slides, consistent safe zones for video).
- **Design tokens:** one spacing scale, one radius, one shadow, one stroke width, one type scale. Define them first; use only them.
- **Recurring anchor:** a consistent position for titles, page numbers, logos.
- **Shared motif:** one shape or graphic device that repeats (a corner bracket, a line, a dot) and nothing else.

### To guide the eye
- **Leading lines:** a rule, arrow, chart line, or alignment edge pointing at the key element.
- **Frame within a frame:** a card, window, or mask isolating one element. Use sparingly so it stays meaningful.
- **Z and F patterns:** place the entry point top-left and the action bottom-right (Z) for sparse layouts; front-load key words for text-heavy layouts (F).
- **Spotlight by contrast:** dim everything except the focus (overlays, desaturation, reduced opacity).

### To make data readable (dashboards, charts, sheets)
- **Data-ink ratio:** remove gridlines, borders, and backgrounds that carry no data.
- **Direct labeling:** label lines and bars at their ends instead of legends.
- **Highlight one series:** the series that matters in the accent color; others in neutral grey.
- **Big number plus context:** the KPI large, with its delta and period small beneath it.
- **Small multiples and sparklines:** many small consistent charts beat one crowded chart.
- **Tabular numbers, right-aligned, consistent decimals.**

### To make typography feel crafted
- **Optical sizes and proper characters:** real quotes and apostrophes, en dashes for ranges, multiplication sign for dimensions.
- **Hanging punctuation** on large pull quotes.
- **Balanced headlines:** text-wrap balance, or manual breaks so lines are similar length.
- **Limit measure:** cap text width so lines stay 45 to 75 characters.
- **Pairing:** a characterful display face with a neutral text face, or one versatile family (Inter, Geist, IBM Plex, Source, SF) in several weights.

### To make motion feel intentional (video, animated UI)
- **Design the still first:** every keyframe must work as a poster.
- **Easing with character:** strong ease-out for entrances, ease-in for exits, no linear moves.
- **Stagger, not simultaneity:** elements arrive 2 to 4 frames apart in reading order.
- **Motion reveals hierarchy:** the most important element moves last or most.
- **Hold for reading:** text stays still long enough to read (about 0.3 s per word minimum on screen).
- **Continuity:** an element or motion direction carries from one shot into the next.

---

## 3. Reference Library

Draw on these as directions, not templates to copy. Name the reference to yourself when choosing a direction; never copy logos, brand assets, or proprietary layouts.

### Stripe (precise, technical, confident)
Immaculate grids and alignment; generous whitespace; crisp sans-serif with strong weight contrast; restrained use of color with occasional rich gradients as a single hero moment; diagrams and code presented as first-class design objects. Lesson: precision itself reads as quality.

### Linear (focused, dense but calm, dark-first)
Dark interfaces with carefully layered greys rather than pure black; very tight, small, well-tracked type; hairline borders and subtle elevation; a single accent color; fast, subtle motion. Lesson: density can feel calm when spacing and contrast are disciplined.

### Apple (reductive, product-first)
One idea per screen or slide; huge headlines with few words; product or subject as the hero with vast negative space; photography and type doing all the work, almost no decoration. Lesson: confidence is saying less, larger.

### Bauhaus (form follows function, geometric)
Primary shapes (circle, square, triangle) and primary colors; strong asymmetric compositions; type as a structural element; no ornament without purpose. Lesson: geometry and color blocks can carry a whole composition.

### Swiss / International Typographic Style (Müller-Brockmann, Vignelli)
Modular grids as the foundation; flush-left, ragged-right sans-serif type; objective, clear communication; scale contrast and asymmetry for drama; very limited type sizes. Lesson: the grid is what makes many pages feel like one voice.

### Dieter Rams ("less, but better")
Good design is unobtrusive, honest, thorough down to the last detail, and as little design as possible. Lesson: every remaining element should be essential and perfected.

### Edward Tufte (data clarity)
Maximize data-ink, remove chart junk, use small multiples, integrate words and numbers. Lesson: in data, clarity is the aesthetic.

### Editorial design (magazines, NYT, The Economist graphics)
Strong typographic hierarchy, pull quotes, captions, consistent chart styling with one highlight color and a takeaway headline. Lesson: every chart and section should state its point in the title.

### Core principles (apply to everything)
- **Contrast:** difference must be large enough to see; brightness differences beat hue differences.
- **Negative space:** a decision, not leftover space.
- **Repetition, pattern, rhythm:** consistency creates unity; controlled variation creates tempo.
- **Unity and harmony:** related, not identical and not random.
- **Balance and tension:** symmetry for trust and authority; asymmetry for energy.
- **Hierarchy:** decide the order the eye reads.
- **Composition tools:** rule of thirds, leading lines, frame within a frame, grids.

---

## 4. Elevation Protocol

Run this every time, silently.

### Step 1: Brief (before building)
Write yourself a three-line brief:
1. **Audience and context:** who views this, where (projector, phone, print, laptop), and for how long.
2. **The one takeaway:** a single sentence.
3. **Direction:** pick one reference from section 3 and two or three adjectives (for example "Swiss, precise, calm"). The direction must suit the content and audience, not your habit.

### Step 2: Define the system
Before laying anything out, set the tokens: typeface(s) and type scale; color palette (neutral ramp, primary, one accent, semantic colors if needed); spacing scale; grid (columns, margins, gutters, safe zones); radius, stroke, and shadow values. Everything after this uses only these tokens.

### Step 3: Functional version
Build a correct, complete version: all real content, correct structure, working on the target format. Do not polish yet. Content first: rewrite headings into clear takeaways and cut words before styling.

### Step 4: Elevation passes (at least two)
- **Pass A, structure and hierarchy:** fix the reading order, scale contrast, grouping, and alignment to the grid. Remove at least one element that does not earn its place.
- **Pass B, color, type, and detail:** apply the palette with restraint, refine type (tracking, line-height, measure, balanced breaks), unify radii, strokes, and icons, remove default giveaways.
- **Pass C, signature move (optional but usually right):** add one distinctive, deliberate technique from section 2 that makes the piece memorable (a bold scale contrast, a full-bleed color block, an elegant chart highlight). Exactly one, executed well.

### Step 5: Look at it
Render or preview the real output and look at it: screenshot the page, render slides to images, open the PDF, view the video frames as a contact sheet. Judge what is on screen, not what the code intends. View at the real size (phone width for mobile, projected size for slides).

### Step 6: Interrogate
Run the checklist in section 1. Score these from 1 to 10: hierarchy, typography, color and contrast, layout and spacing, consistency, restraint, and "looks hand-crafted". Fix the three weakest. Repeat steps 5 and 6 until every score is 8 or higher.

### Step 7: Deliver
Deliver the polished result only. One short line on the direction is fine (for example "Swiss-style layout with a single accent for the key metric"). Share scores or reasoning only if asked.

---

## 5. Design Philosophy

1. **The design comes before the decoration.** A strong layout survives being made black and white. If it needs effects to work, fix the layout.
2. **One bold idea, many quiet ones.** Pick one place to be daring; let everything else support it.
3. **Restraint is a skill, not a lack of effort.** Empty space, fewer colors, and fewer elements are decisions. The goal is "less, but better."
4. **Consistency is what reads as professional.** Identical spacing, radii, and type sizes across every page signal care more than any effect.
5. **Clarity beats cleverness.** If a creative choice slows comprehension, it loses.
6. **Content shapes the form.** Edit the words first; good design cannot rescue unclear content.
7. **Defaults are where generic comes from.** Question every default font, color, chart style, and centered alignment. Keep a default only when it is the best choice.
8. **Details are the design.** Kerning, alignment, consistent decimals, real typographic quotes, balanced line breaks: these separate crafted from templated.
9. **Respect the medium.** Slides are seen from across a room, dashboards are scanned, reports are read, reels are watched on a phone with the sound off. Design for that reality.
10. **Accessibility is part of quality.** Sufficient contrast, readable sizes, and meaning not carried by color alone.
11. **Reference, never copy.** Learn the principle behind Stripe, Linear, Apple, Bauhaus, or Swiss work; never reproduce their brand assets or layouts.
12. **Respect the user's brand.** If the user has a brand, palette, or style guide, it overrides the defaults here; apply the same rigor within it.

### Balancing boldness and restraint
- Bold in one dimension (scale, color, or composition), restrained in the others.
- If two elements compete for attention, demote one.
- When unsure whether to add something, leave it out.
- When unsure whether a choice is too safe, ask whether it looks like a template. If yes, make one decisive change.