SlotForge Circuit — editor iteration (v0.3.11)

Previously SlotForge Track Builder. Use SlotForge Circuit.html for the named
file launcher; the previous HTML launcher remains a compatibility alias.
Existing installations keep their SlotForgeTrackBuilder folder, saved workspace,
storage keys and layout formats. No data migration is required.

ROUTED SECTION TYPES
Choose Routing type when creating or editing a routed section: Individual piece
or Tabletop routing. Individual pieces have their own wood outline; tabletop
sections are slots in one continuous table. Tabletop clearances apply to the
table boundary and do not create imaginary borders around each section.
The profile sets a default, but every section can override it. Actual slot and
conductor folds remain invalid; the preferred minimum radius is advisory.
Tabletop SVG/DXF exports omit individual piece contours. Their JSON uses the
explicit draft.5 integration contract; older layout types keep their contracts.

ROUTED TRACKS
Open Routed Tracks in the header. Load the example or create a new layout.
Set lanes, slot spacing, verges, board and braid/tape dimensions. Add editable
straights and circular corners; corner radius is measured at the innermost
slot. Set the rectangular table size, move it, then lock it. Calculated lane
lengths, live preview, material estimates, 2D checks and PDF reports work with
your routed design. Save it in Track Library as usual. See app/ROUTED-TRACKS.txt.
Flowing curves now have draggable handles, presets, direction locks and radius
feedback. Bridge gap connects two selected open ends. CNC and full-size cutting
templates are planned later. Flowing Timing exports require draft.4; circular
routed layouts retain draft.3 and ordinary tracks draft.2. No Timing app changes
are included here.

APPEARANCE
Open Settings > App Theme in the top-right corner. Choose Dark, Light,
Midnight blue, Forest green, Sunset orange, Violet, Carbon and yellow, or
Ocean (light). Custom lets you choose background, panels, text, quiet text,
lines and accent colours. Start from any preset and adjust it live. Custom
colours stay available when you try other themes. Choices are remembered in
this browser, including across Track Pack galleries. The quick Light / Dark
switch remains in the header. Track artwork keeps its physical colours;
PDF reports stay printer-friendly.

LICENSE
See LICENSE for the SlotForge Source-Available License 1.0. Personal, club and
internal business use are free. You may study, modify and share the app with
its license and notices. Selling copies or charging for access, including
modified or hosted versions, needs separate written permission. Your own
track designs, custom packs and normal exports may be used commercially.
These are source-available terms, not an OSI-approved open-source license.
Bundled third-party components retain their own licenses and notices.

REFERENCE EDITOR REPAIRS - v0.3.6
Changing a reference road's planning shape reshapes its artwork so the pictured
ends stay aligned with the magnets. Cancelling an image load cannot place a
piece later. Imported references without artwork remain editable and show a
simple road drawing. Existing saved work is preserved.

APPROXIMATE REFERENCE PLANNING - v0.3.5
Carrera Hybrid road pieces can be placed directly from the catalogue and snap
at their approximate ends. Other reference pieces offer planning controls:
enable approximate snapping, choose Straight or Curve, and adjust dimensions.
Select a placed reference and choose Edit reference planning to change it.
Visual layouts save to the Track Library and export to PDF/PNG with piece counts.
Estimated magnets do not create slots, lap lengths or a physical-fit guarantee.

REVIEW AND RELIABILITY FIXES - v0.3.4
Saved-track updates protect the version opened in your window. If another
window saves a newer version, reopen it or save your edits as a new copy.
The app warns before closing with unsaved changes and keeps the helper running
if autosave fails. Storage can download a complete workspace backup.
PNG exports retain the editor's road and border markings. Copy & adjust keeps
imported connector families and uneven slot positions. Renamed custom packs
update their piece labels. Interrupted write-lock and long-name transfer edge
cases are repaired. See app/REVIEW.txt for the review and verification details.
29 October 2026

