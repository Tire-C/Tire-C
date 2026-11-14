# Tire — Binary Mind Odyssey

Review candidate, not an approved profile integration.

A deterministic WebGL 2 program. Every visible surface is a spatial cloud of 0/1 glyphs. Three.js supplies perspective matrices and instanced draw submission; no conventional shaded mesh is visible.

## Review

See [revision 2: character, pacing and visual review](REVISION_2.md).

The remote workflow creates [a self-contained application](review/odyssey.html), [rendered diagnostic frames](diagnostics/README.md) and [machine-readable evidence](diagnostics/report.json). The HTML includes its code and dependencies; it requires no build or installation to observe in a browser. GitHub serves HTML source as a download, not an interactive page. Pages is deliberately not enabled.

Diagnostics are still images for inspection, never playback frames. All animation geometry, camera motion and morphs are evaluated at runtime. Rendering software in CI validates actual GLSL/WebGL pixels but does not establish real GPU frame rates.

## Narrative

| Time | Scene |
|---|---|
| 0–1.71 s | Twisting spatial binary tunnel |
| 1.71–3.43 s | Multilevel data architecture |
| 3.43–5.14 s | Atomic and field structures |
| 5.14–6.86 s | Molecular helix and cages |
| 6.86–8.57 s | Mathematical surfaces and projected hypercube |
| 8.57–10.29 s | Spiral galaxy and ringed planet |
| 10.29–12.00 s | Neural architecture |
| 12.00–13.71 s | Mechanical assemblies |
| 13.71–18.86 s | Continuous camera withdrawal from the cranial volume |
| 18.86–21.43 s | Seated creator, hands, keyboard, monitor and chair |
| 21.43–24.00 s | Spatial glyph morph into the signature |
| 24.00–27.50 s | Hi, I am Tire |
| 27.50–28.00 s | Fade into the next journey |

## Architecture

- `geometry.js`: seeded surface/volume sampling; all eight environments fit a sphere of radius 34. With scale 0.0038 their radius is at most 0.1292 world units, inside the cranial vault.
- `character.js`: original anatomical surface sampling, recessed facial features, short procedural coils, clothing sections, tapered limbs, posed fingers and workstation. No external character assets or proprietary likenesses.
- `renderer.js`: instanced typographic quads, real depth test/write, glyph alpha cutout, directional luminance, atmospheric distance attenuation, seeded opacity dissolve and GPU morphing.
- `timeline.js`: absolute-time camera and scene state; random access never relies on accumulated simulation state.
- `signature.js`: typography sampled into world-space positions and assembled from the existing creator glyphs.
- `main.js`: UI, pause/scrub, interactive 3D orbit inspection, reduced motion, capped pixel density and graphics-context handling.
- `tools/`: remote build and diagnostic test suite.

A binary glyph uses a camera-facing quad at an actual 3D center. The quad is a typographic primitive, not a flat representation of its containing object. Different depths, occlusion and perspective are evaluated for every glyph.

Worlds morph through stable particle indices with a bounded curved displacement. Orbital samples and mechanical assemblies also move through explicit per-instance 3D rotations. A single camera traverses the internal universe and retreats into the surrounding human scene. The universe is already inside the skull throughout: it is not replaced by an unrelated symbol during the reveal.

## Cloud and cost boundary

Only `ubuntu-24.04` standard GitHub-hosted runners on this public repository. No paid runner, API, GPU rental, artifact-storage upload, Pages deployment or external hosting. Dependencies, browser binaries, build and tests are confined to the disposable remote runner. Small review outputs are committed to this experimental branch with a head-SHA check. No credentials are embedded.

CI uses Chromium with ANGLE SwiftShader: **software rasterization on remote CPU, not a physical GPU test**. Browser playback on the viewer's device uses its available WebGL implementation. Revision 2 shortens the cycle from 32 to 28 seconds. The moving story runs 16.7% faster (14.3% shorter), while the final 3.5-second reading hold and half-second fade remain unchanged. All eight scientific environment generators are preserved exactly.

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

`npm ci --ignore-scripts`, `npx playwright install --with-deps chromium firefox webkit`, `npm run build`, `xvfb-run -a npm test`.

The first remote run generates the dependency lock; subsequent runs use it. Dependencies are pinned directly. The standalone build retains upstream license notices and includes Three.js's MIT license alongside it.
