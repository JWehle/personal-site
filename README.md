# Jannett Wehle's personal site

This repository contains the source for [jannettw.com](https://jannettw.com), built with Hugo and the PaperMod theme.

## Repository layout

- `content/` contains the About page, project pages, and tools pages.
- `layouts/tools/` contains the custom Hugo templates for the browser-based tools.
- `static/` contains files copied directly into the generated site.
- `tests/` contains dependency-free tests for the resistor divider calculator.
- `themes/hugo-PaperMod/` is a Git submodule pinned to a specific theme commit.
- `cloudflare.sh` builds a minified site using the pinned Hugo version.

After cloning, initialize the theme submodule:

```sh
git submodule update --init --recursive
```

## Local development

Install Hugo **0.170.1** from the [official installation guide](https://gohugo.io/installation/). For a live local preview, run:

```sh
hugo server
```

Then open the local address printed by Hugo.

Run the calculator's dependency-free tests with Node.js 18 or newer:

```sh
node --test tests/resistor-divider.test.mjs
```

## Production build

On Linux x86-64, run:

```sh
bash cloudflare.sh
```

The script downloads the official Hugo 0.170.1 Linux x86-64 release into a temporary directory, builds the site with `--minify`, and removes the downloaded files when it exits. Hugo writes the generated static site to `public/`.

## Deployment

This repository does not contain a Cloudflare Worker entry point, Wrangler configuration, or deployment workflow. The Cloudflare-side deployment settings are managed outside this checkout. The build step must run `bash cloudflare.sh` (or an equivalent Hugo 0.170.1 `hugo --minify` command) and publish the generated `public/` directory. The script builds the site; it does not deploy it.