OPEN THE APP
Recommended: run your platform installer; see START-HERE.txt. The installed
launcher enables automatic disk storage. The historical notes below describe
previous browser-only versions where relevant.
Double-click SlotForge Circuit.html in a current desktop browser.
The SlotForge Circuit shortcut uses the custom icon on this Windows PC.
Keep the supporting app, designs and track-packs folders alongside the launcher.
index.html and app/index.html remain compatible entry points.
No install, account, build step or Internet connection is required.
The existing Track Pack galleries are still in track-packs/index.html.

For a stable localhost origin (recommended for local autosave):
  node app/serve.cjs
Then open http://127.0.0.1:8173/app/
The optional server binds only to 127.0.0.1. Stop it with Ctrl+C.
Local saving belongs to the browser and origin. Moving the folder or switching
between file:// and localhost may show a different saved workspace.
Use Export to SlotForge for a portable JSON backup. Browser data can be cleared by the browser.

FIRST ITERATION
- All six pack catalogues are available, with their original reference icons.
- Buildable flat primitives use nominal geometry; incomplete items stay as
  reference artwork. SCX currently has no buildable manufacturer definitions.
- Click a catalogue item to add it. New road attaches to a free compatible end,
  preferring the selected piece. Drag near another connector to snap.
- Drag empty canvas to box-select pieces. Shift-click toggles individual pieces;
  Shift+box-select adds to the selection. Ctrl+A selects every piece.
- Move, rotate, mirror, duplicate and remove the whole selection; undo and redo.
  Scroll to zoom, Fit track to frame everything, Space+drag or middle-drag to pan.
- Mirror remembers the chosen direction for new pieces. The Mirror new pieces
  checkbox controls this independently and persists on this browser after reload.
- Custom/unbranded pack: straight, curve, left/right/double lane changers,
  straight border and curved border templates. Set dimensions, lane count, slot spacing, colour and assumed
  connector family. Preview and geometry update together.
- Custom pieces are immutable definitions. Use dimensions for custom piece
  creates a new piece; it does not change existing placements.
- Data-only custom pack JSON import/export uses slotforge.custom-pack v1.
  This importer accepts template definitions, not arbitrary SVG or executable
  plugin code. The older research pack.json schema is not imported directly.
- Layout JSON embeds every used definition, so imported files do not depend
  on the sender's installed packs. Geometry is validated and regenerated.
- Road/border counts, centreline sum, approximate footprint and parts CSV.
  Per-lane circuit lengths use connected slot routes, including reflections.
- Live preview for one closed circuit. Two cars use one shared tune profile:
  top speed, acceleration, braking, corner preference and visual drift.
  Playback rate is independent of the saved profile. Up to 8 lanes can be
  modelled, but only the first two closed routes are animated.
- Export to PDF generates a white report with track name, layout, dimensions,
  per-lane totals and inventory. Choose Portrait or Landscape, then Download PDF.
  It works offline without the browser print dialog or an external PDF service.

KEYBOARD
R / Shift+R     Rotate selected by +/-15 degrees
M              Reflect selected piece
Delete         Remove selected piece
Ctrl+D         Duplicate
Ctrl+Z / Y     Undo / redo (also Ctrl+Shift+Z)
Ctrl+S         Export layout
Space + drag   Pan
Shift-click    Toggle a piece in the selection
Ctrl+A         Select all pieces
Hold Shift while moving a selection to temporarily bypass connector snapping
Escape         Cancel current drag / clear selection

