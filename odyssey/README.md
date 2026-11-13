# Tire — Binary Mind Odyssey

Review candidate, not an approved profile integration.

A deterministic WebGL 2 program. Every visible surface is a spatial cloud of 0/1 glyphs. Three.js supplies perspective matrices and instanced draw submission; no conventional shaded mesh is visible.

## Review

The remote workflow creates [a self-contained application](review/odyssey.html), [rendered diagnostic frames](diagnostics/README.md) and [machine-readable evidence](diagnostics/report.json). The HTML includes its code and dependencies; it requires no build or installation to observe in a browser. GitHub serves HTML source as a download, not an interactive page. Pages is deliberately not enabled.

Diagnostics are still images for inspection, never playback frames. All animation geometry, camera motion and morphs are evaluated at runtime. Rendering software in CI validates actual GLSL/WebGL pixels but does not establish real GPU frame rates.

## Narrative

| Time | Scene |
|---|---|
| 0–2 s | Twisting spatial binary tunnel |
| 2–4 s | Multilevel data architecture |
| 4–6 s | Atomic and field structures |
| 6–8 s | Molecular helix and cages |
| 8–10 s | Mathematical surfaces and projected hypercube |
| 10–12 s | Spiral galaxy and ringed planet |
| 12–14 s | Neural architecture |
| 14–16 s | Mechanical assemblies |
| 16–22 s | Continuous camera withdrawal from the cranial volume |
| 22–25 s | Seated creator, hands, keyboard, monitor and chair |
| 25–28 s | Spatial glyph morph into the signature |
| 28–31.5 s | Hi, I am Tire |
| 31.5–32 s | Fade into the next journey |

## Architecture

- `geometry.js`: seeded surface/volume sampling; all eight environments fit a sphere of radius 34. With scale 0.008 their radius is at most 0.272 world units, inside the cranial vault.
- `renderer.js`: instanced typographic quads, real depth test/write, glyph alpha cutout, directional luminance, atmospheric distance attenuation, seeded opacity dissolve and GPU morphing.
- `timeline.js`: absolute-time camera and scene state; random access never relies on accumulated simulation state.
- `signature.js`: typography sampled into world-space positions and assembled from the existing creator glyphs.
- `main.js`: UI, pause/scrub, reduced motion, capped pixel density and graphics-context handling.
- `tools/`: remote build and diagnostic test suite.

A binary glyph uses a camera-facing quad at an actual 3D center. The quad is a typographic primitive, not a flat representation of its containing object. Different depths, occlusion and perspective are evaluated for every glyph.

Worlds morph through stable particle indices with a bounded curved displacement. A single camera traverses the internal universe and retreats into the surrounding human scene. The universe is already inside the skull throughout: it is not replaced by an unrelated symbol during the reveal.

## Cloud and cost boundary

Only `ubuntu-24.04` standard GitHub-hosted runners on this public repository. No paid runner, API, GPU rental, artifact-storage upload, Pages deployment or external hosting. Dependencies, browser binaries, build and tests are confined to the disposable remote runner. Small review outputs are committed to this experimental branch with a head-SHA check. No credentials are embedded.

CI uses Chromium with ANGLE SwiftShader: **software rasterization on remote CPU, not a physical GPU test**. Browser playback on the viewer's device uses its available WebGL implementation. The 32-second duration is deliberate: seven domains and the reveal need room.

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

An SVG embedded as an image cannot run the JavaScript/WebGL engine. Declarative SVG animation may be useful as a separate entry point, but its actual GitHub image-context behavior and artistic adequacy must be tested before proposing profile insertion. No SVG replacement is silently published into the root README.

## Development commands (remote environment only)

`npm ci --ignore-scripts`, `npx playwright install --with-deps chromium`, `npm run build`, `npm test`.

The first remote run generates the dependency lock; subsequent runs use it. Dependencies are pinned directly. The standalone build retains upstream license notices and includes Three.js's MIT license alongside it.
