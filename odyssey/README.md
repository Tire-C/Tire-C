# Tire — Binary Mind Odyssey

Review candidate, not an approved profile integration.

A deterministic WebGL 2 program. Every visible surface is a spatial cloud of 0/1 glyphs. Three.js supplies perspective matrices and instanced draw submission; no conventional shaded mesh is visible.

## Review

See [revision 4: anatomical microtypography, dense activity in all worlds and a 16-second journey](REVISION_4.md).

The remote workflow creates [a self-contained application](review/odyssey.html), [rendered diagnostic frames](diagnostics/README.md) and [machine-readable evidence](diagnostics/report.json). The HTML includes its code and dependencies; it requires no build or installation to observe in a browser. GitHub serves HTML source as a download, not an interactive page. Pages is deliberately not enabled.

Diagnostics are still images for inspection, never playback frames. All animation geometry, camera motion and morphs are evaluated at runtime. Rendering software in CI validates actual GLSL/WebGL pixels but does not establish real GPU frame rates.

## Narrative

| Time | Scene |
|---|---|
| 0–1.10 s | Spatial binary tunnel |
| 1.10–2.20 s | Multilevel data architecture |
| 2.20–3.30 s | Atomic and field structures |
| 3.30–4.40 s | Molecular helix and cages |
| 4.40–5.50 s | Mathematical surfaces and nested frames |
| 5.50–6.60 s | Galaxy and orbital bodies |
| 6.60–7.70 s | Neural architecture |
| 7.70–8.80 s | Mechanical assemblies |
| 8.80–11.40 s | Cranial reveal and complete portrait |
| 11.40–13.20 s | Seated creator and workstation |
| 13.20–14.20 s | Spatial glyph morph into the signature |
| 14.20–15.70 s | Hi, I am Tire |
| 15.70–16.00 s | Fade into the next journey |

## Architecture

- `geometry.js`: seeded surface/volume sampling; all eight environments fit a sphere of radius 34. With scale 0.0024 their radius is at most 0.0816 world units, inside the cranial vault.
- `tools/prepare-character.py`: pinned CC0 MakeHuman anatomy and detailed ocular data, original skeletal posing/IK and garments, ray-intersected rows of surface glyphs, adaptive eye sampling, six-direction anatomical visibility and quantization. Executed only on the remote runner; see `assets/README.md` and the provenance report.
- `character.js`: generated anatomical glyph clouds, original short coils, footwear and workstation. Anatomical depth proxies use `colorWrite:false`; no solid mesh writes visible colour. No specific real-person likenesses or proprietary characters.
- `flow.js`: stronger, faster deterministic packets along the actual structures of all eight environments.
- `activity.js`: one instanced pass for 60 moving groups in each world, spanning three depth layers; complete glyph assemblies, directional crossing events and verified spatial bounds.
- `renderer.js`: instanced typographic quads, real depth test/write, glyph alpha cutout, directional luminance, atmospheric distance attenuation, seeded opacity dissolve, surface-oriented portrait typography, key/fill lighting, highlight compression and GPU morphing.
- `timeline.js`: absolute-time camera and scene state; random access never relies on accumulated simulation state.
- `signature.js`: typography sampled into world-space positions and assembled from the existing creator glyphs.
- `main.js`: UI, pause/scrub, interactive 3D orbit inspection, reduced motion, capped pixel density and graphics-context handling.
- `tools/`: remote build and diagnostic test suite.

A binary glyph uses a camera-facing quad at an actual 3D center. The quad is a typographic primitive, not a flat representation of its containing object. Different depths, occlusion and perspective are evaluated for every glyph.

Worlds morph through stable particle indices with a bounded curved displacement. Orbital samples and mechanical assemblies also move through explicit per-instance 3D rotations. A single camera traverses the internal universe and retreats into the surrounding human scene. The universe is already inside the skull throughout: it is not replaced by an unrelated symbol during the reveal.

## Cloud and cost boundary

Only `ubuntu-24.04` standard GitHub-hosted runners on this public repository, [free for public repositories under GitHub's documented runner policy](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job). No paid runner, API, GPU rental, artifact-storage upload, Pages deployment or external hosting. Dependencies, browser binaries, build and tests are confined to the disposable remote runner. Small review outputs are committed to this experimental branch with a head-SHA check. No credentials are embedded.

CI uses Chromium with ANGLE SwiftShader: **software rasterization on remote CPU, not a physical GPU test**. Browser playback on the viewer's device uses its available WebGL implementation. Revision 4 shortens the cycle from 24 to 16 seconds. The worlds take 8.8 seconds, the mind reveal 2.6, the creator 1.8 and the signature morph 1.0. The signature remains fully formed for 1.5 seconds before a 0.3-second fade. Camera banking, closer passes and continuous field-of-view changes strengthen the journey. All eight scientific environment generators are preserved exactly. Firefox and WebKit also render the creator scene; no physical GPU validation is claimed.

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