CURRENT LIMITS
Desktop-first; use a wide window for the full overview and tuning sidebar.
Select road pieces and choose Add borders in the Selection panel. Choose
inside, outside or both circuit edges. Compatible nominal borders are placed along
each edge; shorter matching sections repeat, and existing borders are skipped.
Unsupported edges are reported instead of inventing geometry. New borders join
the selection for group movement. Later single-piece moves do not automatically
move their borders; select the road and borders together. Manual positioning
with drag or X/Y/angle fields remains available.
No collision checking, elevation/bridge-clearance model, banked-road geometry,
digital branching or pit-route selection. Nominal fit is not mould certification.
Neither an overlapping drawing nor a closed connector graph proves a layout
is physically buildable. Slots and colours are simplified on the working canvas;
the pack gallery retains the more detailed manufacturer-specific artwork.
The centreline value sums placed road primitives, including disconnected ones.
Per-lane totals require a single connected closed circuit. Counts are physical
primitives, not shop multipacks. Unverified assemblies cannot be placed.
Preview is illustrative, not a vehicle physics model or lap-time prediction.
Layout limit: 500 placed pieces. Custom catalogue limit: 500 definitions.
Import size limit: 5 MB. Unknown/out-of-range parameters are rejected.
File-download support depends on the browser. Use a normal desktop browser if
an embedded browser does not expose downloaded files.

SLOTFORGE TIMING
Layout exports include a draft preparedGeometry section: transformed surface
paths, ordered world-coordinate line/arc slot routes, exact nominal route
lengths, placement references and the shared tune profile. Angles are degrees,
coordinates are millimetres with +Y down. An arc's start angle uses +X as zero;
positive sweep is clockwise. Surface transform order is reflect local Y, rotate,
then translate. SlotForge Timing's importer/widget is NOT implemented here.

DEVELOPMENT / CHECKS
No package installation is necessary. Browser scripts use standard platform APIs.
  node app/build-data.cjs          Rebuild offline catalogue and geometry bundle
  node --test app/core.test.cjs app/integration.test.cjs app/server.test.cjs
                                Geometry/import/motion/server regression tests
  node --check app/app.js          JavaScript syntax check
Browser checks cover example closure, custom validation and creation, mirror,
rotate, duplicate, undo, dragging away and snapping back, and preview presets.
app/validation.json records the verification scope and limitations.

CODE REVIEW — v0.1.2
See app/REVIEW.txt for findings, fixes, checks and remaining test gaps.
Rejected local storage is retained under the original key plus .recovery
when browser storage permits it. This is recovery data, not a backup service.

NAVIGATION — v0.1.3
The shared header is Track Builder / Track Packs / Custom Track / Export.
Every pack gallery links back to the builder in the same browser tab.
Custom Track displays your saved custom library, with creation, import/export,
Use in builder and Copy & adjust actions. Existing definitions remain immutable.
Export groups layout JSON, Print/PDF, parts CSV and custom-pack downloads.
Visual drift now swings the rear outward while the guide follows the slot.

CUSTOM LANE CHANGERS
Custom Track > Create a piece > Shape offers left, right and double lane
changers. Set length, road width, slot spacing, switch start and switch end.
They use two through lanes plus smooth parametric switching routes.
Left means lane 2 to lane 1 in the piece's forward direction; right is lane 1
to lane 2. Mirroring transforms the whole piece, including its switch routes.
The changing-route lengths are numerically integrated from their cubic curves.
These shapes approximate user measurements; they are not manufacturer models.
Live Preview and per-lane circuit totals currently follow straight-through
paths. Switching-route selection/simulation is not implemented. Layout files
include transformed alternateRoutes with cubic control points for future use.

TIMING INTEGRATION — v0.2.0
Export > Export for SlotForge Timing creates a self-contained v1 layout with
persistent design identity, content revision, stable route IDs, nominal lane
lengths and compatibility notes. Duplicate as new design creates a new identity.
In the Layout inspector, select a road and choose Set on selected road. Set the
position on that section and forward/reverse direction. The timing line follows
that piece; each lane gets a separately calculated distance offset. Lane names
are editable display text; hardware-channel mapping belongs in Timing.
Export PNG creates a tightly framed, transparent track picture with optional
borders, no grid/UI/cars, up to 1600 px and 5 MiB. PNG is a separate optional file.
Contract 1.0.0-draft.1 awaits coordination with Timing; its importer is separate.
See integration/slotforge-timing/EXPORT-SPEC-1.0.0-draft.1.txt and
TIMING-IMPORTER-CHANGES.txt. Browser-independent geometry has no npm dependencies.
Run node integration/slotforge-timing/check-fixtures.cjs for the exported cases.

