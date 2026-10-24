---
name: Dev Utils
description: A local developer workbench in Dracula and warm paper.
colors:
  accent: "#bd93f9"
  accent-ink: "#282a36"
  accent-light: "#6d49b2"
  paper: "#f8f8f2"
  night: "#282a36"
  surface-night: "#21222c"
  raised-night: "#343746"
  line-night: "#44475a"
  text-night: "#f8f8f2"
  muted-night: "#b3bce0"
  surface-light: "#ffffff"
  raised-light: "#efeee4"
  line-light: "#d9d8cc"
  text-light: "#282a36"
  muted-light: "#5c6794"
  ok: "#50fa7b"
  err: "#ff5555"
  warn: "#f1fa8c"
  selection: "#44475a"
typography:
  title:
    fontFamily: "IBM Plex Sans, ui-sans-serif, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
  section:
    fontFamily: "IBM Plex Sans, ui-sans-serif, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "IBM Plex Sans, ui-sans-serif, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "normal"
  code:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  reading:
    fontFamily: "IBM Plex Sans, ui-sans-serif, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  reading-h1:
    fontFamily: "IBM Plex Sans, ui-sans-serif, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  reading-h2:
    fontFamily: "IBM Plex Sans, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  reading-h3:
    fontFamily: "IBM Plex Sans, ui-sans-serif, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
rounded:
  control: "6px"
  card: "12px"
  code: "4px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  button-ghost:
    backgroundColor: "{colors.surface-night}"
    textColor: "{colors.text-night}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  button-danger:
    backgroundColor: "{colors.surface-night}"
    textColor: "{colors.err}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  input:
    backgroundColor: "{colors.surface-night}"
    textColor: "{colors.text-night}"
    rounded: "{rounded.control}"
    padding: "0 8px"
    height: "32px"
  card:
    backgroundColor: "{colors.surface-night}"
    textColor: "{colors.text-night}"
    rounded: "{rounded.card}"
    padding: "16px"
---

# Design System: Dev Utils

## Overview

**Creative North Star: "The night workbench"**

Dev Utils is a bench you keep open beside the request you are already handling. Dracula is the dark bench: night background, lavender accent, and syntax colors that match the editors people already know. Light mode is the same bench on warm paper, with the accent darkened so it still reads.

Density stays comfortable. Chrome is a rail and a short header. The work surface is the editor, the table, or the preview. Color marks the current tool, the primary action, and status. It does not decorate.

**Key Characteristics:**

- Dracula at night, warm paper in the light.
- One accent, used for the current tool and the primary button.
- Tonal steps instead of shadows, except the tool switcher.
- IBM Plex Sans for the interface, IBM Plex Mono for code, fields, and shortcuts.
- Status colors stay green, red, and yellow, and the words say what happened.

## Colors

The dark palette is Dracula. The light palette keeps those hues and raises contrast on paper.

### Primary

