SlotForge Track Pack design library

Open index.html for the pack index. Carrera, Scalextric Sport / Digital,
Policar, ScaleAuto Pro Track, Ninco Classic / N-Digital and SCX Universal /
Classic / Advance are available as design drafts. SCX contains 36 illustrations
and 33 product definitions; its physical geometry remains unverified.
Each pack has its own gallery, artwork, source references and precision flags.

Carrera Track Pack — design draft 0.2.0

Open carrera-evolution-digital/index.html to browse the vector catalogue.
The gallery uses the SlotForgeTiming reference theme. This is a design/research
artefact; the track-builder application and its importer have not been built.

Contents
- 83 SVG piece, assembly and device drawings.
- 72 purchase-product definitions; coverage.json lists the 70-item research scope.
- 24 nominal geometry definitions for flat primitives and single-lane straights.
- Source references, uncertainty flags and component quantities in pack.json.
- Authoring examples and geometry checks in examples/ and tools/.

Lane spacing
laneSpacingMm is the distance between slot centre lines. It is independent of
widthMm. For a 198 mm surface and two slots spaced 100 mm apart, the slots are
49 and 149 mm from the edge. For a 200 mm surface they are 50 and 150 mm.
Uneven spacing uses laneOffsetsMm instead of laneSpacingMm.
Curve slot radii = innerRadiusMm + each slot offset; arc length = radius x angle
in radians. Border width affects occupied space, not lane distance.

Run the sample with Node.js from this folder:
  node tools/geometry.cjs examples/custom-curve.json examples/generated-curve
  node tools/validate.cjs

The authoring utility generates SVG and matching geometry from JSON dimensions.
The pack itself is data-only. A future importer must validate its schema and
assets; do not execute code supplied by third-party packs.

Accuracy and scope
The 200 mm road / 100 mm spacing / 100 mm border grid is explicitly NOMINAL.
It is not established as exact mould dimensions. The original 198/99 study
is preserved separately. Neither should be presented as certified geometry.
The cited manufacturer catalogue supplies identities, angles and many lengths,
but lacks engineering measurements needed for precise special-piece geometry.
Unknown dimensions remain unknown, following the request to use published data.
Illustrative assets cannot support snapping, lane distance or physical-fit claims.
Banked curves and bridges require height profiles as well as projected outlines.
The gallery states the catalogue years and exclusions; it does not claim every
historical variant, current stock availability, or exhaustive 2026 release coverage.
Guardrails/scenery clearance and cosmetic print variants are not included.

Inventory
Purchase packs, individual components and multi-part assemblies are distinct.
An assembly has an explicit physicalTrackPieces count; count either the assembly
or its expanded components, never both. Null quantities are unresolved, not zero.
Some border-kit end-cap variants are unknown and retained as descriptions.

Future app behaviour
Use parameter templates for straight/curve/border authoring, with a live preview.
Validate slot margins and connector profiles. Store immutable revisions so editing
a personal piece does not rescale existing layouts. Embed used definitions in
saved tracks. Directional hardware requires a documented counterpart; a reflected
picture alone does not establish that the corresponding physical piece exists.
