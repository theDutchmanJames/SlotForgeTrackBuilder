SlotForge per-user file-copy installer

The scripts place a private copy of the app and Node runtime in the user's own
application-data directory. They do not register a service, change PATH, install
npm packages or require administrator access. The launcher opens the system's
browser and runs a loopback-only storage helper. The helper knows its data folder;
the browser never receives general filesystem access.

Application versions are copied under app/<version>-<content-hash>. The active
pointer is switched only after all package file hashes and the copied app have
been checked. data/ is outside those versioned directories and is never replaced
by the installer. Re-running setup retains prior versions and data.

Official runtime: Node.js v24.22.2. node-runtimes.json lists exact download URLs
and SHA-256 hashes for Windows, macOS and Linux x64/arm64. The scripts check the
hash before running the downloaded binary. Runtime licenses are retained. The
private executable is versioned so an older Windows process does not lock the
new runtime during an update.

Offline setup: place the matching official Node archive in
installer/runtime-archives/ before running setup. Its pinned hash must match.
Otherwise setup downloads it from nodejs.org on the first install.

Optional environment settings:
 SLOTFORGE_HOME            Dedicated installation folder (not a drive/home root).
 SLOTFORGE_NO_OPEN=1       Install without launching a browser/local process.
 SLOTFORGE_NO_SHORTCUTS=1  Skip the Windows desktop shortcut.
The last two settings support unattended installation tests.

With an existing Node runtime, after extracting a complete package you can run:
 node installer/install.cjs --home "a dedicated folder" --no-open --no-shortcuts
This takes a private copy of that executable. Normal users should use the
platform bootstrap to obtain the verified official version instead.

The launcher reuses an already-running instance only when its installation data
path, app version and installed content build match. If another app or old preview uses the preferred
port, the launcher chooses a different local port. The saved files stay the same.

Storage limits: one workspace.json, at most 50 MiB; 200 saved tracks. Writes use
same-directory temporary files, file flush, an interprocess write lock and atomic
rename. Previous successful workspaces are kept under backups/ (20 versions).
Deleted library entries remain in a bounded trash history inside workspace.json;
older deleted entries may be pruned to make room. Disk failure and arbitrary
network filesystems are not certified; keep an independent backup.

Recovery: stop all local SlotForge processes, copy data/ somewhere safe, then
restore a known-good backups/*.json copy as workspace.json. An unreadable live
file is never silently reset. If a crashed process left a stale .write-lock,
stop all SlotForge processes before removing that lock file.

Native macOS/Linux installation testing remains outstanding. No signed installer,
Gatekeeper bypass, Linux service or Windows registry installation is included.