LAYER ORDER
Select one or more pieces, then use Layer order in the canvas toolbar to Bring
to front or Send to back. The selection keeps its internal order. Undo/redo and
layout saving preserve layer order; PNG and printed drawings use the same order.
This controls drawing overlap only; it does not define physical bridge heights.

BORDER AND IMPORT FIXES — v0.2.1
Inside/outside now follow each connected closed circuit across straights and
curves, including mirrored/reversed placements. Open chains follow a connected
bend; isolated straights use local right as inside and local left as outside.
Unsupported/open layouts show this fallback in the Add borders dialog. Existing
borders stay where placed; remove incorrect straight borders and re-add them.
Timing imports reject explicit non-mm units and unsupported/malformed contract
metadata before normalization. Missing units and unversioned legacy integration
metadata remain supported. Envelope v1 and contract 1.0.0-draft.1 are unchanged.

NAMED PACKS, MATCHING CURVES AND REFERENCES — v0.2.2
Custom Track contains real named packs. Select New pack, name the set, then use
Add track piece to this pack. Save to Track Pack Library publishes one card
containing the whole set. Older loose custom pieces migrate into one default
pack, keeping their IDs. Plugins lists installed packs and opens their editor.
Export offers a pack selector and includes all definitions in the chosen set.
Built-in catalogue exports still omit items without parametric definitions.

For curves, choose Matching radii in this pack. Set the R1 inner ROAD EDGE
radius, road width, slot count, spacing and angle. Rn inner radius equals
R1 + (n - 1) times road width. R1 through R8 share touching road edges.
A diagram and dimension table show nesting; the selected piece preview uses
its actual angle. Cross-radius slot spacing is shown, including mismatches.
Family settings persist per pack and travel in exported pack files. Existing
pieces are never resized when changing the family settings. Choose Independent
measurements for individual curves; copying a piece defaults to this mode.
Borders are additional physical width and require clearance between radii.

Turn off Buildable only to see reference catalogue items. Open one and choose
Place as reference. Set approximate picture width/height; resize it later via
Selection > Resize reference. References support dragging, selection, rotation,
reflection, duplication, layer order and undo. Embedded PNG artwork survives
JSON saving; references appear in PNG/PDF drawings and parts inventories.
They have no connectors or slot routes and add no calculated track length.
Reference counts are separate from road/border counts; picture boxes contribute
to approximate drawing bounds. A kit picture counts as one reference, not an
invented inventory of all its constituent parts. file:// canvas permissions may
prevent catalogue-image capture; use the supplied localhost server in that case.

Starting-grid artwork now renders on the canvas, report and picture export for
ScaleAuto SC-10001C/D, Scalextric C7018 and Ninco 10114, preserving slot geometry.

Timing exports now declare integration contract 1.0.0-draft.2 for the reference
template. Envelope stays slotforge.layout v1. Draft.1 and legacy files still
import. Timing must deliberately adopt the updated runtime before accepting
Draft.2; see integration/slotforge-timing/EXPORT-SPEC-1.0.0-draft.2.txt.

CATALOGUE FOLDERS AND TRACK DESIGN LIBRARY — v0.2.3 (30 October 2026)
The Builder catalogue has collapsible Straights, Corners, Digital pieces and
Extras folders, in that order. Corners use natural R1/R2/R3 order;
straights use descending length, then natural name order. Reference straights
with a published length in their name use that label for sorting only: this
does not grant them physical geometry. Borders and accessories live in Extras.
Folders retain their open/closed state per pack. Search opens matching folders
without changing your saved expansion preferences. All custom packs use the
same grouping; custom lane-changer templates go in Digital pieces.

