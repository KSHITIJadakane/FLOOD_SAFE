# FloodSafe IoT — In-Situ Hydrometric Hardware Station
**Wokwi Cyber-Physical Simulation & Embedded Firmware**

---

## 1. Executive Summary & Hardware Role

While Copernicus Sentinel-1 SAR radar satellites provide macro-scale flood inundation footprints, satellites suffer from **orbital revisit latency** (revisit passes occur every 6–12 days) and cannot resolve centimeter-scale water accumulation beneath urban canopies or in deep drainage culverts.

To guarantee **ground reality**, FloodSafe deploys **in-situ IoT hydrometric telemetry stations** at municipal ward hubs and low-lying culverts. This simulated hardware station measures physical floodwater levels, compares them to overtopping thresholds, displays live operational telemetry on an I2C OLED display, and transmits JSON telemetry frames to FloodSafe's REST API.

---

## 2. Hardware Architecture & Components

| Component | Part Model | Function & Interface |
| :--- | :--- | :--- |
| **Microcontroller** | **ESP32 DevKit-C v4** (Tensilica Dual-Core 240MHz) | Wi-Fi telemetry transmission, real-time threshold computation, I2C driver |
| **Water Level Sensor** | **HC-SR04 Ultrasonic Sensor** | Non-contact water surface distance measurement ($2\text{cm} - 400\text{cm}$) |
| **Local Status HUD** | **SSD1306 0.96" OLED Display (128x64)** | High-contrast I2C display showing water level, graphical bar gauge, status badge |
| **Visual Indicators** | **3x 5mm LEDs (Green, Yellow, Red)** | Visual status: Green (`NORMAL`), Amber (`ALERT`), Red (`FLOODED`) |
| **Acoustic Alarm** | **Active Piezo Buzzer** | High-decibel pulsed alarm upon reaching overtopping mark ($\ge 0.80\text{m}$) |

---

## 3. Circuit Pinout & Wiring Map

| Device Pin | ESP32 Pin | Function / Protocol | Wire Color |
| :--- | :--- | :--- | :--- |
| **HC-SR04 VCC** | `5V` | 5V Power Supply | Red |
| **HC-SR04 GND** | `GND` | Ground | Black |
| **HC-SR04 TRIG** | `GPIO 5` | Ultrasonic trigger pulse ($10\mu\text{s}$) | Blue |
| **HC-SR04 ECHO** | `GPIO 18` | Echo return time capture | Cyan |
| **SSD1306 VCC** | `3V3` | 3.3V Logic & Power | Red |
| **SSD1306 GND** | `GND` | Ground | Black |
| **SSD1306 SDA** | `GPIO 21` | I2C Data | Green |
| **SSD1306 SCL** | `GPIO 22` | I2C Clock | Yellow |
| **Green LED (A)** | `GPIO 2` | Normal Status ($\text{Level} < 0.35\text{m}$) via $220\Omega$ | Green |
| **Amber LED (A)** | `GPIO 4` | Alert Status ($0.35\text{m} \le \text{Level} < 0.80\text{m}$) via $220\Omega$ | Orange |
| **Red LED (A)** | `GPIO 15` | Flooded Overtopping ($\text{Level} \ge 0.80\text{m}$) via $220\Omega$ | Red |
| **Buzzer (+)** | `GPIO 13` | Acoustic Overtopping Alarm | Purple |

---

## 4. How to Run the Wokwi Simulation

### Option A: 1-Click Live Online Project (Recommended for Judges)
* **Direct Project URL**: 👉 **[https://wokwi.com/projects/477569569661872129](https://wokwi.com/projects/477569569661872129)**
1. Click the link above to open the pre-configured project directly in your browser.
2. Click **▶ Start Simulation** (Green Play button).
6. **Interact with the Sensor**:
   - Click the **HC-SR04 ultrasonic sensor** in the interactive canvas.
   - Adjust the **Distance Slider** to simulate rising flood waters:
     - **Distance $> 165\text{cm}$**: Water depth $< 0.35\text{m}$ $\rightarrow$ **Green LED ON**, OLED reads `[NORMAL]`.
     - **Distance $120\text{cm} - 165\text{cm}$**: Water depth $0.35\text{m} - 0.80\text{m}$ $\rightarrow$ **Amber LED ON**, OLED reads `[ALERT]`.
     - **Distance $< 120\text{cm}$**: Water depth $\ge 0.80\text{m}$ $\rightarrow$ **Red LED ON**, **Buzzer Beeps**, OLED flashes `*** FLOOD OVERTOPPING ***`.

### Option B: Local VS Code with Wokwi Extension
1. Install the official **Wokwi Simulator** extension from the VS Code Marketplace.
2. Open the `hardware/wokwi` directory in VS Code.
3. Press `F1` and execute: `Wokwi: Start Simulator`.

---

## 5. Telemetry Schema & Backend Integration

The firmware formats standardized JSON telemetry frames transmitted via HTTP `PATCH` to FloodSafe's backend (`/api/v1/iot-sensors/{node_id}/telemetry`):

```json
{
  "station_id": "IOT-SENS-03",
  "ward_id": "Ward-2-CentralBasin",
  "current_water_level_m": 1.28,
  "flood_threshold_m": 0.80,
  "rate_of_rise_m_per_hr": 0.45,
  "status": "flooded",
  "battery_pct": 96,
  "is_synthetic": true
}
```

### Multi-Source Risk Fusion in FloodSafe:
When received by the backend, FloodSafe fuses this in-situ telemetry directly with Sentinel-1 SAR satellite microwave reflectance:
$$\text{flood\_exposure}_{\text{fused}} = 0.55 \cdot \text{SAR}_{\text{norm}} + 0.45 \cdot \min\left(\frac{h_{\text{IoT}}}{h_{\text{threshold}}}, 1.0\right)$$

If an IoT node is offline or missing, FloodSafe applies **neutral imputation ($0.50$)** with an explicit quality confidence penalty, strictly upholding the **"No Silent Zeroes"** non-negotiable rule.
