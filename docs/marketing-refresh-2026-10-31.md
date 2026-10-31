# Stayzy website refresh, October 31, 2026

Design read: preserve the consumer app's friendly teal identity and make the
latest native app screens the focus. DESIGN_VARIANCE 5, MOTION_INTENSITY 3,
VISUAL_DENSITY 3. Existing Next.js, Tailwind 4 and native CSS remain the foundation;
Geist is already self-hosted and Lucide is the existing icon family.

## Audit and preservation

The live site uses a split hero, five-tab app tour, privacy section and closing
invitation. Preserve `/`, `/privacy`, `/admin`, `#how-it-works`, `#made-for-you`,
nav labels, App Store destination, logo/wordmark, privacy copy and legal routes.
Keep the existing teal controls, off-white surfaces, dark-mode tokens, pill
buttons and 24 px section corners. No administration/authentication code changes.

The older hero auto-rotates screenshots every four seconds and its report,
History and calendar assets predate the latest native timing summaries. Replace
these with real captures and make hero switching visitor-controlled. Shorten the
hero description and use accurate screenshot alt text. Keep the headline and
metadata identity. The tour retains its keyboard/tab semantics and now shows the
iPad calendar at its actual aspect ratio. A quiet study-space image supports the
closing invitation, without presenting generated imagery as app UI.

## Assets

`marketing-screenshot-sources.json` records exact source paths, capture dates and
SHA-256 hashes. All six captures are native, unretouched screenshots. October 25
captures show setup, History, session details and iPad calendar. October 19 active
session/full-screen companion captures remain applicable to unchanged screens.
Their session values are sample data, not product-wide performance statistics.

`public/marketing/focus-space.png` is a supporting image generated with the built-in
imagegen tool. Prompt: a natural quiet study corner with a blank open notebook,
teal pen/book and piano edge on a cool gray desk; soft daylight; no people, screens,
UI, logos or readable text. It is not a screenshot or a customer photo.

## Verification

Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm build` (use `--webpack` if the
sandbox blocks Turbopack). Verify desktop/mobile, light/dark, reduced motion,
hero selection, all tour tabs/arrow keys, privacy and download links, no horizontal
overflow, no wrapped CTAs, no missing images and no browser console errors.
Measure Lighthouse on the production build before deployment. Save browser proof
in the ignored `output/playwright/` folder; it must not include private admin data.

### Results

- 77 tests passed across 16 files, including native-screen selection and tour keyboard navigation.
- TypeScript and the Next.js production build (`--webpack`) passed.
- Browser review passed at 1280 px desktop and 390 px mobile, in light and dark themes; keyboard End navigation, iPad calendar aspect ratio, privacy route, and App Store links verified. No horizontal overflow, broken images, or browser errors observed.
- Reduced motion is respected by the existing CSS media rules. Removed the hero entrance animation and automatic carousel so first-screen content appears immediately.
- Local production Lighthouse mobile: Performance 97, Accessibility 100, Best Practices 100, SEO 100. FCP 0.8 s, LCP 2.6 s, TBT 10 ms, CLS 0. These are local lab measurements, not live visitor metrics.
- Existing GitHub main to Vercel Production deployment retained.
