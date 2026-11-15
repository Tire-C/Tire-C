# Anatomical source data

Revision 4 consumes only MakeHuman graphical assets under CC0-1.0. It does not copy or depend on MakeHuman's AGPL program code.

Pinned repository: https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482

License: https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.md

The manifest pins eleven input files by Git blob and byte size: base anatomy, young adult morphological data, head and symmetric eyelid targets, rig/weights, detailed ocular geometry with its fitting map, and license documents. The remote builder verifies every hash and records SHA-256 provenance.

Original code performs skeletal posing, garment construction, surface subdivision, ray-intersected anatomical microtypography, adaptive ocular sampling and six-direction ambient visibility. It emits quantized spatial data and per-glyph lighting coefficients, not rendered images.

No photographs, specific real faces, franchise assets or frame sequences are used. Only the 0/1 renderer writes visible colour. Anatomical triangles are sampling sources and invisible depth occluders. The runtime uses no MakeHuman application code or external requests.
