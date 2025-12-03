---
title: Sirious
category: Telescope
status: experimental
tags:
- digital finderscope
- imu
- astronomy
- accessory
date: '2025-12-03'
updated: '2025-12-03'
featured: true
image: /assets/projects/sirious/hero.webp
image_alt: Sirious the grumpy finderscope
excerpt: "Sirious: a pompous finderscope daemon that guides you to the stars — and judges your aim."
---

# Sirious

**Sirious** is a grumpy alignment daemon embedded in a digital finderscope. He fuses IMU data, a small display, and a cranky personality to help you point telescopes at celestial objects with minimal human embarrassment.

## Overview
Sirious provides:
- live alignment guidance using IMU/compass fusion,
- short, characterful microcopy for UX,
- context-aware hints and error messages,
- a small on-screen HUD for quick pointing.

He is intentionally opinionated.

## Persona
> *“Booting. Try not to embarrass the sky.”*

Sirious is pompous, precise, and mildly aristocratic. He was created after a firmware experiment that accidentally mixed star catalogs with Victorian etiquette.

## Components
- IMU (MPU-6xxx or similar)
- Microcontroller (e.g., AVR / RP2040)
- Small color display (1.3"–2.4")
- Power: 5V (USB) or small LiPo
- Optional: Bluetooth / serial config

## How it works
1. Calibrate IMU.
2. Attach to telescope OTA or finderscope mount.
3. Boot Sirious and enter the target (or pick from catalog).
4. Follow on-screen nudges until the target is acquired.

## Personality lines (examples)
- Boot: “Sirious online. Please present me with an acceptable target.”
- Off-target: “Two degrees north. Not ideal, but manageable.”
- Error: “No bright object found. Either it’s cloudy or you’re uniquely unlucky.”

## Build notes
[Notes about mechanics, mounting, calibration routines, and tradeoffs]

## Images
<!-- ![Sirious HUD mock](./sirious-hud.png) -->
*Sirious: quietly judging your azimuth.*

---

**Tags:** #digital finderscope, #imu, #astronomy, #accessory  
**Status:** prototype  
**Last Updated:** 2025-12-03
