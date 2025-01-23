---
date: 2025-01-09
title: "Upscaled Washington DC Metro System Map PCB"
tags: ['PCB', 'WiFi', 'Artwork']
showToc: false
TocOpen: false
draft: false
hidemeta: false
comments: false
disableShare: true
disableHLJS: false
hideSummary: false
searchHidden: true
ShowReadingTime: false
ShowBreadCrumbs: false
ShowWordCount: false
UseHugoToc: true
---

Project page for the upscaled 1.5X DC Metro PCB.

The original starting point for this project is the DC Transistor project by Logan Arkema: https://dctransistor.com/

I took this original design and scaled it up by 1.5X. The original dimensions of the 12 inches by 12 inches, but I increased that to 18 inches by 18 inches and sized up all of the artwork to match this. 

I also took the "Bidirectional" version of the DC Transistor project, which used two sets of smaller RGB LEDs to represent the trains' directions at each station, and sized those LEDs up to the larger 5050 LEDs to fit the larger space available on the board. The layout around the ESP12 controller was reworked to accommodate for the larger board size, and an inrush limiting circuit was added so that some larger capacitors could be used on the 5V line that powers all 270 of the LEDs.


