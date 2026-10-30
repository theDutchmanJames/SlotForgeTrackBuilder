<p align="center"><img src="app/icon.svg" width="88" height="88" alt="SlotForge Track Builder icon"></p>

# SlotForge Track Builder

### Design it. Build it. Race it.

Turn the space you have into the circuit you want. **SlotForge Track Builder** is a visual slot-car track planner that combines physical piece geometry with a flexible drag-and-snap editor. Plan your next layout, explore a live preview, and take a clear parts list to the real build.

Go beyond the supplied catalogues: create custom pieces using your own dimensions, lane spacing and colours, with matching icons and track artwork generated automatically from their geometry. Organise them into your own track packs to reuse and share. Built for integration with [SlotForge Timing](https://github.com/theDutchmanJames/SlotForgeTiming), the Builder exports your track design, slot routes, timing-line settings and tuned car-animation profile in a single `.slotforge.json` file.

**Current version: 0.3.0 · Runs in your browser · No account required**

[Download the complete app](downloads/SlotForge-Track-Builder-v0.3.0-complete.zip) · [Getting started](START-HERE.txt) · [Detailed notes](README.txt) · [SlotForge Timing](https://github.com/theDutchmanJames/SlotForgeTiming)

## Screenshots

**Track Builder** — plan a circuit with a locked space guide, lane lengths and a start/finish line.

[![Track Builder showing a complete circuit inside a locked available-space guide](docs/screenshots/track-builder.png)](docs/screenshots/track-builder.png)

| Track packs | Custom-piece editor | Export |
| --- | --- | --- |
| [![Built-in track packs and the custom pack editor](docs/screenshots/track-packs.png)](docs/screenshots/track-packs.png) | [![Custom curve editor with dimensions and matching radius families](docs/screenshots/custom-piece.png)](docs/screenshots/custom-piece.png) | [![Export page with track selection and PDF, SlotForge Timing, PNG and CSV options](docs/screenshots/export.png)](docs/screenshots/export.png) |
| Browse branded packs or create your own. | Define dimensions, lane spacing and matching curves. | Choose a track and the format you need. |

Click any screenshot to view it at full size.

## From an idea to a physical layout

- **Build by feel.** Drag, snap, rotate, reflect and duplicate pieces. Select several at once, arrange their drawing order and undo changes.
- **Plan around your room or table.** Add a space guide with exact length and width. Move, resize or scale it, then lock it so it stays out of the way while building.
- **Keep the geometry honest.** Piece dimensions, lane spacing, matching curve radii and borders determine the layout. See parts counts, footprint, track centreline length and per-lane lengths for supported closed circuits.
- **Make your own track system.** Create named custom packs with straights, matching R1/R2/R3 curves, borders and lane changers. Save them to the pack library, then import or export them as data-only plugins.
- **See it in motion.** Preview two cars following the slots. Tune speed, acceleration, braking, cornering and visual drift with a shared animation profile.
- **Keep your favourites.** Save independent layouts in the Track Library, including their timing settings, tune profile and space guide.
- **Take the design with you.** Export a printer-friendly PDF report, a transparent PNG, a CSV parts list or a complete `.slotforge.json` layout for the SlotForge Timing integration. Choose the current track or a saved library track.

## Supplied track packs

| Track system | Pack |
| --- | --- |
| Carrera | Evolution / Digital |
| Scalextric | Sport / Digital |
| Policar | Policar track system |
| ScaleAuto | Pro Track |
| Ninco | Classic / N-Digital |
| SCX | Universal / Classic / Advance reference catalogue |

Each pack has matching artwork and source notes. Support varies by piece: supported geometry can snap and contribute to route calculations; incomplete or special pieces can be placed as reference pictures. **SCX is currently reference-only.**

## Get started

1. [Download the complete ZIP](downloads/SlotForge-Track-Builder-v0.3.0-complete.zip) and extract it fully.
2. Run **Install Windows.cmd**, **Install macOS.command**, or `sh "Install Linux.sh"`.
3. Use the installed **Start SlotForge** launcher to open the app in your browser.

Setup copies the app into your own application-data folder and supplies a private local runtime. Its first download is verified against the official Node.js release checksum. There is no account, npm installation, administrator requirement or global Node setup. After installation, the app works offline.

The installer places files; a small local helper lets the browser read and write the known data folder. The interface stays browser-based. Windows setup and the browser storage flow are tested; **native macOS and Linux installation testing is still pending**. The scripts select x64 or arm64 runtimes for all three systems. See [setup details](START-HERE.txt).

## Your files stay on your disk

Installed copies save the current drawing, Track Library and custom packs to **`data/workspace.json`**, with up to 20 previous workspace versions in `data/backups/`. The data folder sits beside the versioned application files, so an update can replace the app while keeping your work.

| System | Default installation folder |
| --- | --- |
| Windows | `%LOCALAPPDATA%\SlotForgeTrackBuilder` |
| macOS | `~/Library/Application Support/SlotForgeTrackBuilder` |
| Linux | `~/.local/share/SlotForgeTrackBuilder` (or `$XDG_DATA_HOME`) |

The footer's **Storage** button shows the exact data folder and provides a complete workspace backup/transfer. Clearing browser data or using another browser does not clear the installed disk workspace. Back up the data folder to another disk for protection against device or disk loss.

To move older browser saves, open **Storage → Download workspace backup** in the original tab, then **Storage → Import workspace transfer** in the installed app. Older versions without Storage can export individual track and custom-pack JSON files. Imported work is merged, with the old current drawing added to the library rather than replacing the new current drawing.

Opening **SlotForge Track Builder.html** directly still works as a browser-only fallback; it uses browser storage and is labelled accordingly. Use the installed launcher for automatic file saving. Developers with Node.js can run `node app/serve.cjs`; the local server uses the same default disk data location. Details and environment overrides are in [the installer notes](installer/README.txt).

## SlotForge Timing integration

The `.slotforge.json` export includes the design, embedded piece definitions, validated slot routes, nominal lane lengths, timing-line settings, stable identities and a shared animation profile. The receiving application can regenerate the drawing without a separate PNG.

- Layout envelope: **`slotforge.layout` version 1**.
- Integration contract: **`1.0.0-draft.2`**.
- [Base specification](integration/slotforge-timing/EXPORT-SPEC-1.0.0-draft.1.txt) and [draft.2 additions](integration/slotforge-timing/EXPORT-SPEC-1.0.0-draft.2.txt).
- [Receiving-side workflow](integration/slotforge-timing/TIMING-IMPORTER-CHANGES.txt).

Receiving-side support is coordinated with [SlotForge Timing](https://github.com/theDutchmanJames/SlotForgeTiming). The animation profile shapes estimated movement; real sensor crossings remain authoritative for laps and race results.

## Current boundaries

This is an early desktop-browser iteration. Dimensions are nominal or user-entered planning values. The editor does not certify physical fit or detect collisions, bridges or vertical clearance. The space guide is a visual aid. Preview and lane calculations follow a single supported closed circuit using straight-through lane-changer routes; digital switching and pit-route simulation are outside the current scope. PDF export generates the file directly in the app, with portrait A4 as the default and an optional landscape layout.

## Work on the project

The app uses plain HTML, CSS and JavaScript. PDF generation uses bundled jsPDF and Noto Sans fonts, so it works offline without an npm installation or online PDF service. See [third-party notices](THIRD-PARTY-NOTICES.txt).

| Folder | Contents |
| --- | --- |
| `app/` | Editor, geometry/integration runtime, local server and tests |
| `track-packs/` | Track catalogues, SVG artwork, source notes and generators |
| `designs/` | Shared visual style and early design studies |
| `integration/slotforge-timing/` | Integration specifications and example fixtures |
| `installer/` | Per-user file-copy setup and local launcher |
| `downloads/` | Ready-to-share complete app ZIP |

Run the source tests with a current Node.js runtime:

```sh
node --test app/core.test.cjs app/integration.test.cjs app/custom-packs.test.cjs app/editor-features.test.cjs app/library.test.cjs app/track-exports.test.cjs app/space-guide.test.cjs app/pdf-report.test.cjs app/server.test.cjs app/disk-store.test.cjs app/disk-api.test.cjs
node integration/slotforge-timing/check-fixtures.cjs
```

The v0.3.0 package was checked with **105 passing source tests and 15 passing integration fixtures**. See [validation details](app/validation.json) for the scope and limitations. Rebuild the complete ZIP with Python 3 using `python app/package-share.py`.

Found a rough edge or have an idea for a new piece? [Open an issue](https://github.com/theDutchmanJames/SlotForgeTrackBuilder/issues) with the track system, piece details and a small example layout where possible.
