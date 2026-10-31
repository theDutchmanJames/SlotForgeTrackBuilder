<p align="center"><img src="app/icon.svg" width="88" height="88" alt="SlotForge Circuit icon"></p>

# SlotForge Circuit

Previously called SlotForge Track Builder. The new name joins SlotForge Timing
and SlotForge Paddock in the SlotForge app family. Existing tracks and custom
packs remain compatible; no data migration is needed.

### Design it. Build it. Race it.

Plan your next slot-car circuit before building it for real. Choose track pieces, snap them together and see how the layout fits your available space.

Create your own pieces with custom dimensions and **automatically generated matching icons and artwork**. Keep them together in reusable track packs, and export your layout and car-animation profile for integration with [SlotForge Timing](https://github.com/theDutchmanJames/SlotForgeTiming).

**Version 0.3.10 · Runs in your browser · Saves files on your computer · No account needed**

**[Download SlotForge Circuit](https://github.com/theDutchmanJames/SlotForgeTrackBuilder/releases/download/v0.3.10/SlotForge-Circuit-v0.3.10-complete.zip)** · [Release notes](https://github.com/theDutchmanJames/SlotForgeTrackBuilder/releases/tag/v0.3.10)

## Install and start

1. Download the ZIP above and **extract it completely**.
2. Open the extracted folder and run the installer for your system:

| System | File to run |
| --- | --- |
| Windows | Double-click **Install Windows.cmd** |
| macOS | Open **Install macOS.command** |
| Linux | Run `sh "Install Linux.sh"` in the extracted folder |

3. The installer opens the app in your browser. Choose a track pack and start building!

Setup needs an internet connection the first time. It installs the small local helper automatically—you do not need to install Node.js or other developer tools yourself. After setup, the app works offline.

**Next time:** use the **SlotForge Circuit** desktop shortcut on Windows. On macOS/Linux, use **Start SlotForge** in the installed folder; the installer tells you where that folder is.

An existing **SlotForge Track Builder** shortcut still works. The installation
and data folders retain their original `SlotForgeTrackBuilder` name so updates
continue using your saved workspace.

**Appearance:** open **Settings → App Theme** in the top-right corner. Choose from eight themes matching SlotForge Timing, or choose **Custom** and set your own background, panels, text, quiet text, lines and accent colours. Changes appear immediately and are remembered in this browser. You can start a custom palette from any preset, and it stays available when you try other themes. The header also keeps the quick **Light / Dark** switch. Track artwork keeps its physical colours and PDF reports stay printer-friendly.

**Routed wood tracks:** open **Routed Tracks** in the header, or select **Routed wood** in the builder. Start with the example, set your lane and braid/tape dimensions, then add or edit straights, circular corners and flowing curves with draggable handles. Corner radii are measured at the innermost slot. Add a table guide and lock it while building. The app checks the 2D layout and estimates slot and conductor lengths; the PDF includes the table, construction profile and design-section list. Choose **Load flowing example** to try S-bends, or select two routed sections with open ends and choose **Bridge gap**. Radius feedback highlights tight slots. CNC output and true-size cutting templates are planned later. Flowing exports require **draft.4** support in SlotForge Timing; circular/straight routed layouts keep draft.3 and ordinary layouts keep draft.2.

**Choose how you build:** every routed section has a **Routing type** selector.
Choose **Individual piece** for a separate wood section with its own outline,
or **Tabletop routing** for slots cut into one continuous board. In tabletop
mode, edge clearances apply to the table boundary, so imaginary piece borders
do not block valid curves. Actual slot or conductor folds are still rejected.
Set a default in **Routed profile**, then override it for any new or edited
section. Existing sections keep their own settings. Tabletop exports require
**draft.5** support in SlotForge Timing; earlier layout types keep their contracts.

**Reusable routed sections:** choose a named track pack in the section editor,
then **Save to pack** or **Save & add to layout**. Find your saved sets on the
Routed Tracks page and in the Track Pack Library. Circular-to-flowing conversion
keeps the chosen angle, lane order and clearances on their original sides.

**SVG / DXF construction exports:** choose **SVG / DXF** in the builder, or use the Export page to choose a saved library track. Export routed slot centrelines, slot edges, braid/tape edges, track surface contours and the table as separate layers. SVG defaults to full size; choose **Compact page** or a fixed scale for a smaller Illustrator document. The dialog shows how much to enlarge it again (for example, 1:10 → 1000%). DXF always uses full-size millimetres and retains native circular arcs. A 100 mm scale-check bar is optional. Configure cutters and depths in your CAD/CAM software. [Export details](app/CAD-EXPORTS.txt).

If the browser does not open, Windows shows an error dialog with the local address. Launch details are saved in `data/launcher.log` inside your installed folder. macOS/Linux launchers print that location in the terminal. Run the latest installer again to repair an older shortcut; your saved data is kept.

Windows installation has been tested. **The macOS and Linux installers are available for testing; they have not yet been tested on those systems.**

## Will my work stay saved?

**Yes. When you use the installed launcher, your layouts and custom packs are saved as files on your computer.** Closing the browser, restarting your computer or clearing browser data does not remove those files.

- **Save to Library** keeps a named track in your Track Library.
- Custom packs and your current drawing are saved locally as you work.
- The app keeps previous workspace versions as backups.
- Installing an update keeps your saved data.

If another window has updated a saved track, the app asks you to reopen it or save your edits as a new copy. It also warns before closing when changes have not been saved. Use **Storage → Download workspace backup** if saving fails.

The **Storage** button is in the **bottom-right corner of the app**, in the footer. It reads **Storage: disk** or **Storage: browser**. Click it to see where your files live or choose **Download workspace backup**. Keep a backup on another disk or computer for protection against device loss.

**Use the installed launcher for these disk saves.** Opening the `.html` file directly uses browser storage instead. The footer tells you which mode is active: **Storage: disk** or **Storage: browser**.

## Already have tracks in the older app?

1. Open your original app tab and choose **Storage → Download workspace backup**.
2. Open the installed app and choose **Storage → Import workspace transfer**.
3. Choose the backup file, then **Reload imported workspace**.

Your imported tracks and packs are added to the library. Existing work is kept. If the older app has no Storage button, use its JSON export buttons to transfer your tracks and custom packs individually.

## What can I do with it?

- **Build a layout:** drag, snap, rotate, mirror, duplicate and select groups of pieces. Side magnets align parallel straights and matching nested curves for wider layouts; hold Shift while dragging to bypass snapping.
- **Check your available space:** create a rectangle with exact dimensions, then move, resize or lock it.
- **Plan with reference pieces:** Carrera Hybrid roads snap directly into visual layouts. For other references, enable approximate snapping and choose a straight or curved planning shape. PDF/PNG exports and parts counts work even when slot lengths are unknown.
- **Plan the physical build:** see piece counts, borders, footprint and calculated lane lengths for supported closed circuits.
- **Create your own packs:** add custom straights, matching curves, borders and lane changers with generated artwork.
- **Watch a live preview:** tune car speed, acceleration, braking, cornering and visual drift.
- **Export your design:** download a PDF report, PNG picture, CSV parts list or SlotForge layout file.

PDFs are generated inside the app. Choose **Portrait** or **Landscape**, then **Download PDF**—there is no browser print dialog.

## Included track packs

Ten built-in packs cover several model scales:

| Track system | Model scale | Support |
| --- | --- | --- |
| Carrera Evolution / Digital | 1:32 / 1:24 | Core roads and borders; selected specials |
| Scalextric Sport / Digital | 1:32 | Core roads and borders; selected specials |
| Policar | 1:32 | Core roads and borders; selected specials |
| ScaleAuto Pro Track | 1:32 | Core roads and borders; selected specials |
| Ninco Classic / N-Digital | 1:32 | Core roads and borders; selected specials |
| SCX Universal / Classic / Advance | 1:32 | Reference artwork |
| AFX Racing / Tomy | HO / 1:64 | Flat straights and curves; special-piece references |
| Carrera GO!!! | 1:43 | Flat straights and R1/R2 curves; special-piece references |
| Carrera Hybrid | 1:50 | Approximate visual layouts with snapping, artwork and piece counts |
| Fleischmann Auto-Rallye | 1:32 | Historic flat straights and three nested curve families |

Every pack uses physical dimensions in **millimetres**. Model scale does not resize the pieces. Each system has a separate connector family. Modern Tomy/AFX is distinct from vintage Aurora A/FX, which is outside this first pack.

Published dimensions, independent measurements and nominal assumptions are identified in the [pack catalogues](track-packs/index.html). Fleischmann slot spacing is a nominal 90 mm assumption. AFX uses owner-reported 34.925 mm spacing, not Tyco spacing. Hybrid has no guide slots. Approximate magnetic ends let you plan a visual layout and export its picture and piece counts; slot lengths and slot animation remain unavailable.

Support varies by piece. Some special pieces have reference artwork only; **SCX and Carrera Hybrid use reference-based visual planning**. Hybrid has preset planning shapes; other references offer adjustable approximate shapes. The app uses nominal or user-entered dimensions and does not check collisions, bridges or vertical clearance. The space guide is a visual planning aid.

## SlotForge Timing

Choose **Export to SlotForge** to download a `.slotforge.json` file. It contains the layout, lane routes, timing-line settings and your tuned car-animation profile for the Timing integration.

Receiving-side support is being coordinated with [SlotForge Timing](https://github.com/theDutchmanJames/SlotForgeTiming). Preview animation is illustrative; real sensors remain responsible for laps and race results.

## Screenshots

**Track Builder** — plan a circuit with a locked space guide, lane lengths and a start/finish line.

[![Track Builder showing a complete circuit inside a locked available-space guide](docs/screenshots/track-builder.png)](docs/screenshots/track-builder.png)

| Track packs | Custom-piece editor | Export |
| --- | --- | --- |
| [![Built-in track packs and the custom pack editor](docs/screenshots/track-packs.png)](docs/screenshots/track-packs.png) | [![Custom curve editor with dimensions and matching radius families](docs/screenshots/custom-piece.png)](docs/screenshots/custom-piece.png) | [![Export page with track selection and PDF, SlotForge Timing, PNG and CSV options](docs/screenshots/export.png)](docs/screenshots/export.png) |
| Browse branded packs or create your own. | Define dimensions, lane spacing and matching curves. | Choose a track and the format you need. |

Click any screenshot to view it at full size.


## Help and updates

To update an installed copy:

1. In the old app, click **Storage: disk** in the **bottom-right corner**, then choose **Stop local app** and close that tab.
2. Download the latest release and run its installer again. Your saved data folder is kept.

If the button reads **Storage: browser**, you opened the HTML directly. There is no local helper to stop, so skip that step. If saving has failed, choose **Download workspace backup** in the Storage panel before reloading or updating.

[Report a problem or suggest a feature](https://github.com/theDutchmanJames/SlotForgeTrackBuilder/issues) · [More setup details](START-HERE.txt)

## License

SlotForge Circuit uses the [SlotForge Source-Available License 1.0](LICENSE).

- **Free to use**, including personal, club and internal business use.
- **Free to study, modify and share**, with the license and notices retained.
- **Selling copies or charging for access is prohibited**, including modified or hosted versions, unless the relevant copyright holders give separate written permission.
- **Your own track designs, custom packs and exports remain yours to use commercially.**

These are custom **source-available** terms, rather than an OSI-approved open-source license. GitHub may display the license as **Other**. Bundled libraries, fonts and the Node.js runtime keep their [own licenses](THIRD-PARTY-NOTICES.txt). The full license controls over this summary.

<details>
<summary>For developers and technical details</summary>

[Installer and storage details](installer/README.txt) · [Timing integration specification](integration/slotforge-timing/EXPORT-SPEC-1.0.0-draft.2.txt) · [Historical development notes](README.txt)

### Development notes

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
node --test app/theme-model.test.cjs app/core.test.cjs app/integration.test.cjs app/custom-packs.test.cjs app/editor-features.test.cjs app/library.test.cjs app/track-exports.test.cjs app/space-guide.test.cjs app/pdf-report.test.cjs app/server.test.cjs app/disk-store.test.cjs app/disk-api.test.cjs app/additional-packs.test.cjs app/side-snap.test.cjs app/local-workspace.test.cjs app/review-regressions.test.cjs app/reference-planning.test.cjs app/reference-artwork.test.cjs app/reference-editor.test.cjs installer/launcher.test.cjs
node integration/slotforge-timing/check-fixtures.cjs
```

The current source was checked with **170 passing automated tests and 15 passing integration fixtures**. See [validation details](app/validation.json) for the scope and limitations. Rebuild the complete ZIP with Python 3 using `python app/package-share.py`.

Found a rough edge or have an idea for a new piece? [Open an issue](https://github.com/theDutchmanJames/SlotForgeTrackBuilder/issues) with the track system, piece details and a small example layout where possible.

</details>
