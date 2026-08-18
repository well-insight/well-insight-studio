---
title: Introduction
order: 1
description: What Well Design is and who it is for.
---

# Introduction

**Well Design** (`@well-design/ui`) is a Vue 3 component library with design tokens, light/dark themes, and motion preferences. Use it inside this monorepo, or build and publish it as a standalone package.

## Goals

- **Reusable**: apps import components and styles from the package entry; the publish output is ESM + types + CSS.
- **Consistent**: size, semantic color, and overlay behavior follow one set of conventions.
- **Theme-first**: color, radius, space, and motion use `--wd-*` CSS variables; `useTheme` / `useMotion` / `useDensity` ship in the same package.
- **Docs as preview**: each component’s `docs/index.md` (Chinese) and `docs/index.en.md` (English) support Markdown plus interactive `vue preview` blocks.

## Packages

| Package | Role |
| --- | --- |
| `@well-design/ui` | Components, styles, theme APIs, and the docs site |

## Consumption

| Context | Behavior |
| --- | --- |
| Monorepo development (Vite `development`) | `exports` points at source for HMR |
| Installed / production build | Uses ESM, `.d.ts`, and `styles.css` from `dist` |

## Next steps

- [Quick start](/docs/quick-start): install and a minimal example
- [Guide](/docs/guide): folder conventions and how to write docs
- [Theme](/docs/theme): light/dark and motion
- [Configuration](/docs/config): `ConfigProvider` / `createWellDesign`
- [Components](/components): browse every component and API
