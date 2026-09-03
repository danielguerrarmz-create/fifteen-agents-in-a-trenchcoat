---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

**First, calibrate the treatment.** Not every page wants a bold direction. A
landing page, a portfolio or a pitch is editorial and should take a real
aesthetic risk. A plan, a report, an admin tool or a nonprofit's information
pages are utilitarian: they want genuine typographic hierarchy, considered
spacing and a proper palette, and they want restraint. Applying a maximalist
direction to a utilitarian page is the same category of error as shipping a
templated one. When unsure, a well-composed page is never wrong; an
over-designed one sometimes is.

Then understand the context and commit to a direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Typography

Read this before choosing a typeface. The order matters.

1. **An existing brand font wins, always.** Before picking anything, look for one:
   a tokens or theme file, a `@font-face` block, the font the live site already
   serves, a CLAUDE.md. If the client has a typeface, use it and reuse their
   hosted file rather than adding a dependency. A "more distinctive" choice on a
   real brand is not a better design, it is a different company's design.
2. **A pairing needs a reason, not novelty.** Say in one line why this face suits
   this subject. If the reason is "it is less common", pick again. Two families is
   usually the ceiling; one family across several weights is a legitimate answer
   and often the right one for utilitarian work.
3. **Verify the font actually renders.** A silent fallback is a bug, not a
   fallback: the page ships looking like nothing you chose. Check the computed
   family, not the declaration. Where a CSP blocks font CDNs (Artifacts do),
   either inline the face as a data URI or commit to a system stack on purpose.
4. **A system stack chosen deliberately is fine.** The failure mode is inheriting
   one without a decision, not using one. Naming that choice is what separates
   the two.
5. **Set a scale and stay on it.** Give headings `text-wrap: balance`, keep running
   text near 65 characters, add letter-spacing to uppercase labels, and use
   `font-variant-numeric: tabular-nums` wherever digits line up in a column.
6. **Never below 16px for body copy or form inputs.** Under 16px iOS zooms the
   viewport on focus, which is a real usability failure, not a taste question.

## Structure

- **Question the card.** A boxed, bordered, rounded card around every idea is the
  single most recognizable AI-design tell, and three side by side turn a page into
  a catalogue. Ask whether the border earns its place. For a list of ideas, rows
  separated by a hairline rule usually read better, carry more text comfortably,
  and survive narrow screens without becoming a stack of boxes. Reach for a card
  when the content genuinely is a discrete object that can be picked up and moved.
- **Structural devices must encode something true.** Numbered markers (01/02/03),
  eyebrows, dividers, severity stripes: each should reflect a real property of the
  content. Number a sequence only when order carries information the reader needs.
  Decoration dressed as structure reads as noise once someone notices it means
  nothing.
- **Heading level is structure, not size.** One `h1` per page, no skipped levels,
  and set size with CSS rather than by reaching for a smaller tag. Audit the
  rendered output, since level skips are invisible until something reads them.
- **Multi-page work gets one shared layout.** Header, nav and footer authored once
  and included, never copied per page. Copies drift, and the drift shows up as
  dead links and inconsistent navigation long before anyone notices the markup.
- **Match layout to reading order.** Sibling groups laid out with flex or grid and
  `gap`, not per-element margins that collapse or double. Wide content gets its
  own `overflow-x: auto` container so the page body never scrolls sideways.

## Frontend Aesthetics Guidelines

Focus on:
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

Avoid generic AI-generated aesthetics: reflexively reaching for Inter, Roboto or
Space Grotesk; cliched colour schemes, particularly purple-to-blue gradients on
white; warm cream grounds with a serif display and a terracotta accent; emoji as
section markers; rounded cards with an accent rail; everything centred. These are
defaults to spend your freedom on something better, not bans. Where the user or
the brand specifies one of them, their choice wins, every time.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
