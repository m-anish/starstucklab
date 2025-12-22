---
images:
  master: /assets/product-lokki/product-lokki-master.png
  variants: shared_variants
  processing:
    priority: medium
    hero_image: true
    gallery_sizes:
      - thumb
      - mobile
      - tablet
  gallery:
    - filename: product-lokki-img-01.webp
      alt: Lokki - Smart lighting controller
      type: photo
      prompt: >-
        Professional product photography of Lokki IoT lighting controller,
        compact electronic device with LED indicators, clean white background,
        well-lit, commercial product shot, high quality
      generated_at: '2025-01-15T11:00:00.000Z'
      order: 1
    - filename: product-lokki-img-01.webp
      alt: Lokki - Image 1
      type: illustration
      prompt: >-
        Generate a professional, clean, and well-lit product shot of an
        electronics item called 'Lokki'. The product is categorized under IoT
        and raspberry-pi. The image should be a digital illustration focusing on
        product visualization, clean design, and a modern aesthetic.
      generated_at: '2025-12-08T17:53:05.820172'
      order: 2
    - filename: product-lokki-img-01.webp
      alt: Lokki - Image 1
      type: photo
      prompt: >-
        Create a high quality, professional-grade product photograph of an item
        named 'Lokki'. This product belongs to the categories IoT, Raspberry-Pi,
        and electronics. The scene should be immaculately clean, with the
        product being well-lit. The background should be a crisp, clean white,
        making the product the star of the image. The focus should be strongly
        on creating an attractive, commercially-oriented product shot that
        highlights Lokki's innovation, elegance, and utility.
      generated_at: '2025-12-08T18:00:53.625885'
      order: 3
    - filename: product-lokki-img-01.webp
      alt: Lokki - Image 1
      type: photo
      prompt: >-
        Generate a professional, clean and well-lit product shot of Lokki, a
        product in the category of IoT, raspberry-pi, and electronics. The image
        should feature a clean white background, highlighting the product's
        details, functionality, and design. The image should look like a
        commercial product shot with high-quality details. The lighting should
        be optimal for a professional high-resolution product photography. The
        focus should be on the product's high-tech features and aesthetics,
        distinctively standing out against a white background.
      generated_at: '2025-12-09T01:47:38.822121'
      order: 4
slug: lokki
title: Lokki
category: Electronics
tagline: 'Lokki: precisely engineered sparks for lives that still feel on standby'
price: 11000
currency: INR
status: unavailable
stock_status: out_of_stock
tags:
  - smart lighting
  - light automation
  - ambient dimmer
  - home illumination control
  - lighting balance system
date: 2025-01-15T00:00:00.000Z
excerpt: >-
  Lokki — A gentle light-keeper spirit that automates, dims, and balances
  illumination.
specifications:
  - label: Dimensions
    value: '92 × 92 × 28 mm (main hub), 55 × 55 × 18 mm (satellite sensor node)'
  - label: Weight
    value: '145 g (main hub), 48 g (satellite sensor node)'
  - label: Materials
    value: >-
      UV-stabilized matte polycarbonate (PC) housing, anodized aluminum heat
      spreader, low-iron diffused glass light guide
  - label: Power Requirements
    value: >-
      100–240 V AC, 50/60 Hz, < 0.5 W standby, 18 W max load control per channel
      (triac dimming), 2-channel output
  - label: Connectivity & Control
    value: >-
      Wi‑Fi 4 (802.11 b/g/n, 2.4 GHz), Bluetooth LE 5.0 for provisioning, IEEE
      802.15.4 radio for sensor mesh, supports DALI-2 and 0–10 V dimming
      interfaces, REST/Local API + MQTT
  - label: Sensing & Automation
    value: >-
      Digital ambient light sensor (1–100,000 lux, ±5% accuracy), PIR motion
      detection (up to 6 m, 120° FOV), time-of-day adaptive dimming profiles,
      configurable circadian brightness/temperature curves
  - label: Operating Conditions
    value: >-
      Operating temperature 0–40 °C, storage −20–60 °C, 10–90% RH
      non-condensing, indoor use only (IP20)
  - label: Safety & Compliance
    value: >-
      Over-voltage, over-current, and thermal protection; flame-retardant
      housing (UL94 V-0); compliant with CE, UKCA, FCC Part 15, RoHS, and REACH
