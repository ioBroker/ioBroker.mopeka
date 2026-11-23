<img src="admin/mopeka.png" width="100" />

# ioBroker.mopeka

Reads **Mopeka** BLE tank-level sensors (Pro Check, Pro Plus, Pro Check H2O, TD40/TD200, Universal …) into ioBroker. Mopeka sensors broadcast their readings passively in the BLE advertisement, so no connection is needed.

## BLE source — direct or via ble-gateway

The adapter can obtain the advertisements two ways, selectable on the **Main settings** tab:

- **Direct** — the adapter opens its own Bluetooth (HCI) controller, chosen by MAC address.
- **Via ble-gateway** — the adapter subscribes to the central [`ble-gateway`](https://github.com/ioBroker/ioBroker.ble-gateway) adapter, which owns the controller and shares advertisements. Pick the gateway instance from the dropdown. Use this when several BLE adapters must share one controller.

## Configuration & scan

1. **Main settings**: choose the source and either the Bluetooth controller (direct) or the gateway instance, plus the scan duration. **Save**.
2. **Sensors** tab: press **Scan for Mopeka sensors**. Nearby Mopeka sensors are detected and added to the table (saved into the configuration). For each sensor set:
   - **Medium** — Propane/LPG, Air/fuel/oil, or Water (used for temperature compensation of the level).
   - **Tank height (mm)** — optional; when set, a fill percentage (`level_pct`) is computed.

## Device manager

The sensors are also listed in the device manager (tab **Devices** of admin, the devices adapter): one card per sensor with the gas bottle, connection, battery, signal strength, fill level, temperature and reading quality. From there you can

- **scan** for new sensors and add them with name and medium,
- **edit** name, medium, tank height and whether a sensor is enabled,
- **delete** a sensor.

Every change is saved in the instance configuration; the adapter restarts afterwards. **More** shows all values of a sensor.

## States

Per sensor, under `mopeka.<instance>.sensors.<name|mac>`:

| State                 | Type    | Unit | Description                                    |
|-----------------------|---------|------|------------------------------------------------|
| `level_mm`            | number  | mm   | Liquid column height (temperature-compensated) |
| `level_pct`           | number  | %    | Fill level (only if tank height set)           |
| `temperature`         | number  | °C   | Sensor temperature                             |
| `battery_v`           | number  | V    | Battery voltage                                |
| `battery_pct`         | number  | %    | Battery level                                  |
| `quality`             | number  |      | Reading quality 0–3                            |
| `quality_pct`         | number  | %    | Reading quality as percent                     |
| `button`              | boolean |      | Sync button pressed                            |
| `rssi`                | number  | dBm  | Signal strength                                |
| `accel_x` / `accel_y` | number  |      | Accelerometer raw values                       |
| `model`               | string  |      | Detected sensor model                          |
| `lastUpdate`          | number  |      | Timestamp of last advertisement                |
| `reachable`           | boolean |      | False after 5 min without a packet             |

`info.connection` is true while the BLE source is active. In gateway mode it is true once the gateway confirmed the subscription and false while the gateway is stopped.

## Gas bottle widget

The adapter brings the web component `<iob-mopeka-tank>` (`admin/webcomponents/mopeka-tank.json`, listed in `common.webComponents`): each sensor as a gas bottle with its fill level, temperature, battery and reading quality. vis-2, devices and Aura offer it in their widget palettes without any further setup; the tab **Overview** of the instance configuration shows all saved sensors with it (needs admin 8.3.10 or newer).

Settings of the widget:

- **Sensor** — one sensor device below `mopeka.X.sensors`. Empty: all configured sensors of the **Instance**.
- **Show name**, **Show temperature, battery and quality**.
- **Warning below (%)** — the liquid turns yellow below this fill level and red below half of it (default 20 %).

Without a tank height the bottle shows the level in mm. The sources are in `src-webcomponents/` (plain TypeScript, no framework); `npm run build:webcomponents` builds them into `admin/webcomponents/`, which is committed.

## Requirements

- For **direct** mode: Linux with BlueZ (`apt install bluez libbluetooth-dev`) or macOS, and access to the HCI socket (typically root or `setcap`).
- For **gateway** mode: a running `ble-gateway` instance; this adapter then needs no local BLE access.
- Node.js ≥ 20.

## Changelog
<!--
   Placeholder for the next version (at the beginning of the line):
   ### **WORK IN PROGRESS**
-->
### **WORK IN PROGRESS**
* (@GermanBluefox) Added the device manager: scan, edit, enable/disable and delete sensors
* (@GermanBluefox) Added the gas bottle widget `<iob-mopeka-tank>` for vis-2, devices, Aura and the admin tab "Overview"
* (@GermanBluefox) Gateway mode: subscribes again after a restart of ble-gateway
* (@GermanBluefox) Initial version — Mopeka sensors via direct BLE or ble-gateway, with discovery scan and per-sensor tank calibration.

## License

MIT License

Copyright (c) 2026 bluefox <dogafox@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
