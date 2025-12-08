---
slug: lokki
title: Lokki
price: 11000
currency: INR
status: coming_soon
tags:
- iot
- raspberry-pi
- electronics
date: 2025-01-15
excerpt: Lokki — A gentle light-keeper spirit that automates, dims, and balances illumination.
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
    prompt: Professional product photography of Lokki IoT lighting controller, compact
      electronic device with LED indicators, clean white background, well-lit, commercial
      product shot, high quality
    generated_at: 2025-01-15 11:00:00+00:00
    order: 1
---

# Lokki

A gentle light-keeper spirit that automates, dims, and balances illumination across your spaces.

## Description

Lokki is an intelligent lighting management system designed for homes, offices, and creative spaces. This compact IoT controller wrangles up to eight LED channels, four relay outputs, and multiple motion sensors to create adaptive lighting environments that respond to your needs.

Built around Raspberry Pi technology with LoRa connectivity for mesh networking, Lokki units can coordinate across multiple rooms or even buildings to create cohesive lighting experiences.

## Key Features

### Smart Control
- **8 LED Channels**: Independent control of different lighting zones
- **4 Relay Outputs**: Power control for traditional lighting fixtures
- **Motion Sensing**: PIR and radar sensors for occupancy detection
- **Light Sensing**: Automatic adjustment based on ambient light levels

### Connectivity
- **LoRa Mesh Network**: Reliable communication between Lokki units
- **WiFi/Ethernet**: Internet connectivity for remote control
- **REST API**: Full programmatic control
- **Mobile App**: iOS and Android companion apps

### Intelligence
- **Scene Management**: Save and recall lighting presets
- **Time-based Automation**: Sunrise/sunset simulation, scheduled changes
- **Adaptive Learning**: Learns your preferences over time
- **Energy Optimization**: Reduces power consumption through smart scheduling

## What's Included

- Lokki controller main unit with Raspberry Pi 4
- 8-channel LED driver board
- 4-channel relay board
- PIR motion sensor module
- Ambient light sensor
- LoRa communication module
- Power supply and cabling
- 3D-printed enclosure
- Quick start guide and API documentation

## Specifications

| Component | Specification |
|-----------|---------------|
| Processor | Raspberry Pi 4 (4GB RAM) |
| LED Channels | 8 × 350mA constant current |
| Relay Channels | 4 × 16A 250VAC |
| Wireless | WiFi 802.11ac, Bluetooth 5.0, LoRa 915MHz |
| Connectivity | Ethernet, USB-C power |
| Power Input | 24V DC, 5A |
| Dimensions | 150 × 100 × 50 mm |
| Weight | 350g |
| Operating Temp | -10°C to 50°C |

## Software

### Core Features
- **Web Interface**: Browser-based configuration and control
- **REST API**: Full HTTP API for integration
- **MQTT Support**: Real-time messaging for IoT ecosystems
- **Home Assistant**: Native integration with popular smart home platforms

### Programming
- **Python SDK**: Full Python library for custom automation
- **Node-RED**: Visual programming interface
- **Docker Support**: Containerized deployment options

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
- **Living Room**: Adaptive lighting based on TV content and time of day
- **Kitchen**: Motion-activated task lighting with recipe timers
- **Bedroom**: Sunrise simulation for natural wake-up routines

### Commercial Spaces
- **Offices**: Occupancy-based lighting to reduce energy costs
- **Retail**: Product highlighting with automated displays
- **Museums**: Art installation lighting with programmable sequences

### Creative Applications
- **Photography Studios**: Programmable lighting setups
- **Stage/Theater**: Cued lighting changes for performances
- **Installation Art**: Interactive lighting experiences

## Support

### Documentation
- Complete API reference
- Integration guides for popular platforms
- Video tutorials and setup guides

### Community
- Active forum with user projects
- GitHub repository for custom modifications
- Regular firmware updates and feature additions