- **Dracula purple** (#bd93f9): Primary buttons, the current tool, focus, links, and the caret in the dark theme. Button text on this fill is night ink.
- **Workbench purple** (#6d49b2): The same role in the light theme, where the Dracula purple would fail on paper.

### Neutral

- **Night** (#282a36): Page background in Dracula.
- **Inset night** (#21222c): Header, rail, cards, and editor surface.
- **Raised night** (#343746): Hover, active row, and shortcut chips.
- **Line night** (#44475a): Borders and the text selection.
- **Foreground** (#f8f8f2): Primary text in Dracula, and the light page background.
- **Comment lavender** (#b3bce0): Secondary text in Dracula. The original comment purple is too dim for interface text.
- **Paper white** (#ffffff): Cards and chrome in the light theme.
- **Warm raised** (#efeee4): Hover and chips on paper.
- **Warm line** (#d9d8cc): Borders on paper.
- **Night ink** (#282a36): Primary text in the light theme.
- **Ink lavender** (#5c6794): Secondary text on paper.

### Status

- **Ok** (#50fa7b): Success in Dracula. Light mode uses a darker green, #1c7a3a.
- **Error** (#ff5555): Failures in Dracula. Light mode uses #c22525.
- **Warn** (#f1fa8c): Warnings in Dracula. Light mode uses #8a6400.

**The One Accent Rule.** Purple marks the current tool, the primary action, focus, and the caret. Status colors are the only other chromatic roles.

## Typography

**Body font:** IBM Plex Sans (with ui-sans-serif)
**Mono font:** IBM Plex Mono (with ui-monospace)

**Character:** The interface is a compact workbench sans. Mono is reserved for code, values, and shortcuts.

### Hierarchy

- **Headline** (600, 1.125rem, 1.3): The launcher heading.
- **Title** (600, 1.5rem, 1, tracking -0.02em): Tool name in the header.
- **Section** (600, 1.125rem, 1.3, tracking -0.02em): Groups inside a tool, such as Query and Headers.
- **Body** (400, 0.875rem, 1.5): Descriptions, banners, and controls.
- **Reading** (400, 15px, 1.6): Markdown preview. Headings there are 1.6rem, 1.25rem, and 1.05rem.
- **Code** (400, 13px, mono): Editors and preformatted output.
- **Label** (400, 0.6875rem, mono): Shortcuts and field values.

**The Mono Rule.** Monospace is for code, data, and keystrokes. It is not a costume for labels.

## Layout

The app is a full viewport. A 14rem rail sits on the left from the md breakpoint up. Below that, Tools opens the same rail as a drawer. The header is 48px. The launcher content is a grid inside a 64rem measure, with 24px between cards.

Spacing rhythm is 8, 12, 16, and 24px. Below the sm breakpoint, Export, Clear, and the theme control leave the header and stack in the drawer so the title stays visible.

## Elevation & Depth

Depth is tonal. The page is night or paper. Chrome and cards step to a different surface. Borders separate them. Cards do not float.

### Shadow Vocabulary

- **Switcher** (`box-shadow: 0 18px 50px -24px rgba(0,0,0,0.45)`): Only the tool switcher, because it covers the page.

**The Flat Surface Rule.** A resting card has a border and no shadow.

## Shapes

Controls are gently rounded (6px) and 32px tall. Cards and the switcher use a larger corner (12px). Inline code is tighter (4px). Focus is a 2px accent outline, offset 2px, on buttons, links, fields, and the split handle.

## Components

### Buttons

- **Shape:** 6px corners, 32px tall, 10px horizontal padding.
- **Primary:** Dracula purple fill with night ink. In light mode, workbench purple with paper text.
- **Ghost:** Surface fill, line border, raised surface on hover.
- **Danger:** Same shape as ghost, error-colored label. The word says the action.
- **Focus:** Accent outline. Disabled controls fade to half opacity.

### Cards

- **Corner style:** 12px.
- **Background:** Inset night, or white on paper.
- **Shadow strategy:** None. See Elevation.
- **Border:** 1px line. Hover uses the accent border.
- **Internal padding:** 16px.

### Inputs

- **Style:** 32px, 6px corners, surface fill, line border, mono text.
- **Focus:** Accent outline. The caret is the accent.
- **Error:** The banner above the work uses the error color and a sentence. The field itself does not grow a second chrome.

### Navigation

- **Style:** A vertical list. The current tool uses the raised surface and the accent color, with `aria-current`.
- **Shortcuts:** Small mono chips on the raised surface.
- **Mobile:** The rail is hidden. Tools opens it. Export, Clear, and theme stack at the bottom of that drawer.

## Do's and Don'ts

### Do:

- **Do** use Dracula purple for one job at a time: current tool, primary action, focus, or caret.
- **Do** keep secondary text on the lifted lavenders, not the dim comment purple.
- **Do** separate surfaces with tone and a 1px line.

### Don't:

- **Don't** add a drop shadow to a resting card.
- **Don't** use a border thicker than 1px as a stripe on a card, row, or banner.
- **Don't** put monospace on ordinary labels.
- **Don't** invent a second accent hue.
