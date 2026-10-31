"""Build source and Timing handoff archives without overwriting old releases."""
from pathlib import Path
import argparse
import re
import zipfile

root = Path(__file__).resolve().parents[2]
base = root / 'integration' / 'slotforge-timing'


def collect_files():
    source = [root / name for name in (
        'SlotForge Circuit.html', 'SlotForge Track Builder.html', 'index.html', 'START-HERE.txt',
        'Create Windows shortcut.vbs', 'README.txt', 'README.md',
        'PROJECT-PLAN.txt', 'FREEFORM-PLAN.txt', 'LICENSE', 'THIRD-PARTY-NOTICES.txt',
        'Install Windows.cmd', 'Install macOS.command', 'Install Linux.sh')]
    for folder in ('app', 'designs', 'track-packs', 'integration', 'installer', 'docs'):
        for file in (root / folder).rglob('*'):
            relative = file.relative_to(root)
            if not file.is_file() or any(p.startswith('.') or p == '__pycache__' for p in relative.parts):
                continue
            if file.suffix.lower() in ('.zip', '.pdf', '.pyc', '.lnk', '.tmp'):
                continue
            if folder == 'app' and (file.name == 'package-files.json' or file.suffix.lower() == '.png' and file.name != 'icon.png'):
                continue
            source.append(file)
    handoff = [root / name for name in (
        'LICENSE', 'THIRD-PARTY-NOTICES.txt',
        'app/integration.js', 'app/core.js', 'app/geometry.js', 'app/routed.js',
        'app/routed-checks.js', 'app/routed.test.cjs', 'app/track-exports.js',
        'app/routed-spline.js', 'app/routed-spline.test.cjs', 'app/routed-squeeze.test.cjs', 'app/track-drawing.js', 'app/cad-export.js',
        'app/integration.test.cjs', 'app/integration-fixtures.cjs',
        'app/catalogue.js', 'app/custom-packs.js', 'app/editor-features.test.cjs',
        'track-packs/tools/geometry.cjs',
        'integration/slotforge-timing/fixtures/01-closed-oval.slotforge.json')]
    handoff += [f for f in base.rglob('*') if f.is_file()
                and 'fixtures' not in f.relative_to(base).parts
                and '__pycache__' not in f.parts
                and f.name not in ('CODEX-HANDOFF.txt', 'package.py')
                and f.suffix.lower() not in ('.zip', '.pyc')]
    for file in source + handoff:
        if not file.is_file():
            raise ValueError(f'Missing package file: {file.relative_to(root)}')
    return source, handoff


def build(output_dir, version=None, force=False):
    current = re.search(r"VERSION='([^']+)'", (root / 'app/integration.js').read_text(encoding='utf-8')).group(1)
    label = version or current + '-development'
    if not re.fullmatch(r'\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?', label):
        raise ValueError('Use a semantic version label without path characters.')
    output_dir = Path(output_dir).resolve()
    outputs = [output_dir / f'SlotForge-Circuit-v{label}-source.zip',
               output_dir / f'SlotForge-Timing-integration-v{label}-handoff.zip']
    if not force and any(p.exists() for p in outputs):
        raise FileExistsError('An archive already exists. Choose another output directory or pass --force deliberately.')
    groups = collect_files()
    output_dir.mkdir(parents=True, exist_ok=True)
    for output, files, intro in zip(outputs, groups, (root / 'START-HERE.txt', base / 'START-HERE.txt')):
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for file in sorted(set(files)):
                relative = file.relative_to(root).as_posix()
                if relative == 'START-HERE.txt':
                    continue
                info = zipfile.ZipInfo.from_file(file, relative)
                if file.suffix.lower() in ('.sh', '.command'):
                    info.create_system = 3
                    info.external_attr = (0o100755 << 16)
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, file.read_bytes())
            archive.writestr('START-HERE.txt', intro.read_bytes())
        with zipfile.ZipFile(output) as archive:
            assert archive.testzip() is None
            assert 'app/routed-spline.js' in archive.namelist()
            assert 'track-packs/tools/geometry.cjs' in archive.namelist()
            print(f'{output.name}: {len(archive.namelist())} files, {output.stat().st_size} bytes; CRC verified')
    return outputs


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, default=root / 'dist')
    parser.add_argument('--version', help='Explicit release label; default is current version plus -development')
    parser.add_argument('--force', action='store_true', help='Replace archives in the chosen output directory')
    args = parser.parse_args()
    build(args.output_dir, args.version, args.force)
