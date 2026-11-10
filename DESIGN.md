# Design System: #drones

## Overview

**Creative North Star: "The working drawing"**

The page reads like the team's own engineering notebook: paper, ink, hairlines and Courier annotations. The hollow #drones masthead sets the line weight, and everything after it is drawn in the same hand. The aircraft is a live technical drawing, not a photo. A small drone flies a dashed route through the white space, so the margins are part of the design, not leftovers.

## Colors

- **Paper** `#f7fbff`: the page.
- **Ink** `#102542`: type, every line, every drawing edge.
- **Columbia Blue** `#b9d9eb`: the only fill colour. It means *designed in-house* on the aircraft and the active subsystem, and fills prop discs and hover states.
- **Accent** `#6baed6`: link hover and the "now" pulse only.
- Rules are ink at 24% opacity. Secondary text is ink at 62% opacity.

## Typography

- **Sans** (Arial/Helvetica), weight 500, tracking −0.055 to −0.065em: all headings.
- **Serif italic** (Georgia): the turn in each headline ("*You can't buy the understanding.*").
- **Mono** (Courier New), 10–11px, uppercase: labels, specs, callouts, the receipt.
- **Masthead:** 700 weight, outlined, 27vw.

## Layout

- Each section opens with a mono label row over a hairline: `0N / NAME` on the left, context on the right.
- Content alternates sides, leaving a 25% lane for the flight path (`.lane-right` / `.lane-left`).
- Below 900 px the lanes collapse and the path is hidden.

## Components

- **Technical drawing** (drone.js `Drawing`): faces filled with paper and shaded slightly by a top light, edges in 1px ink, hidden lines removed by painter's sort. The active part is filled blue and the rest drop to 34% ink. Callouts use a leader line, a dot at the anchor, and a bold mono title over a mono sub-line.
- **Waypoint / pad:** a diamond for a waypoint, a 60px circled H for a landing pad.
- **Step card:** an ink top rule, a counter and a tag (blue = in-house), a large title and a spec table.
- **Bus diagram:** a 2px ink bus with solder dots and hanging nodes. Nodes fill blue on hover.
- **Receipt:** a white slip in Courier with dotted leaders, rotated 2°, with a torn edge. It straightens on hover.

## Do's and Don'ts

- **Do** draw things rather than describe them, and use the team's real parts, numbers and dates.
- **Do** keep blue meaningful: in-house, active, live.
- **Don't** add a second hue, drop shadows other than the receipt's, or photos without permission.
- **Don't** take over scrolling.
