"""Convert the original OFL fonts to WOFF2, preserving every glyph and metric.

Run in a temporary virtualenv with fonttools==4.67.0 and brotli==1.2.0.
The generated WOFF2 files are committed. Normal npm builds need no Python.
"""

from pathlib import Path

from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
before = after = 0
for source in sorted((root / "public/fonts").glob("*.ttf")):
    target = root / "public/fonts" / (source.stem + ".woff2")
    original = TTFont(source)
    original.flavor = "woff2"
    original.save(target)
    compressed = TTFont(target)
    assert original.getBestCmap() == compressed.getBestCmap(), source.name
    assert original["hmtx"].metrics == compressed["hmtx"].metrics, source.name
    for glyph in original.getGlyphOrder():
        old = original["glyf"][glyph].getCoordinates(original["glyf"])
        new = compressed["glyf"][glyph].getCoordinates(compressed["glyf"])
        assert old == new, (source.name, glyph)
    before += source.stat().st_size
    after += target.stat().st_size
    print(f"{source.name}: {source.stat().st_size:,} -> {target.stat().st_size:,} bytes")
    original.close()
    compressed.close()

if not before:
    raise SystemExit("No source fonts found in public/fonts")
print(f"Total: {before:,} -> {after:,} bytes ({(1 - after / before):.1%} smaller)")
