# Test report — November 3, 2026

## Pass

- **Catalog validation:** 182 active records; 91 Kits and 91 Replacement Pods; unique product IDs and unique display orders; valid category and brand assignments.
- **Images:** all 91 Kit paths point to included local WebP images; all 91 Pod image paths are intentionally empty because no verified pod-only photos were included. None are silently replaced with Kit pictures.
- **Data-driven multi-brand UI:** tested Foger catalog, plus temporary (test-only) Breeze, RAZ, Geek Bar and a brand not in `config.brands`. Filters and cart grouping support all without per-brand changes.
- **Core UI logic:** mocked-document JavaScript tests passed for searching, product rendering, quantity adjustment, product notes, cart review, store and employee info, preserved local draft, and disabled submission with a blank backend URL.
- **Isolated Apps Script test:** Node.js Apps Script mocks verified catalog-backed product matching, Foger Kit inline-image and Pod missing-image behavior, duplicate request protection, rejection of unknown IDs, and an additional future brand. **No actual emails were sent.**
- **Service worker:** isolated cache-deletion and request-scope tests passed.
- **Separation:** original site source and deployed backend were not altered; the new `data/config.json` contains no live Apps Script endpoint. Storage prefix, postMessage source identifier, app title, service worker cache name, and PWA metadata have all been changed. Cache cleanup only affects new-site caches.

## Known limits / follow-up

- Full live visual-browser testing was **not completed**: the available managed Chromium installation has a policy blocking all browser navigations. The available Node.js DOM-simulation and static/catalog checks passed, but open the deployed site on an actual phone and computer before employee rollout.
- The new Apps Script `/exec` has **not been deployed**, and mail delivery has **not been tested live**. Backend GitHub catalog URL placeholders must be configured first.
- GitHub Pages does not provide employee login/access restriction. For genuinely private use, add real access-controlled hosting.
- Product photo licensing has not been independently checked. Replacement Pod pictures remain unavailable.

## Re-run checks

```bash
python3 tools/validate_catalog.py
node tests/smoke_test.js
node tests/backend_smoke_test.js
node tests/sw_smoke_test.js
```
