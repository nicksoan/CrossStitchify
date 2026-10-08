# CrossStitchify

A dependency-free web app that turns an uploaded image into a cross stitch chart and row-by-row instructions. All image processing happens locally in the browser.

## Run locally

From the repository directory, serve the files with Python 3:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000 in a modern browser. Use an HTTP server rather than opening `index.html` directly, so JavaScript modules can load. The same files can be deployed to any static web host; no build step, package installation, or backend is needed.

## Create a pattern

1. Upload a PNG, JPEG, or WebP image (up to 10 MB and 24 megapixels).
2. Select the grid width and height (1–120 stitches each) and maximum number of colors (2–24).
3. Create the pattern to see a symbol chart, approximate thread colors, stitch counts, and row-by-row instructions.
4. Download the chart as PNG and the instructions as TXT.

Images retain their aspect ratio and are centered in the selected grid with white padding. Transparent areas become white. Every grid square, including white, represents one full cross stitch. Color reduction approximates the source image; HEX colors are guides for choosing floss, not manufacturer thread codes. On 14-count Aida, divide the grid dimensions by 14 to get the design size in inches, then add framing margins.

For best results, use a simple, high-contrast image and a larger grid for detailed subjects. Animated images use the browser's decoded frame, not an animated pattern.

## Tests

With Node.js 18 or newer:

```sh
npm test
```

Tests cover color reduction, transparent pixels, stitch counts, row instructions, and invalid grid input.