# Complete Foger Kit + Pod image integration (review branch)

**Source:** User-supplied 2026-11-05 handoff. The `docs/foger_images_manifest.json` records the 182 authoritative Kit/Pod WebP SHA-256 hashes, names, flavors and paths.

- Product count: 91 separate Foger Switch Pro 30K Kits and 91 separate Replacement Pods.
- Both product types retain their independent product IDs and local `assets/products/foger/{kits,pods}/...webp` paths.
- `data/products.json` is merged by Foger ID; no other brands are removed or overwritten.
- The email backend's existing PNG-attachment resolver is unchanged. New white-background 192×192 Pod PNGs are available in `assets/email-thumbnails/foger/pods/`; Kit PNGs are retained or regenerated if needed.
- No changes to `data/config.json`, `backend/Code.gs`, `assets/app.js`, `assets/styles.css` or to the separate Sam's Club/Walmart/Aldi site.
- No live test email is sent by this integration or the local tests.
- After PR review, merging the branch into `main` deploys GitHub Pages. The existing Google Apps Script backend need not be redeployed for catalog/image-only changes because it fetches the live catalog and thumbnail files from GitHub.

## Names that merit a final visual check

- **Pineapple Coconut:** Kit/catalog name is Pineapple Coconut, Pod artwork says Pineapple Coconut Ice. Left as the original catalog name pending confirmation.
- **Strawberry B-POP:** Pod artwork says Strawberry B-Burst. User confirmed the alias; kept the catalog name Strawberry B-POP.
- **Strawberry Watermelon Hubba:** Pod artwork does not say Hubba. The distinct pink/green picture is mapped to the Hubba record, not regular Strawberry Watermelon.

**Usage note:** This is an internal employee stocking-request reference, not consumer checkout. Product-image redistribution rights should be reviewed because GitHub Pages is public hosting, even if robots/noindex headers discourage indexing.
