#include <WiFi.h>
#include <FirebaseESP32.h>
#include <addons/TokenHelper.h>

// ================= USER CONFIG ================= //
#define WIFI_SSID       "YaranaFiberOffice"
#define WIFI_PASSWORD   "Yarana@7052"

#define API_KEY         "AIzaSyCsmAAzvWe8Z0EjlEl1-yo5tHL3TZi7h54"
#define DATABASE_URL    "home-automation-b06ea-default-rtdb.firebaseio.com"

#define USER_EMAIL      "contact@yaranaiotguru.in"
#define USER_PASSWORD   "Yarana@1234"
// =============================================== //

FirebaseData stream, fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ================= RELAY + SWITCH CONFIG ================= //
int relayPins[4]  = {23, 22, 21, 19};
int switchPins[4] = {32, 33, 25, 26};

bool relayState[4]      = {0};
bool lastSwitchState[4] = {HIGH, HIGH, HIGH, HIGH};
// ========================================================= //

unsigned long lastStreamCheck = 0;

// ================= SAFE BOOT ================= //
void safeBoot() {
  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], LOW);

    pinMode(switchPins[i], INPUT_PULLUP); // wall switch
  }
  Serial.println("🛡 SAFE BOOT → Relays OFF, Wall Switch Mode");
}

// ================= RELAY WRITE ================= //
void setRelay(int r, bool state, const char* source) {
  digitalWrite(relayPins[r], state ? HIGH : LOW);
  relayState[r] = state;

  Serial.printf("🔌 Relay %d = %s (%s)\n",
                r + 1,
                state ? "ON" : "OFF",
                source);
}

// ================= WIFI ================= //
void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("🌐 Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }

  Serial.println("\n✅ WiFi Connected");
  Serial.println(WiFi.localIP());
}

// ================= FIREBASE ================= //
void connectFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  config.token_status_callback = tokenStatusCallback;

  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  while (!Firebase.ready()) delay(200);

  Firebase.beginStream(stream, "/relays");
  Serial.println("🔥 Firebase Stream Started");
}

// ================= SETUP ================= //
void setup() {
  Serial.begin(115200);
  delay(500);

  safeBoot();
  connectWiFi();
  connectFirebase();
}

// ================= LOOP ================= //
void loop() {

  // ---------- WALL SWITCH → RELAY + FIREBASE ----------
  for (int i = 0; i < 4; i++) {
    bool current = digitalRead(switchPins[i]);

    if (current != lastSwitchState[i]) {
      bool newState = (current == LOW); // LOW = ON

      setRelay(i, newState, "WALL SWITCH");

      String path = "/relays/relay" + String(i + 1);
      Firebase.setBool(fbdo, path, newState);
      Serial.println("☁️ Firebase Updated: " + path);

      lastSwitchState[i] = current;
    }
  }

  // ---------- FIREBASE → RELAY ----------
  if (Firebase.readStream(stream) && stream.streamAvailable()) {

    String path = stream.dataPath(); // /relay1
    int relay = path.substring(6).toInt() - 1;

    if (relay >= 0 && relay < 4) {
      bool state = stream.boolData();
      setRelay(relay, state, "FIREBASE");
    }
  }

  // ---------- HEALTH CHECK ----------
  if (millis() - lastStreamCheck > 10000) {
    lastStreamCheck = millis();
    if (!Firebase.ready()) connectFirebase();
  }
}