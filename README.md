# Employee Vape Order Reference

This is a **new, separate website** copied and adapted from your working **Store Order Reference** for Sam's Club, Walmart and Aldi. Its original styling and workflow remain: searchable product cards, photos or honest placeholders, brand and type filters, quantities, notes, a saved order, store/employee information, cart review, and an email request through Google Apps Script.

**Status:** The catalog and front end are ready for deployment. **Email submission is intentionally disabled** until you create a **new** Google Apps Script project and set its `/exec` URL. Nothing was sent to your existing store-order backend.

## What's included

- 182 Foger Switch Pro 30K records: **91 Kits + 91 Replacement Pods**, separately selectable.
- 91 Kit photos stored locally at `assets/products/foger/kits/`.
- 91 Replacement Pods with accurate **No photo supplied** placeholders. The source package contained no downloaded/verified pod-only photos. Never use a Kit photo as a Pod photo.
- Categories: `Kits`, `Replacement Pods`, `Disposables` (ready for future disposable products).
- Brands: `Foger`, with the catalog prepared to accept `Breeze`, `RAZ`, `Geek Bar`, and any other brand. Brand tabs only show brands with actual active products; new brand entries activate automatically.
- No UPCs, pricing, stock quantities, payment collection, consumer checkout, or external supplier ordering.

## Deployment — quick start

The repository `GasDirect/employee-vape-ordering-site` has already been created. **Do not create a second repository or upload to the original `employee-ordering-site`.**

1. From this extracted folder, run `bash DEPLOY_TO_GITHUB.command` on a Mac with Git and GitHub CLI installed. It checks the **GasDirect** login, clones only the independent vape repository, and refuses pre-existing unrelated project files. It uploads all files and attempts to enable GitHub Pages without force pushes or remote deletions.
2. If Pages is not configured automatically, in **GasDirect/employee-vape-ordering-site → Settings → Pages**, publish **main → /(root)**.
3. Open `https://gasdirect.github.io/employee-vape-ordering-site/` after publication and verify photos, Foger Kit/Pod filters, search, saved cart, and order review. **Email is disabled** until the separate backend has been deployed and configured.

### 2. Set up a NEW Google Apps Script backend

1. Go to [script.google.com](https://script.google.com/) and create a **new project**, separate from your existing store-order script.
2. Replace the project `Code.gs` content with this folder's `backend/Code.gs`.
3. The new backend `backend/Code.gs` is already configured for `GasDirect/employee-vape-ordering-site`; no GitHub URL replacement is required. The repository must be public for Google Apps Script to fetch its catalog and images. If you change the repository owner or name, update both `CATALOG_URL` and `REPO_RAW_BASE` before deployment.
4. Check the fixed `RECIPIENT` email address in `Code.gs`; it can be changed there if you want a different recipient. If changed, update `recipientDisplay` in `data/config.json` as well.
5. Under **Deploy → New deployment**, select **Web app**, set **Execute as: Me**, and choose **Who has access: Anyone** (if allowed by your Google Workspace policy). Authorize the mail and external-fetch permissions requested by Google. Keep the deployed URL private within your team.
6. Copy the new Web App `/exec` URL. Edit the **new website's** `data/config.json`: set `backend.appsScriptUrl` to this URL. Commit it to the **new** repo.
7. Place a **small test order** yourself, verify the email, including product photos and quantities, and only then share the link with employees.

**Never reuse the current store-order Apps Script URL or project**, and never point the new backend to `GasDirect/employee-ordering-site`. The copy deliberately starts with a blank website endpoint; its backend catalog URL is configured for the NEW `GasDirect/employee-vape-ordering-site` repository. The EXISTING `GasDirect/employee-ordering-site` repository already runs the Sam's Club, Walmart, and Aldi site and must not be changed.

### 3. Add new brands whenever you're ready

You **do not need to change `assets/app.js` or `index.html`** to add Breeze, RAZ, Geek Bar, or another brand.

1. Add real product records to `data/products.json`, retaining the same structure as the Foger entries. Use a **unique** `id` and `displayOrder` for each product.
2. Use `retailer` for the brand's display name, `retailerKey` for its lowercase key, and `brand` for its display name. Examples: `Breeze`/`breeze`, `RAZ`/`raz`, `Geek Bar`/`geek-bar`. These legacy field names come from the original working site's catalog schema.
3. Set `category` to `Kits`, `Replacement Pods`, or `Disposables`. Add any new type to top-level `categories` in the JSON before using it.
4. Save actual product photos locally, e.g. `assets/products/breeze/disposables/example.webp`, then set the record's `image` to that path. If a photo is not verified, set `"image": ""` instead.
5. Run `python3 tools/validate_catalog.py`. Commit the new catalog and pictures. The brand appears in the filter and cart grouping without code changes.

A non-live example is available in `docs/NEW_BRAND_EXAMPLE.json`; it is **not part of the active catalog**.

To add verified Foger replacement-pod photos later, put them at `assets/products/foger/pods/<flavor-slug>.webp` and update the **pod** product's `image` field. Verify that the image matches the flavor and shows the **replacement pod only**, not the kit. The folder contains additional guidance.

## Safety / access notice

This is an **internal employee request reference**, not an age-verification system or consumer store. GitHub Pages is **public hosting**: `robots.txt`, the `noindex` meta tag, and a private-looking URL **do not** restrict access. If the site really must be employee-only, host it behind real company access controls rather than treating public GitHub Pages as authentication. Follow applicable age-restricted-product laws and store policies. The included source images came from the provided handoff; rights for hosting/redistribution have not been independently verified.

The Apps Script endpoint set to **Anyone** is also publicly callable and uses the original site's input limits, rate limit, duplicate suppression, and a server-side product ID check; it is not user login. Consider authenticated company hosting/backend if exposure becomes a concern.

## Test locally

With Python installed, from this website folder run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in your browser. Do not open `index.html` directly via `file://`, since the app fetches JSON files.

Catalog checking requires Python 3; optional JS smoke tests require Node.js:

```bash
python3 tools/validate_catalog.py
node tests/smoke_test.js
node tests/backend_smoke_test.js
node tests/sw_smoke_test.js
```

`TEST_REPORT.md` lists what was verified and what still needs a live deployment test. Existing store locations and the recipient display are retained from your working website; edit only the NEW `data/config.json` if you need changes.

## GasDirect deployment helper (Mac)

See `DEPLOYMENT_NEXT_STEPS.md` for the steps for your **already-created** repository. On a Mac with Git and GitHub CLI installed, `bash DEPLOY_TO_GITHUB.command` safely uploads to **GasDirect/employee-vape-ordering-site** and attempts to enable Pages. After you deploy a **new** Google Apps Script, `bash CONNECT_EMAIL_BACKEND.command` connects only that repo. Neither script touches the original site.
