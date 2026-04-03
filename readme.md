# Firefox extension: goto letterboxd

Adds functionaility to easier go to a Letterboxd page while on an IMDb page.

Features:

* (left) clicking the addon button while on an IMDb page will redirect to the matching letterboxd page
* Adds a small icon on the IMDb page (next to the logo) with same redirect as the addon button
* (optional) auto redirect behavior
* Adds a 'go to IMDb' button when an item can't be found on letterboxd (this will pause the auto redirect for that item)

For options, right click the addon icon in the extensions toolbar.

## build

run `npm i` to install dependencies

```bash
npm run dev             # watch mode (recompiles on save)

npm run publish         # compile + zip at current version
npm run publish:patch   # bump patch (1.3.0 → 1.3.1), compile + zip
npm run publish:minor   # bump minor (1.3.0 → 1.4.0), compile + zip
npm run publish:major   # bump major (1.3.0 → 2.0.0), compile + zip
```

Produces `goto-letterboxd-src-{version}.zip` (source) and `goto-letterboxd-update-{version}.zip` (compiled extension for Firefox).
