---
title: Nimby
category: Weather
status: ongoing
tags:
- weather-station
- lora
- remote-sensing
date: '2025-12-03'
updated: '2025-12-03'
featured: false
image: /assets/projects/nimby/hero.webp
image_alt: Nimby hero image
excerpt: A wandering climate-gnome muttering forecasts into the void.
---

# Nimby

A wandering climate-gnome muttering forecasts into the void.

## Overview

Nimby is a small, stubborn weather station that listens to the sky from the edge of wherever it has been bolted down. It exists to quietly collect wind, rain, and temperature, then whisper the data home over LoRa, because the clouds refuse to fill out spreadsheets.

## Components

- Custom PCB with low-power microcontroller (ARM Cortex-M0) and LoRa transceiver module (SX127x series)
- Weather sensor suite: combined temperature/humidity sensor, barometric pressure sensor, and tipping-bucket rain gauge
- 3D-printed radiation shield and sensor mast, built from sun-faded PLA and stainless screws that already regret their life choices
- 12V solar panel with charge controller feeding a small LiFePO4 battery, sized optimistically and tested pessimistically
- Outdoor enclosure with cable glands, improvised gaskets, and more silicone sealant than any sane datasheet would recommend

## How It Works

1. Sensors sample local conditions on a fixed schedule, reading temperature, humidity, pressure, rainfall counts, and any other begrudgingly wired inputs.
2. The microcontroller aggregates these readings, applies modest filtering and calibration offsets, then packs them into a compact LoRa payload that cares more about bytes than elegance.
3. The LoRa module transmits the packet to a distant gateway, which pretends to be important by relaying it to a server that timestamps, stores, and occasionally graphs the numbers for human curiosity.
4. A low-power routine manages sleep cycles, battery voltage checks, and solar charging, trying to keep the station alive through cloudy weeks while pretending entropy is just a configuration parameter.

## Build Notes

Nimby started as a clean schematic and quickly became a nest of compromises soldered into place. The first PCB underestimated noise from the rain gauge and overestimated the patience of pull-up resistors in long, wet cables. LoRa range tests were done optimistically from a window, then redone more honestly in drizzle, revealing that trees have strong opinions about 868 MHz. The radiation shield warped in the sun, teaching that PLA believes in heat death on a very local scale. Moisture crept into connectors that were supposedly IP-rated, proving that water reads spec sheets as a challenge. Each revision shaved off a failure: better grounding, real surge protection, more aggressive conformal coating, and firmware that assumes every sensor will lie at least once a day. The result is not elegant, but it wakes, measures, complains in packets, and goes back to sleep, which is more than some projects ever achieve.

## Code

```python
# Code snippets if relevant
```

## Reflections

Nimby works just well enough to justify its own existence, which is all most devices or people can reasonably claim. It would be built again, but with fewer assumptions, more gaskets, and the same quiet acceptance that the weather does not care who is listening.

## Images

<!-- ![Alt text](./image-name.jpg) -->
*Caption*

---

**Tags:** #weather-station, #lora, #remote-sensing  
**Status:** ongoing  
**Last Updated:** 2025-12-03
