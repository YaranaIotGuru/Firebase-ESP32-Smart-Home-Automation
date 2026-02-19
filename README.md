# 🏠 Firebase Based Smart Home Automation System
## ESP32 + Web Dashboard + Android App Ready
### By **Yarana IoT Guru** - **Mr. Abhishek Maurya**

[![Website](https://img.shields.io/badge/Website-smart.yaranaiotguru.in-0A66C2?style=for-the-badge)](https://smart.yaranaiotguru.in)
[![YouTube](https://img.shields.io/badge/YouTube-Yarana%20IoT%20Guru-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@YaranaIotGuru)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/products/realtime-database)
[![ESP32](https://img.shields.io/badge/Board-ESP32-111111?style=for-the-badge)](#)

---

## 🔥 Overview

Ye project ek **real-time Smart Home Automation System** hai jo ESP32 aur Firebase Realtime Database par based hai.  
System relay control ko **Web Dashboard**, **Wall Switches**, aur future-ready **Android App integration** ke saath synchronize karta hai.

### Core Stack
- ESP32 WiFi Microcontroller
- Firebase Realtime Database
- Web Dashboard (`HTML + CSS + JavaScript`)
- Timer Automation (`Asia/Kolkata` / IST timezone)

---

## 🎥 Full Video Tutorial (Clickable Thumbnail)

[![Watch Full Tutorial - Smart Home Automation](https://img.youtube.com/vi/iNOqKPkyS4w/hqdefault.jpg)](https://youtu.be/iNOqKPkyS4w)

👉 Click image to play the full tutorial on YouTube:  
`https://youtu.be/iNOqKPkyS4w`

---

## ⚙️ Features

- Real-time relay ON/OFF control
- 4-channel relay support
- Safe boot protection (relays OFF on startup)
- Bi-directional sync:
  - Wall Switch → ESP32 → Firebase
  - Firebase/Web/App → ESP32 Relay
- Smart timer automation with day selection
- Auto reconnect with Firebase health checks
- Firebase streaming for low-latency updates
- Modern responsive web dashboard
- Credential update from dashboard settings

---

## 🔄 System Data Flow

`Wall Switch` ↔ `ESP32` ↔ `Firebase Realtime DB` ↔ `Web Dashboard` ↔ `Android App`

Is flow se har endpoint par state sync rehti hai, chahe control kisi bhi side se diya gaya ho.

---

## 📂 Project Structure

```text
home-automation-web/
├── home_automation_manual.ino   # ESP32 firmware
├── index.html                   # Web dashboard UI
├── style.css                    # Dashboard styling
├── script.js                    # Firebase sync + timer logic
└── README.md                    # Project documentation
```

---

## 🔌 Hardware Required

- ESP32 Dev Board
- 4-Channel Relay Module
- 4 Wall Switches (optional but recommended)
- WiFi Router / Hotspot
- Proper relay-side power wiring and isolation

---

## 🧠 GPIO Mapping (Current Firmware)

From `home_automation_manual.ino`:

- Relay Pins: `23, 22, 21, 19`
- Wall Switch Pins: `32, 33, 25, 26`

> Note: Hardware wiring karte waqt relay module ka logic (`HIGH`/`LOW` trigger) verify karein.

---

## 🔐 Firebase Realtime Database Structure

```json
{
  "relays": {
    "relay1": true,
    "relay2": false,
    "relay3": true,
    "relay4": false
  },
  "timers": {
    "timer_id_1": {
      "relay": "relay1",
      "action": "ON",
      "startTime": "18:30",
      "endTime": "22:00",
      "days": [true, true, true, true, true, false, false],
      "active": true
    }
  }
}
```

---

## 🛡 Firebase Rules (Development/Test)

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Production me rules ko authentication-based secure karein.

---

## 🚀 Setup Guide

## 1) ESP32 Firmware Setup

1. Arduino IDE me `home_automation_manual.ino` open karein.
2. Required libraries install karein:
   - `FirebaseESP32`
   - ESP32 board package
3. Code me credentials update karein:
   - `WIFI_SSID`
   - `WIFI_PASSWORD`
   - `API_KEY`
   - `DATABASE_URL`
   - `USER_EMAIL`
   - `USER_PASSWORD`
4. Correct board/port select karke ESP32 flash karein.
5. Serial Monitor (`115200`) par connection logs verify karein.

## 2) Web Dashboard Setup

1. Is folder ko static host par deploy karein (GitHub Pages / Netlify / Vercel / Firebase Hosting)  
   ya local open karein: `index.html`
2. Dashboard open hote hi Firebase API Key aur Database URL enter karein.
3. `Connect to Firebase` click karein.
4. Relay controls aur timer section active ho jayega.

## 3) Timer Automation

- Timezone fixed hai: `Asia/Kolkata (IST)`
- Start/End time define kar sakte hain
- Active days select kar sakte hain
- Scheduler periodic checks ke through relay state apply karta hai

---

## ✅ Working Logic (Step-by-Step)

1. Wall switch press hota hai  
2. ESP32 relay state change karta hai  
3. ESP32 Firebase `/relays/` update karta hai  
4. Web dashboard instant state reflect karta hai  
5. Timer trigger hone par web scheduler Firebase relay state set karta hai  
6. ESP32 stream ke through update read karke relay action execute karta hai  

---

## 🧪 Troubleshooting

- Firebase connect nahi ho raha:
  - API key / DB URL check karein
  - Realtime DB enable hai ya nahi verify karein
- Relay UI me show nahi ho rahe:
  - `/relays` node me `relay1..relay4` boolean values ensure karein
- ESP32 stream issue:
  - WiFi stability check karein
  - Firebase auth/email-password settings verify karein
- Timer expected action nahi kar raha:
  - IST timezone aur selected days verify karein
  - `startTime/endTime` format `HH:mm` me rakhein

---

## 📱 Android App Note

Current repository me web + ESP32 code available hai.  
Android app module ko aap alag folder (`Android_App/`) me add karke same Firebase nodes reuse kar sakte hain.

---

## 👨‍💻 Branding & Credits

**Developed By:** Mr. Abhishek Maurya  
**Organization:** Yarana IoT Guru  
**Website:** https://smart.yaranaiotguru.in  
**YouTube:** https://www.youtube.com/@YaranaIotGuru  
**Contact:** +91-7052722734  

---

## ⭐ Support

Agar project helpful laga ho to repo ko **Star ⭐** zaroor karein.  
Aur tutorial ke liye channel subscribe karein: **Yarana IoT Guru**.
# Firebase-ESP32-Smart-Home-Automation
