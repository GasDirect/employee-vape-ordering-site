# GasDirect existing-repository deployment guide

**Updated November 4, 2026.** User has already created `GasDirect/employee-vape-ordering-site`. This package targets that **existing separate repository**. Do **not** create it again, and do not modify `GasDirect/employee-ordering-site` (the Sam’s Club/Walmart/Aldi website).

## Step 1 — Upload the independent website

1. Download and unzip this package. In Finder, open the `employee-vape-ordering-site` folder.
2. On your Mac, open **Terminal**, type `cd ` including the space, drag the extracted `employee-vape-ordering-site` folder into Terminal, and press Return.
3. If GitHub CLI is not installed: install Homebrew from https://brew.sh/ and run `brew install gh`. If Git is missing, run `xcode-select --install`.
4. Run `bash DEPLOY_TO_GITHUB.command`.
5. The helper will prompt you to sign in to **GasDirect** through a GitHub browser authorization, and type `UPLOAD` to confirm publishing on a **public** website.
6. The helper clones **only** `GasDirect/employee-vape-ordering-site`, accepts an empty repository or a GitHub starter README/.gitignore/license, uploads the website without force-pushing or deleting files, and attempts to configure GitHub Pages. It **refuses** to alter a repository that already has unrelated project files, so you will see a clear error if it is not a fresh repository.
7. If Pages is not enabled automatically: in https://github.com/GasDirect/employee-vape-ordering-site/settings/pages choose **Deploy from a branch → main → /(root)**, then Save.
8. After GitHub Pages publishes, the expected link is **https://gasdirect.github.io/employee-vape-ordering-site/**. Search for a Foger product, verify Kit/Pod filters, product pictures, notes, cart and saved quantities. **Email submission must still be disabled.**

## Step 2 — Create a SEPARATE Google Apps Script backend

1. Sign into your Google account, open https://script.google.com/ and create a **new** project (not the backend for the original order reference). Suggested name: `Employee Vape Order Reference — Separate Backend`.
2. Replace `Code.gs` with the complete contents of this website package's `backend/Code.gs`. It already reads the catalog/images from `GasDirect/employee-vape-ordering-site` and sends to `lpgasbilling@gmail.com` by default. Confirm the intended recipient before enabling.
3. Select **Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone**, authorize the requested permissions, and copy the new URL ending `/exec`.
4. Back in Mac Terminal, from the extracted site folder run `bash CONNECT_EMAIL_BACKEND.command` and paste that **new** `/exec` URL. This helper clones the **separate vape** repo, verifies it is correct, and changes only `data/config.json` in that repo. It cannot connect to the original store-order website.
5. When the new website has republished, make one controlled test request and confirm it arrives correctly. Do not send live employee requests until this test succeeds.

## IMPORTANT

GitHub Pages is publicly reachable, not employee-access restricted. The example Apps Script deployment with **Anyone** access is also publicly callable, without employee authentication; this setup should not be used for genuinely restricted internal access. A public catalog/URL is not age verification. Do not place credentials in GitHub, and do not reuse the old `/exec` URL. Check product-image hosting rights and applicable local laws. The Foger catalog has 91 Kits and 91 Pods; Kits have the supplied images, while Pods use honest photo placeholders.

The ChatGPT GitHub connector currently returns an account authorization error despite appearing connected in Settings. GitHub CLI authorization on your Mac is independent and can complete the initial upload even while ChatGPT's connection is unavailable.
