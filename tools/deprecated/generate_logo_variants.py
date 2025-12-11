#!/usr/bin/env python3
"""
Simple generator to produce color variants of starstucklab-logo.svg
It reads the template SVG, replaces default hex color strings (#000000 and #ffffff),
and writes new SVG files.
"""

from pathlib import Path

TEMPLATE = Path("assets/logo/starstucklab_logo_black_white.svg").read_text(encoding="utf-8")

variants = [
    ("#OBOC10", "#F4F4F4", "deep_space_black_near_white"),
    ("#F4F4F4", "#OBOC10", "near_white_deep_space_black"),
    ("#OBOC10", "#4EC57A", "deep_space_black_sapling_green"),
    ("#4EC57A", "#OBOC10", "sapling_green_deep_space_black"),
    ("#7D5FFF", "#F4F4F4", "melancholy_purple_near_white"),
    ("#F4F4F4", "#7D5FFF", "near_white_melancholy_purple"),
    ("#4EC57A", "#7D5FFF", "sapling_green_melancholy_purple"),
    ("#7D5FFF", "#4EC57A", "melancholy_purple_sapling_green")
]

outdir = Path("assets/logo/variants")
outdir.mkdir(exist_ok=True)

for star, sapling, name in variants:
    s = TEMPLATE
    # Replace the default hex color strings directly, using temp placeholders to avoid conflicts
    s = s.replace("#000000", "TEMP_STAR")
    s = s.replace("#FFFFFF", "TEMP_SAPLING")
    s = s.replace("#ffffff", "TEMP_SAPLING")
    s = s.replace("TEMP_STAR", star)
    s = s.replace("TEMP_SAPLING", sapling)
    out_path = outdir / f"starstucklogo_{name}.svg"
    out_path.write_text(s, encoding="utf-8")
    print("Wrote", out_path)
