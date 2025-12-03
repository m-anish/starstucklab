---
title: Weather Station
category: Weather
status: ongoing
tags:
- LoRa
- sensors
- weather
- arduino
- internet
date: '2025-12-03'
updated: '2025-12-03'
featured: false
image: /assets/projects/weather-station/hero.webp
image_alt: Weather Station hero image
excerpt: A weather station for providing unhelpful information of the past and present
  time domains
---

# Weather Station

A weather station for providing unhelpful information of the past and present time domains

## Overview

A small weather station sits at the edge of the workshop’s attention, quietly measuring the sky so the internet can forget it in real time. It exists because curiosity kept asking what the air was doing, and because buying a commercial unit felt like admitting defeat.

## Components

- Arduino-compatible microcontroller board with enough pins and not quite enough patience
- LoRa transceiver module with wire whip antenna pretending to be a radio tower
- Combined temperature, humidity, and pressure sensor on a fragile little breakout board
- Rain and wind sensors scavenged from a cheap consumer station that died more honestly
- 12V-to-5V power system cobbled from a solar panel, charge controller, and a battery that distrusts winter

## How It Works

1. Sensors measure temperature, humidity, pressure, rainfall, and wind at fixed intervals, converting the weather’s indifference into voltage levels and digital values.
2. The microcontroller collects these readings, applies modest filtering to hide the sensor’s bad moods, and packs them into a compact payload.
3. The LoRa module sends this payload into the air at low power, where it drifts toward a distant gateway that is only slightly more reliable than the weather itself.
4. A server receives the data, timestamps it, stores it in a database, and renders small, polite graphs so the changing sky can be scrolled past between emails.

## Build Notes

The first enclosure leaked, but only during actual rain, which was inconveniently the only time it mattered. Early sensor readings drifted like a bored compass until pull-up resistors were added and cables were shortened to something less like an antenna farm. LoRa range tests revealed that trees, walls, and the concept of geometry all disagreed with the optimistic datasheet, so antenna placement became a slow ritual of moving brackets by hand-widths. Power management turned into a seasonal negotiation: solar that overcharged in summer and sulked in winter until code, cutoff thresholds, and wiring were all revised with the quiet stubbornness usually reserved for fixing a chair that keeps wobbling the same way. Nothing failed catastrophically, it all just failed a little, repeatedly, until the station’s output graph started to look less like noise and more like a tired but consistent heartbeat.

## Code

```python
# Code snippets if relevant
```

## Reflections

It works well enough to be ignored most of the time, which is about as successful as a weather station needs to be. It would be built again, though perhaps with fewer connectors, fewer assumptions, and the same resigned expectation that the sky will never be impressed.

## Images

<!-- ![Alt text](./image-name.jpg) -->
*Caption*

---

**Tags:** #LoRa, #sensors, #weather, #arduino, #internet  
**Status:** ongoing  
**Last Updated:** 2025-12-03
