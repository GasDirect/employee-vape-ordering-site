# Replacement Pod Photos

**No verified Foger replacement-pod-only photos are included yet.**

For each flavor, obtain and verify a photograph showing the matching replacement pod (not a kit or a kit box). Confirm permission to reuse the photo, then save an optimized WebP image here, such as `cool-mint.webp`.

Update only that pod record's `image` value in `data/products.json`, e.g.:

`"image": "assets/products/foger/pods/cool-mint.webp"`

Run `python3 tools/validate_catalog.py` before committing. Unassigned images correctly show the existing "No photo supplied" placeholder in catalog and "No photo" in review/email.
