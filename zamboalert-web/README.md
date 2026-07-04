ZamboAlert
An IoT-based emergency communication system for barangay disaster response in Zamboanga City. ZamboAlert uses a LoRa mesh network with a Bluetooth fallback to let citizens send SOS signals and help rescuers locate them, even when cellular networks and power are down.


The Problem
During typhoons, floods, and storm surges, Zamboanga City frequently loses cellular and power service. This leaves trapped citizens unable to call for help and leaves rescuers with no way to locate them.


What It Does
Citizen Mobile App – broadcasts an offline SOS signal via Bluetooth
Rescuer Mobile App – shows nearby distress signals and guides rescuers to victims using GPS and signal strength
Barangay Web Dashboard – lets officials monitor incoming alerts and dispatch rescuers in real time


How It Works
A citizen's phone broadcasts a Bluetooth SOS signal.
A rescuer's wearable device (ESP32 + LoRa) picks up the signal and estimates the victim's location.
The data is relayed across the LoRa mesh, node to node, back to the barangay gateway.
The web dashboard displays the alert in real time, and officials dispatch help.


Tech Stack
App: React Native
Backend: Node.js, Express
Database: SQLite (mobile), PostgreSQL (gateway)
Hardware: ESP32, LoRa SX1278 (433MHz), NEO-6M GPS Module


Capstone Project, College of Computing Studies, Western Mindanao State University
