#!/usr/bin/env python3
"""Produce email-safe PNG thumbnails without modifying website images.

Creates 192x192 opaque white PNGs from every local product image in the catalog.
Email clients can display these without WebP transparency or CSS aspect-ratio issues.
"""
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PRODUCT_ROOT = (ROOT / "assets/products").resolve()
OUTPUT_ROOT = ROOT / "assets/email-thumbnails"
THUMB_SIZE = 192
CONTENT_SIZE = 178

def thumbnail_image(source: Path, destination: Path) -> None:
    with Image.open(source) as original:
        rgba = original.convert("RGBA")
        alpha = rgba.getchannel("A")
        bounds = alpha.point(lambda a: 255 if a >= 10 else 0).getbbox()
        if bounds is None:
            raise ValueError(f"No visible pixels in {source}")
        rgba = rgba.crop(bounds)
        white = Image.new("RGB", rgba.size, (255, 255, 255))
        white.paste(rgba, (0, 0), rgba.getchannel("A"))
        fitted = ImageOps.contain(white, (CONTENT_SIZE, CONTENT_SIZE),
                                  method=Image.Resampling.LANCZOS)
        result = Image.new("RGB", (THUMB_SIZE, THUMB_SIZE), (255, 255, 255))
        result.paste(fitted, ((THUMB_SIZE - fitted.width)//2,
                              (THUMB_SIZE - fitted.height)//2))
        destination.parent.mkdir(parents=True, exist_ok=True)
        result.save(destination, format="PNG", optimize=True)

def main() -> None:
    products = json.loads((ROOT / "data/products.json").read_text(encoding="utf-8"))["products"]
    seen = set()
    count = 0
    for product in products:
        image = str(product.get("image") or "").strip()
        if not image or image in seen:
            continue
        seen.add(image)
        relative = Path(image)
        if (relative.is_absolute() or ".." in relative.parts or
                relative.parts[:2] != ("assets", "products") or
                relative.suffix.lower() not in {".webp", ".png", ".jpg", ".jpeg"}):
            # Remote images and unexpected paths are not fetched by this tool.
            print(f"Skipping non-local image: {image}")
            continue
        source = (ROOT / relative).resolve()
        if not source.is_relative_to(PRODUCT_ROOT):
            raise ValueError(f"Image path escapes assets/products: {image}")
        if not source.is_file():
            raise FileNotFoundError(f"Missing product image: {image}")
        destination = (OUTPUT_ROOT / source.relative_to(PRODUCT_ROOT)).with_suffix(".png")
        thumbnail_image(source, destination)
        count += 1
    print(f"Created {count} opaque email PNG thumbnails.")

if __name__ == "__main__":
    main()
