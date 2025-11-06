# The Sarcasm / Happiness Slider

> “Because emotions are best left to machines.”

## Concept

A frontend UI element that lets users adjust the website’s tone:
- **Far left:** “Utterly Hopeless”  
- **Far right:** “Mildly Optimistic”

Everything in between controls how the text, tooltips, and even background color behave.

---

## Implementation Notes

- Use a simple `<input type="range">`
- Range: 0 → 100
- Labels:
  - 0 → "Utterly Hopeless"
  - 25 → "Skeptically Aware"
  - 50 → "Mildly Concerned"
  - 75 → "Almost Cheerful"
  - 100 → "Mildly Optimistic"

---

## Behavioral Effects

| Mood Level | Description | Example Text |
|-------------|--------------|---------------|
| 0–20 | Nihilistic | “Welcome. Nothing matters, but here we are.” |
| 21–40 | Dry Sarcasm | “Please pretend to be impressed.” |
| 41–60 | Balanced Irony | “Science is fun, when it works.” |
| 61–80 | Slightly Cheerful | “Hey, that’s almost aligned!” |
| 81–100 | Unsettlingly Positive | “The future is bright. Probably.” |

---

## Possible Aesthetic Adjustments

- **Background brightness** subtly shifts with mood.
- **Font weight** increases with optimism (thick = confidence).
- **Animations** slow down in hopeless mode.
- **Easter Egg:** At full optimism, a hidden tooltip appears:
  > “You’re lying to yourself, but I respect the effort.”

---

## Persistence

Store the slider’s value in `localStorage`, so the mood persists per visitor.  
Because everyone deserves a consistent emotional tone across sessions.

---

## Optional Madness

Add an **“Auto Mode”** toggle that changes mood dynamically based on:
- Time of day (night = more hopeless)
- Weather API (rain = sarcastic, clear skies = smug)
- Site uptime (downtime = despair)

> “It’s not mood lighting. It’s mood coding.”
