"""Build a complete portable distribution without local shortcuts or old releases."""
from pathlib import Path
import hashlib
import json
import re
import zipfile

root = Path(__file__).resolve().parents[1]
version = re.search(r"VERSION='([^']+)'", (root / 'app/integration.js').read_text(encoding='utf-8')).group(1)
files = [root / name for name in (
    'SlotForge Track Builder.html', 'index.html', 'START-HERE.txt',
    'Create Windows shortcut.vbs', 'README.txt', 'PROJECT-PLAN.txt', 'THIRD-PARTY-NOTICES.txt')]
for folder in ('app', 'designs', 'track-packs', 'integration'):
    for file in (root / folder).rglob('*'):
        if not file.is_file() or any(p.startswith('.') or p == '__pycache__' for p in file.relative_to(root).parts):
            continue
        rel = file.relative_to(root).as_posix()
        if file.suffix.lower() in ('.pyc', '.lnk', '.tmp', '.pdf'):
            continue
        if file.suffix.lower() == '.zip' and rel != 'track-packs/examples/slotforge-six-track-packs.zip':
            continue
        if folder == 'app' and file.suffix.lower() == '.png' and file.name != 'icon.png':
            continue  # Development screenshots can show local work; not app assets.
        if file.name == 'package-files.json':
            continue
        files.append(file)
files = sorted(set(files))
dist = root / 'dist'
dist.mkdir(exist_ok=True)
output = dist / f'SlotForge-Track-Builder-v{version}-complete.zip'
prefix = 'SlotForge Track Builder/'
manifest = {file.relative_to(root).as_posix(): hashlib.sha256(file.read_bytes()).hexdigest() for file in files}
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in files:
        archive.write(file, prefix + file.relative_to(root).as_posix())
    archive.writestr(prefix + 'PACKAGE-MANIFEST.json', json.dumps({'version': version, 'sha256': manifest}, indent=2) + '\n')
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for name, digest in manifest.items():
        assert hashlib.sha256(archive.read(prefix + name)).hexdigest() == digest, name
digest = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.zip.sha256').write_text(digest + '  ' + output.name + '\n', encoding='utf-8')
print(json.dumps({'archive': str(output), 'files': len(files) + 1, 'bytes': output.stat().st_size, 'sha256': digest}))