Choose Save to library in the Builder, name the layout, then open Track Library
in the shared header. The library holds independent snapshots in IndexedDB on
this browser/origin/device, separate from the current autosaved work in progress.
A snapshot includes embedded piece definitions/reference artwork, placements,
timing configuration and the shared tune profile. Updating preserves design.id;
Save as a new copy creates a new design.id without changing slot route geometry.
Cards provide thumbnails, search by name, Open in builder, Download JSON and
Delete with confirmation. Opening prompts before replacing the current layout.
Changes in the Builder do not update a saved snapshot until explicitly saved.
Download JSON backups for portability: clearing browser data removes the local
library, and changing origins/ports uses a different library. No cloud sync.
Timing integration remains contract 1.0.0-draft.2; no new export schema changes.

CLEARER NAMING AND EXPORTS — v0.2.4 (30 October 2026)
The builder has a labelled Track name field with a contrasting background and
border. Save to Library, Export to PDF and Export to SlotForge sit together.
Export to PDF opens the white report preview; choose Print / Save as PDF and
select your browser's PDF destination. Export to SlotForge downloads the complete
.slotforge.json layout, including routes, timing metadata and tune profile.

The renamed Track Library retains all existing saved snapshots. Each card has
an Export button that preselects that saved track on the Export page.
On Export, first choose Current builder track or a saved Track Library entry.
The thumbnail and source note identify the selection. PDF, SlotForge JSON, PNG
and CSV all use the selected snapshot without opening it or replacing current
builder work. Missing or incompatible saved tracks produce an error; they never
silently export the current track. Track-pack export is in a separate expandable
section with its own pack selector.
Integration contract remains 1.0.0-draft.2 and layout envelope remains version 1.

NAMED LAUNCHER, ICON AND AVAILABLE-SPACE GUIDE — v0.2.5 (30 October 2026)
SlotForge Circuit.html is the named file launcher. The root Windows
shortcut points to that launcher and app/icon.ico. Browser tabs use icon.svg;
the icon reuses the red-and-white track symbol from the app header. Windows
normally gives HTML files the browser's icon, so use the shortcut for the custom
icon in Explorer. The shortcut is local to this folder on this PC; recreate its
paths if you move the folder. The HTML launcher itself remains portable.
Your existing localhost tab keeps its current saved tracks. Opening via file://
uses separate browser storage; use JSON exports to transfer between origins.

Choose + Space guide above the builder canvas. Set horizontal length and
vertical width in millimetres (10–50,000 mm). Equal dimensions make a square.
Apply scale adjusts both dimensions by a percentage while preserving their
proportions. Save guide places it behind the roads; drag its tinted area to
move it or its bottom-right handle to resize. Shift+resize preserves proportion.
Lock guide makes the rectangle and label ignore pointer events: track-piece
selection, dragging and marquee selection continue through it. Unlock guide or
Space guide settings remain reachable above the canvas. Fit track includes the
guide. Undo/redo include guide edits; remove is also undoable. New tracks and
examples clear the old guide. Guide dimensions never scale physical track pieces.
The guide persists in autosave, Track Library snapshots and JSON round trips.
It is an editor-only visual reference and is excluded from road inventory,
route lengths, Timing pictures, PNG and PDF reports. No automated fit/collision
check is implied.

Optional JSON metadata: workspace.spaceGuide has x, y, lengthMm, widthMm and
locked. This is separate from physical design geometry and does not change the
integration contract (1.0.0-draft.2), layout envelope (v1), design revision or
lane mapping. Older readers may ignore it; updated Builder preserves it.

DIRECT PDF EXPORT — v0.2.6 (30 October 2026)
Export to PDF now generates the document inside the app. Choose A4 portrait
(default) or landscape, then Download PDF. The browser print dialog is no
longer involved; its scaling, margins and remembered printer settings cannot
alter the PDF. Both the Builder button and the Export page use this flow.
The report has a clear title, counts, footprint, high-resolution pale track
picture, per-lane lengths when available, and a readable parts inventory.
Tables paginate with repeating headings; footers show page numbers. A short
example circuit fits on one portrait page. Noto Sans fonts are embedded for
common accented, Greek and Cyrillic text. The report keeps reference-only
lengths unknown and records nominal/measurement and lane-changer limitations.
PDF generation is local and offline. jsPDF 4.2.1 (MIT) and Noto Sans (OFL 1.1)
are bundled in app/vendor/ with their licenses and source hashes; see
THIRD-PARTY-NOTICES.txt. No new timing contract or layout envelope version.

