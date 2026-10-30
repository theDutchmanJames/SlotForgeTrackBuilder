"""Create reproducible-content source and integration handoff ZIPs (stdlib only)."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[2]
dist = root / 'dist'
dist.mkdir(exist_ok=True)
source = [root / name for name in ('index.html', 'README.txt', 'PROJECT-PLAN.txt')]
for folder in ('app', 'designs', 'track-packs', 'integration'):
    for file in (root / folder).rglob('*'):
        if not file.is_file() or file.suffix.lower() in ('.zip', '.pdf', '.pyc'):
            continue
        if '__pycache__' in file.parts or (folder == 'app' and file.suffix == '.png'):
            continue
        source.append(file)
handoff = [root / name for name in (
    'app/integration.js', 'app/core.js', 'app/geometry.js',
    'app/integration.test.cjs', 'app/integration-fixtures.cjs',
    'app/catalogue.js', 'app/custom-packs.js', 'app/editor-features.test.cjs',
    'track-packs/tools/geometry.cjs',
    'integration/slotforge-timing/fixtures/01-closed-oval.slotforge.json')]
base = root / 'integration/slotforge-timing'
handoff += [f for f in base.rglob('*') if f.is_file()
            and 'fixtures' not in f.relative_to(base).parts
            and f.name not in ('CODEX-HANDOFF.txt', 'package.py')]
for name, files in [('SlotForge-Track-Builder-v0.2.2-source.zip', source),
                    ('SlotForge-Timing-integration-v0.2.2-handoff.zip', handoff)]:
    output = dist / name
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for file in sorted(set(files)):
            archive.write(file, file.relative_to(root).as_posix())
        archive.writestr('START-HERE.txt', (base / 'START-HERE.txt').read_text(encoding='utf-8'))
    with zipfile.ZipFile(output) as archive:
        assert archive.testzip() is None
        assert 'app/integration.js' in archive.namelist()
        assert 'track-packs/tools/geometry.cjs' in archive.namelist()
        print(f'{name}: {len(archive.namelist())} files, {output.stat().st_size} bytes; CRC verified')