---

# Lokki

A gentle light-keeper spirit that automates, dims, and balances illumination across your spaces.

## Description

Lokki is an intelligent lighting management system designed for homes, offices, and creative spaces. This compact IoT controller wrangles up to eight LED channels, four relay outputs, and multiple motion sensors to create adaptive lighting environments that respond to your needs.

Built around Raspberry Pi technology with LoRa connectivity for mesh networking, Lokki units can coordinate across multiple rooms or even buildings to create cohesive lighting experiences.

## Key Features

### Smart Control

* **8 LED Channels**: Independent control of different lighting zones
* **4 Relay Outputs**: Power control for traditional lighting fixtures
* **Motion Sensing**: PIR and radar sensors for occupancy detection
* **Light Sensing**: Automatic adjustment based on ambient light levels

### Connectivity

* **LoRa Mesh Network**: Reliable communication between Lokki units
* **WiFi/Ethernet**: Internet connectivity for remote control
* **REST API**: Full programmatic control
* **Mobile App**: iOS and Android companion apps

### Intelligence

* **Scene Management**: Save and recall lighting presets
* **Time-based Automation**: Sunrise/sunset simulation, scheduled changes
* **Adaptive Learning**: Learns your preferences over time
* **Energy Optimization**: Reduces power consumption through smart scheduling

## What's Included

* Lokki controller main unit with Raspberry Pi 4
* 8-channel LED driver board
* 4-channel relay board
* PIR motion sensor module
* Ambient light sensor
* LoRa communication module
* Power supply and cabling
* 3D-printed enclosure
* Quick start guide and API documentation

## Specifications

| Component      | Specification                             |
| -------------- | ----------------------------------------- |
| Processor      | Raspberry Pi 4 (4GB RAM)                  |
| LED Channels   | 8 × 350mA constant current                |
| Relay Channels | 4 × 16A 250VAC                            |
| Wireless       | WiFi 802.11ac, Bluetooth 5.0, LoRa 915MHz |
| Connectivity   | Ethernet, USB-C power                     |
| Power Input    | 24V DC, 5A                                |
| Dimensions     | 150 × 100 × 50 mm                         |
| Weight         | 350g                                      |
| Operating Temp | -10°C to 50°C                             |

## Software

### Core Features

* **Web Interface**: Browser-based configuration and control
* **REST API**: Full HTTP API for integration
* **MQTT Support**: Real-time messaging for IoT ecosystems
* **Home Assistant**: Native integration with popular smart home platforms

### Programming

* **Python SDK**: Full Python library for custom automation
* **Node-RED**: Visual programming interface
* **Docker Support**: Containerized deployment options

## Installation

### Hardware Setup

1. Mount the Lokki controller in your desired location
2. Connect LED channels to your lighting fixtures
3. Configure relay outputs for traditional lights
4. Attach motion and light sensors
5. Power on and connect to your network

### Software Configuration

1. Access the web interface at `http://lokki.local`
2. Configure your WiFi network
3. Set up your lighting zones
4. Create initial scenes and schedules
5. Connect additional Lokki units for mesh networking

## Use Cases

### Home Automation

* **Living Room**: Adaptive lighting based on TV content and time of day
* **Kitchen**: Motion-activated task lighting with recipe timers
* **Bedroom**: Sunrise simulation for natural wake-up routines

### Commercial Spaces

* **Offices**: Occupancy-based lighting to reduce energy costs
* **Retail**: Product highlighting with automated displays
* **Museums**: Art installation lighting with programmable sequences

### Creative Applications

* **Photography Studios**: Programmable lighting setups
* **Stage/Theater**: Cued lighting changes for performances
* **Installation Art**: Interactive lighting experiences

## Support

### Documentation

* Complete API reference
* Integration guides for popular platforms
* Video tutorials and setup guides

### Community

* Active forum with user projects
* GitHub repository for custom modifications
* Regular firmware updates and feature additions