PERSISTENT FILES AND PER-USER INSTALLERS — v0.3.0 (30 October 2026)
The app remains browser-based. A file-copy installer creates a safe per-user
folder containing versioned app files, a private Node runtime and separate data/.
The launcher opens the browser and starts a loopback-only storage helper. It
recognizes the installation's data directory; HTML alone does not get arbitrary
filesystem access. No cloud, account, global Node installation or npm is needed.

Disk mode stores autosave, the Track Library and custom packs in workspace.json.
Writes are checked, flushed and atomically replaced, guarded by a process lock
and per-record revisions. Conflicting windows cannot silently overwrite work.
20 previous workspace versions are kept. Failed/unreadable files are retained.
Updates switch a versioned app pointer and do not replace data/. Old app versions
remain available. Browser-data clearing and port/browser changes do not erase
the disk workspace. Normal disk loss still requires an independent backup.

Storage shows the data location and exports/imports complete workspace transfers.
It can copy old browser saves when that origin can still read them. Transfers
merge without replacing current work, deduplicate repeated imports and keep
piece definitions with custom packs. Individual JSON exports remain supported.
Direct HTML opening is still browser-only mode and clearly labelled.

The first installer download is a pinned, checksum-verified official Node.js
runtime. Install Windows.cmd, Install macOS.command and Install Linux.sh select
x64/arm64. Windows setup is tested here; native macOS/Linux checks are pending.
See START-HERE.txt and installer/README.txt for installation, data and recovery.
Physical layout envelope v1 and Timing contract draft.2 are unchanged.

TRACK PACK EXPANSION — v0.3.1
Four new packs: AFX Racing / Tomy (HO / 1:64), Carrera GO!!! (1:43),
Carrera Hybrid (1:50, slotless reference artwork) and Fleischmann Auto-Rallye
(1:32). 62 new SVG drawings; 23 new nominal flat-road geometry models.
Actual dimensions always use mm; model scale never resizes the road.
Modern Tomy/AFX is separate from vintage Aurora A/FX. Hybrid uses reference
placement only, without invented slots, snapping, lane lengths or preview.
Fleischmann slot spacing is a documented nominal 90 mm assumption.
Sources and limitations: track-packs/<system>/pack.json and index.html.
Integration contract remains 1.0.0-draft.2; layout envelope remains version 1.

WINDOWS LAUNCHER FIX — v0.3.2
The desktop shortcut starts the private helper without a terminal window and
opens the default browser through Windows ShellExecute. Browser handoff is
awaited even when reusing a running app. Startup errors are written to
data/launcher.log and shown in a Windows error dialog. If the browser cannot
open, the helper stays available and the dialog gives its local address.
Reinstalling updates the desktop shortcut and keeps data/ unchanged.

MAGNETIC ROAD SIDES — v0.3.3
With Snap on, drag a straight beside another compatible straight or nest
matching curve radii. A cyan dashed edge shows side alignment during dragging.
Nearby seams align too; shorter pieces can also share part of a longer edge.
Groups move as a unit, including closed circuits without free end connectors.
Hold Shift while dragging to bypass snapping. Curves must share the same road
edge radius; the app never stretches a piece to force it to fit. Reference
pictures and borders do not act as magnetic road sides. Side alignment does
not create electrical connections or change the calculated lane geometry.

ROUTED SVG / DXF EXPORTS
Choose SVG / DXF in the builder, or choose a saved library design on Export.
Select layers for slots, conductor edges, the track footprint and the table.
SVG is full-size in mm; DXF declares mm. The optional reference bar is 100 mm.
Matching surface seams are removed. Set tools and depths in CAD/CAM.
See app/CAD-EXPORTS.txt. No additional installation is needed.
