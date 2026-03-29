# Flowlight

A long article rendered on canvas where the cursor acts as a black hole. Text reflows around it in real time and warps with gravitational lensing, like spacetime bending near a massive object.

Built with [@chenglou/pretext](https://github.com/chenglou/pretext) for pure-JS text measurement and line-by-line layout — no DOM reflow involved.

Deployed at: [flowlight.vercel.app](https://flowlight.vercel.app/)

## How it works

- `prepareWithSegments()` measures and segments the article text once
- `layoutNextLine()` lays out each line with a variable width, splitting lines around the cursor's circular obstacle — text flows on both sides when there's room
- Tile-based radial displacement simulates gravitational lensing on the rendered text near the black hole

## Run locally

```bash
npm install
npm run dev
```

## Deploy

```bash
npm run build   # outputs to dist/
npx vercel      # deploy to Vercel
```
