# Figma exports

Frame exports the UI is built against. The spec calls the Figma design strict, so
these are the reference of record — if the code and these disagree, these win.

## Naming

Numbered in flow order so the sequence is obvious:

```
01-upload.png
02-processing.png
03-split-screen.png
04-question-selected.png
```

Add state variants with a suffix: `03-split-screen--empty.png`,
`04-question-selected--low-confidence.png`.

## Export settings

- **PNG, 2x** — text needs to be legible enough to read spacing and weights.
- One frame per file. Whole screens, not individual components, unless a
  component has states that are hard to see in context.

## Tokens

Images are enough for layout, but exact values beat eyeballed ones. If it is
quick, paste the palette, type scale and spacing into `tokens.md` in this folder
(hex codes, font sizes/line heights, the spacing step). They map onto the
`@theme` block in `apps/web/app/globals.css`.
