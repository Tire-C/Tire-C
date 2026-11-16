# Tire — Binary Mind Odyssey

Review candidate; artistic approval and profile integration remain pending.

A deterministic WebGL 2 program. Every visible surface is built from spatial 0/1 glyphs. The voyage uses one point vertex per glyph; the human and signature use instanced typographic quads. No conventional shaded mesh writes visible colour.

## Review

See [revision 5: continuous flight and immediate creator-to-signature transition](REVISION_5.md).

The workflow produces [the self-contained program](review/odyssey.html), [diagnostic images](diagnostics/README.md) and [test results](diagnostics/report.json). The HTML includes all code and dependencies and can be observed without installing or building anything.

[Open the verified live preview](https://htmlpreview.github.io/?https://github.com/Tire-C/Tire-C/blob/cb4e9728be6a690199a924a7b20a6533bf3249ee/odyssey/review/odyssey.html). This external viewer reads the public, immutable tested HTML; it does not enable Pages or publish a separate deployment. The [CodePen HTML wrapper](preview/codepen.html) remains available. Both paths are verified by the [remote preview test](preview/evidence/report.json).

Diagnostic images are evidence, never playback frames. The animation evaluates its spatial geometry, motion, camera and signature at runtime.

## Narrative

| Time | Scene |
|---|---|
| 0–11.00 s | One continuous flight through tunnel, data architecture, atom, molecular structures, mathematics, galaxy, neural architecture and machinery |
| 11.00–11.85 s | Rapid cranial reveal and withdrawal to the workstation |
| 11.85–12.05 s | Brief creator composition, with no portrait orbit |
| 12.05–12.45 s | Spatially ordered glyph assembly into the signature |
| 12.45–13.80 s | Hi, I am Tire |
| 13.80–14.00 s | Fade into the next journey |

The environments coexist inside the head in separate, connected regions. A smooth analytic curve with arc-length parametrization replaces per-world camera easings. The worlds no longer exchange arbitrary particle indices at chapter boundaries.

## Architecture

- `geometry.js`: the eight approved seeded scientific environment generators, retained exactly; 22,000 primary samples per environment in this revision.
- `timeline.js`: analytic spatial path, equal-distance traversal, chamber frames, deterministic absolute time and straight final withdrawal. Complete rooms fit within a cranial radius of 0.075 world units.
- `flight-renderer.js`: persistent point buffers, one vertex per glyph, continuous distance attenuation, capped foreground glyph size and spatial frustum culling.
- `braid.js`: continuous 3D binary strands linking the domains into a single spatial route.
- `flow.js` and `activity.js`: coherent signal packets and three layers of moving domain-specific objects in every environment, using a common timebase.
- `tools/prepare-character.py`: verified CC0 MakeHuman graphical assets, original skeletal posing, garments, coils, anatomical glyph rows, eye geometry, visibility and quantization; generated exclusively on the remote CPU runner.
- `character.js`: sampled human, workstation and two invisible anatomical depth proxies. No specific real-person likeness or proprietary character.
- `renderer.js`: surface-oriented binary instances for the human; perspective, occlusion and glyph-only illumination.
- `signature.js`: spatial correspondence between source glyphs and the exact final typography.
- `main.js`: pre-upload/program warmup before playback, pause/scrub, 3D inspection, reduced motion, portrait framing and Auto/Detail/Fluidity choices. Automatic resolution adaptation does not alter narrative timing.

## Cloud and performance boundary

Development execution, anatomy generation, dependency installation, build and tests use only the public repository's standard `ubuntu-24.04` GitHub Actions runner, [free under GitHub's published policy](https://docs.github.com/en/billing/concepts/product-billing/github-actions). No paid runner, rental GPU, billing activation, Pages deployment, artifact upload or cache service is used.

Chromium uses ANGLE SwiftShader on remote CPU. Firefox and WebKit checks also use software rendering on that Linux runner. WebKit's “Apple GPU” privacy string is not evidence of Apple hardware. See the recorded same-run R4/R5 rasterization benchmark in [the report](diagnostics/report.json). It measures relative software rendering cost, not physical GPU frame rate.

The viewer's browser supplies the WebGL implementation for observation. Auto quality caps pixel density and can lower resolution when sustained frame times are high. Detail and Fluidity are explicit user choices. Physical GPU smoothness remains unverified by CI.

## Profile preservation and later integration

The root README is never a build input that gets rewritten. `audit/README.original.md` is checked byte for byte against the immutable baseline, and its Git blob is checked independently.

After explicit artistic approval:
1. Re-read current `main`; stop if it differs from the recorded baseline, and compare changes.
2. Prepare a separate integration commit. Add only a reviewed link/image block, retaining every byte of the existing README as an unchanged suffix or prefix.
3. Assert that stripping the exact added block yields the original bytes and original blob hash.
4. Publish static application only after separate deployment approval.
5. Revert the integration commit to remove only that addition, without rewriting history. If later README changes overlap, prepare a focused reverse patch instead of overwriting them.

No README integration or deploy is authorized by the experimental-branch approval.

## Previous prototype and SVG

The previous SVG survives in commit `eff19cf70a71f5f6818a5bc2fca0187995e86a07`. Inspection found planar translate/scale/rotate groups, with a simulated camera based on group zoom. It was not reused as geometry.

An SVG embedded as an image cannot run the JavaScript/WebGL engine. A dedicated probe in compatibility/README.md has been observed through the actual GitHub-rendered Markdown in remote Chromium: basic SMIL position/opacity animation changed pixels without JavaScript. This confirms basic compatibility only. It does not establish that an SVG can reproduce this engine or satisfy the requested artistic quality. No SVG replacement is silently published into the root README.

## Development commands (remote environment only)

Use the existing workflow on the authorized public standard runner. Its remote sequence is:

1. `npm ci --ignore-scripts`
2. `npx playwright install --with-deps chromium firefox webkit`
3. `python -m pip install numpy==2.2.6`
4. `python tools/prepare-character.py`
5. `npm run build`
6. `xvfb-run -a npm test`

The character builder verifies the pinned source assets before emitting `src/generated/character-data.json`, metadata and provenance. The build validates the exact script embedded in the standalone HTML.

The first remote run generates the dependency lock; subsequent runs use it. Dependencies are pinned directly. The standalone build retains upstream license notices and includes Three.js's MIT license and the MakeHuman graphical-asset CC0 license alongside it.
