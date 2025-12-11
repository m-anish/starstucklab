---
# Project Frontmatter (YAML)
# This metadata block is parsed by Astro and the CLI tool

slug: telescope-loneliness
title: Telescope That Measures Loneliness
category: Electronics
status: completed
tags:
  - arduino
  - sensors
  - art
date: 2024-12-03
updated: 2024-12-03
featured: true
image: /assets/projects/telescope-loneliness/hero.webp
image_alt: A small telescope pointed at the night sky
excerpt: A telescope that doesn't look at stars—it measures the distance between you and everything else.
---

# Telescope That Measures Loneliness

A telescope that doesn't look at stars—it measures the distance between you and everything else.

## Overview

Built during a particularly quiet November. The telescope uses an ultrasonic sensor to measure physical distance, then maps it to an arbitrary "loneliness scale" displayed on a small OLED screen. The further away objects are, the higher the reading. It's useless but oddly honest.

## Components

- Arduino Nano
- HC-SR04 ultrasonic sensor
- 128x64 OLED display (I2C)
- 3D-printed telescope housing
- 9V battery (cosmic indifference not included)

## How It Works

1. Ultrasonic sensor pings the void
2. Distance measurement converted to "loneliness units" 
3. OLED displays reading with slowly drifting starfield animation
4. Every 10 minutes, screen shows: "The universe remains unchanged"

## Build Notes

The hardest part was getting the 3D-printed telescope tube to not look like a crude pipe. Failed twice. Third print came out acceptable after lowering layer height and accepting imperfection as a design philosophy.

Power consumption is surprisingly high—the OLED draws more than expected. Battery lasts about 6 hours. Added a sleep mode that triggers after 2 minutes of no interaction. Wake up by tapping the sensor.

## Code

```cpp
// Excerpt from main loop
distance = getDistance();
loneliness = map(distance, 0, 400, 0, 100);
display.clearDisplay();
display.setCursor(0, 0);
display.print("Loneliness: ");
display.println(loneliness);
display.display();
```

Full code available on [GitHub](https://github.com/yourusername/telescope-loneliness).

## Reflections

It sits on my desk now, occasionally measuring the distance to the wall (about 3 meters, or "moderately lonely"). Sometimes I point it at the window. The reading doesn't change much. The universe, as suspected, remains indifferent.

Would I build it again? Probably not. But I'm glad it exists.

## Images

![Telescope exterior](./telescope-exterior.jpg)
*The finished telescope, mounted on a small tripod.*

![OLED display showing reading](./display-closeup.jpg)
*Display reading: "Loneliness: 72"*

![Internal components](./internals.jpg)
*Arduino and sensor wiring. Cable management is aspirational.*

---

**Tags:** #arduino #sensors #art  
**Status:** completed  
**Last Updated:** December 3, 2024