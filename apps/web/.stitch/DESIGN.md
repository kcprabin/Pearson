---
name: Pearson
colors:
  surface: '#f5f7f5'
  surface-dim: '#e8ede8'
  surface-bright: '#fafcf9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6faf5'
  surface-container: '#f1f5ef'
  surface-container-high: '#e4ede8'
  surface-container-highest: '#d7e4dc'
  on-surface: '#193b39'
  on-surface-variant: '#516861'
  inverse-surface: '#113b3a'
  inverse-on-surface: '#f5f9f4'
  outline: '#75a393'
  outline-variant: '#e1e8e2'
  surface-tint: '#477d70'
  primary: '#113b3a'
  on-primary: '#f5f9f4'
  primary-container: '#1b4a47'
  on-primary-container: '#d8e6e1'
  inverse-primary: '#d9e85a'
  secondary: '#d9e85a'
  on-secondary: '#173d3b'
  secondary-container: '#dfe9bc'
  on-secondary-container: '#1e403d'
  tertiary: '#477d70'
  on-tertiary: '#ffffff'
  tertiary-container: '#e4efe8'
  on-tertiary-container: '#285654'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e4dc'
  primary-fixed-dim: '#a7c0b9'
  on-primary-fixed: '#113b3a'
  on-primary-fixed-variant: '#285654'
  secondary-fixed: '#dfe9bc'
  secondary-fixed-dim: '#d3dfa8'
  on-secondary-fixed: '#173d3b'
  on-secondary-fixed-variant: '#5e7566'
  tertiary-fixed: '#e4efe8'
  tertiary-fixed-dim: '#aec8ba'
  on-tertiary-fixed: '#193b39'
  on-tertiary-fixed-variant: '#477d70'
  background: '#f5f7f5'
  on-background: '#172121'
  surface-variant: '#e1e7e2'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 39px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.04em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.02em
  body-base:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
    letterSpacing: '0'
  body-bold:
    fontFamily: DM Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 19px
    letterSpacing: '0'
  label-mono:
    fontFamily: DM Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.14em
  stat-lg:
    fontFamily: Space Grotesk
    fontSize: 31px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.375rem
  md: 0.4375rem
  lg: 0.5rem
  xl: 1rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 14px
  margin-mobile: 20px
  margin-desktop: 40px
---

# Design System: Pearson
**Project ID:** 1307347744362967267

## 1. Visual Theme & Atmosphere

Pearson is an autonomous AI voice and WhatsApp ordering platform built for modern restaurants and hospitality teams. Its visual identity balances operational clarity with a calm, organic hospitality aesthetic: deep botanical teal anchors the navigation and brand surfaces, while crisp off-white and fern-mist canvases keep high-density order, revenue, and feedback data effortless to scan during busy service hours.

A high-energy citron-lime accent (`#d9e85a`) cuts through the deep teal (`#113b3a`) and sage neutrals to spotlight primary actions, active navigation states, and AI co-pilot moments. Surfaces rely on crisp 1px sage hairline borders (`#e1e8e2`) and subtle tonal layering rather than heavy drop shadows, creating a disciplined, low-glare workspace that feels both precision-engineered and welcoming.

## 2. Color Palette & Roles

### Primary Foundation
- **Deep Teal (`#113b3a` / `#143d3a`)** — Primary brand surface for the fixed sidebar, split-screen login artwork, and brand badge text.
- **Fern Mist (`#f5f7f5` / `#f5f8f6`)** — Root application shell and public page canvas.
- **Pure White (`#ffffff`)** — Elevated card, stat box, modal, and form input surface.
- **Sage Border (`#e1e8e2` / `#e1e7e2`)** — Hairline 1px borders separating cards, topbar, and table rows.

### Accent & Interactive
- **Citron Lime (`#d9e85a`)** — Primary CTA fill, brand mark background, active sidebar left-border indicator, and unread/count badges.
- **Olive Press (`#cbdc3f` / `#c9da45`)** — Hover state for primary citron buttons.
- **Forest Teal (`#477d70` / `#75a393`)** — Text links, eyebrow labels, and active tab underlines.
- **Citron Wash (`#dfe9bc`)** — Tinted container surface for the Pearson AI Assistant co-pilot panel.

### Typography & Text Hierarchy
- **Pine Dark (`#193b39` / `#1a3e3b`)** — Primary headings, page titles, and KPI stat values.
- **Moss Gray (`#75827d` / `#8d9993`)** — Subtitles, supporting copy, and breadcrumb trails.
- **Muted Sage (`#9baaa3` / `#9aa8a0`)** — Captions, timestamps, and secondary metadata.

