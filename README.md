# #drones — Columbia University Robotics Club

Open index.html with styles.css, drone.js, script.js and assets/ alongside it. There's no build step, framework, tracking or downloaded font. Type is Arial/Helvetica, Georgia italic and Courier New, all already on visitors' machines.

## Page

1. **Masthead.** The rotor lockup, the CURC logo and the hollow #drones wordmark, unchanged from the pushed site.
2. **FIG. 01.** Airframe 01 drawn live as a technical drawing in drone.js: a 3D model built in millimetres from the real parts (5-inch props, Velox V2207 motors, 30.5 mm stack, ESP32-S3, nRF24 radio, 6S pack). Props spin, it hovers, and it drifts toward the cursor. Leader-line callouts name the parts.
3. **The flight path** (script.js). A small drone flies a dashed route through the empty lanes beside each section as you scroll, landing on helipads. Waypoints are the `.wp` elements in index.html, placed in CSS, so moving the route is a CSS change. Hidden below 900 px.
4. **01 The idea.** Why drones: the six disciplines.
5. **02 The aircraft.** Sticky exploded drawing. Each step card pulls one subsystem out and colours it blue if it's designed in-house.
6. **03 The team.** Six workstreams hanging off a weekly integration bus, with leads.
7. **04 Flight log.** A flight-profile chart of the timeline, plus the first parts order as a receipt.
8. **05 Get involved.** Fridays 3–5 PM in the Makerspace, Slack and email. Small drones cross the footer.

## Keeping it current

- Timeline: the `.profile` SVG in index.html. Move the `pt now` marker and the end of the solid `flown` path as milestones land.
- Spend: the receipt list and total in index.html.
- Part status: the `NOW` rows in each aircraft step card.
- Leads: the `.nodes` list.

Scrolling is the browser's own; nothing takes it over. With reduced motion, the drawings render as still frames, the path drone jumps to its position, and nothing animates.
