# Svivva Play Patch Designer (Free Synth Patch Designer)

A free lead-generation tool for the Svivva Play platform. Musicians describe the sound they want and choose a patch type (drone, sequence, bass, effects, live performance, or generative), then get an instant patch layout showing signal chain, modules, routing, and gear suggestions. The tool previews one step of the Svivva Play pipeline to drive traffic to svivva.com.

## Tech Stack

- Vanilla JavaScript (ES5), HTML5, CSS3
- Custom font: Zc-Regular (local), DM Sans (Google Fonts)
- Static site deployment (public dir: 28/)
- Dev server: `npx serve 28 -l 5000`

## SEO

- H1 keyword: "Free Synth Patch Designer"
- ~540 words of SEO body content in article section
- JSON-LD structured data: WebApplication + FAQPage schemas
- Open Graph and Twitter Card meta tags
- Canonical URL: https://svivva.com/tools/patch-designer
- 21 internal links to svivva.com
- FAQ with 5 questions (schema-marked for Google rich results)
- Meta keywords targeting: synth patch designer, modular synth, eurorack, signal chain builder

## Project Structure

- `28/index.html` - Main entry point with three-panel layout, SEO content, FAQ, structured data
- `28/app.js` - Patch type definitions, signal chain generation, module lists, analytics events
- `28/styles.css` - Dark theme styling, three-panel responsive layout, SEO content styles
- `28/fonts/Zc-Regular.ttf` - Custom brand font

## Patch Types

- **Drone / Ambient** - sustained textures, slow modulation, layered oscillators
- **Sequence / Pattern** - step sequencer driven rhythmic patches
- **Bass / Lead** - monophonic synth voices with filter envelopes
- **Effects Chain** - signal processing chains for any input source
- **Live Performance** - multi-source routing for jams with mixer and sends
- **Generative / Aleatoric** - self-playing patches with random CV and probability

## Deployment

Static site deployment with `publicDir: "28"`.