### Functional States
- **Emerald (`#5a9c77` / `#63ad7d`)** — Positive growth metrics, online WhatsApp status dots, and feedback confirmation states.
- **Warm Amber (`#e2a55c` / `#a37540`)** — Pending/new order status indicators and star ratings.
- **Slate Blue (`#79a4c4` / `#587694`)** — In-progress kitchen order status.

## 3. Typography Rules

### Hierarchy & Weights
- **Space Grotesk (600–700)** — Used for page titles (`clamp(28px, 3vw, 39px)`), KPI stat figures (`31px`), panel headings (`16px`), and the `Pearson` wordmark (`21px`). Tight negative tracking (`-1.5px` on H1) gives headings editorial punch.
- **DM Sans (400–600)** — Used for body copy, navigation items (`13px`), table rows (`12px`), and form labels.
- **DM Mono (400–500)** — Used for uppercase eyebrow labels (`10px`, `1.4px` letter-spacing), order amounts, and avatar initials.

### Spacing Principles
- Eyebrow labels sit `12px` above display headings with generous `38px` bottom margin on page headers.
- Body copy uses relaxed `1.5–1.6` line-height for quick legibility.

## 4. Component Stylings

### Buttons
- **Primary CTA**: Solid Citron Lime (`#d9e85a`) with Pine Dark (`#173d3b`) semibold text, `5px` radius, `11px 15px` padding.
- **Dark Button**: Solid Deep Teal (`#163f3d`) with white text, `5px` radius.
- **Secondary / Ghost**: White fill with `1px solid #e1e8e2` border or soft sage tint (`#e4ede8`).

### Cards & Containers
- Flat white (`#ffffff`) with `1px solid #e1e8e2` border and `7px` (`0.4375rem`) border radius.
- Internal padding of `18px–22px`; `14px–20px` grid gaps.

### Navigation
- **Sidebar**: Fixed `252px` Deep Teal (`#113b3a`) rail with workspace switcher, `WORKSPACE` mono label, 7 nav items (`6px` radius, `#285654` active fill with `3px` inset Citron Lime bar), and bottom profile/AI help card.
- **Topbar**: `76px` height on `#fafcf9` with breadcrumb trail, WhatsApp/AI status pills, and quick actions.

### Inputs & Forms
- White background, `1px solid #d6e0d8` border, `5px` radius, `12px 13px` padding, focusing to `#82ab9a` border with a soft `3px #e2eee5` ring.

### Domain-Specific Components
- **Customer Feedback Point**: Centered card (`max-width: 512px`) with interactive 5-star rating selector, category pills, and confirmation state.
- **Feedback Response Thread**: Review cards with star filter tabs, QR/link share bar, and inline owner reply composer.

## 5. Layout Principles

### Grid & Structure
- App shell pairs a `252px` fixed left sidebar with a fluid main area (`max-width: 1190px`, `5%` horizontal padding).
- KPI stats use a 4-column grid (`14px` gap); overview analytics use a `1.7fr 1fr` asymmetric split.

### Responsive Behavior
- Below `900px`: Sidebar collapses into a slide-over drawer with a backdrop overlay.
- Below `650px`: Stats grid collapses to 2 columns; `1.7fr 1fr` overview grid stacks to 1 column.

## 6. Design System Notes for Stitch Generation

### Language to Use
- Describe Pearson as an **earthy-tech hospitality command center** with crisp hairline-bordered cards, a deep botanical teal navigation rail, and high-contrast citron-lime calls to action.
- Emphasize flat, clean data presentation, generous whitespace, and clear typographic hierarchy pairing geometric display headings with monospace metadata eyebrows.

### Color References
- Primary dark anchor: Deep Teal (`#113b3a`)
- Primary action accent: Citron Lime (`#d9e85a`)
- Page canvas: Fern Mist (`#f5f7f5`)
- Card surface: Pure White (`#ffffff`) with Sage Border (`#e1e8e2`)
- AI Assistant highlight: Citron Wash (`#dfe9bc`)

### Component Prompts
- **Landing Page**: Sticky top nav with "P" mark + Pearson wordmark, split hero with live dashboard preview card, 3-column feature cards (WhatsApp AI Ordering, Kitchen Sync, Feedback Intelligence), 3-step workflow, and CTA banner.
- **Login Page**: Split-screen layout (55% Deep Teal brand art panel with grid pattern, headline, and testimonial quote; 45% clean login form with Username, Password, "Explore with Demo Restaurant" CTA, and Google OAuth button).
- **Dashboard**: 252px dark sidebar, 76px topbar with WhatsApp/AI status pills, 4 KPI stat cards, 1.7fr/1fr split with revenue/orders charts and AI assistant card.
- **Feedback & Response**: Clean review submission card with 5-star picker and category chips; owner console with QR share bar, star filter tabs, and inline reply thread.
