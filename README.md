# OFishx

OFishx is an Expo/React Native Android app that identifies **ten Philippine fish classes** from a camera photo or gallery image using the supplied trained TensorFlow Lite model. It shows the model's real scores, cautious fish background notes, and a scan history stored on the phone.

The app runs in **Expo Go 58.0.5** (Expo SDK 58). Expo Go cannot execute a `.tflite` file directly, so the app sends one photo over the local Wi-Fi network to a small Flask server on the same PC. The server runs the model and returns its actual output. There is no mock prediction and no fallback guess.

## Screens

| Screen | What it does |
| --- | --- |
| Home | Welcome, how it works, two recent scans, shortcuts |
| Scanner | Camera, gallery picker, photo preview, Identify action |
| Results | Photo, species, confidence, top-five scores, Save, field-guide link |
| Fish Information | One detail page for each of the ten model classes |
| Scan History | Reopen saved scans, delete one, clear all, empty/error states |
| About | App and model details, live server check, privacy, limits |

The scanner tab hides the bottom navigation bar so the camera and preview use the full screen.

On launch, a dark ocean-blue screen shows the OFishx logo in a white badge and a spinner for about 2.5 seconds while the app preloads its image assets, then fades into Home. A 4-second safety timeout prevents a slow preload from blocking startup. The logo eases in and breathes gently, the fish pattern drifts, and these loops stop when the phone's Reduce Motion setting is on. Result confidence bars animate to their score. The native splash uses the same dark `#083B47` background.

Branding keeps the logo's original orange/navy/gold colours, reused in `icon.png`, the adaptive Android icons, `splash-icon.png`, and `favicon.png`. A faint school-of-fish motif (`components/FishPattern.js`) appears on the Home, About, and fish-detail hero cards.

## Project layout

```text
Ofishx\
  App.js                     Navigation container, safe areas, status bar
  app.json                   Expo name, icon, splash, camera/gallery plugins
  navigation\AppNavigator.js Bottom tabs plus the Results stack screen
  screens\                   Home, Scanner, Results, History, Field guide, About
  components\                Screen shell, buttons, logo, confidence, history cards
  services\fishClassifier.js Uploads a photo and validates the real scores
  services\fishInformation.js Cautious facts for all ten classes
  services\scanHistory.js    AsyncStorage index plus copied photo files
  constants\config.js        PC server address, timeout, confidence threshold
  constants\labels.js        Authoritative model class order
  constants\theme.js         Palette / typography
  utils\format.js            Percent and date formatting
  assets\                    Icons, splash, trimmed logo marks
  backend\                   Flask inference server
    app.py                   /health and /predict, real TFLite inference
    model\model_unquant.tflite
    model\labels.txt
    requirements.txt
    start-server.bat         Creates the venv, then starts the server
```

The app and server live in one repository: the Expo app at the root, the Flask server under `backend\`, and the trained model committed at `backend\model\model_unquant.tflite`.

## Get the code

```powershell
git clone https://github.com/jze-io/AI-Based-Local-FIsh-Species-Identification-System.git
cd AI-Based-Local-FIsh-Species-Identification-System
```

## Model and labels

The verified model is committed at:

```text
backend\model\model_unquant.tflite
backend\model\labels.txt
```

Contract verified directly from the model file:

- Input: `1 × 224 × 224 × 3`, `float32`
- Preprocessing: RGB, **stretch-resize** to 224 × 224, then `pixel / 127.5 - 1.0` (range −1 to 1)
- Output: `1 × 10`, `float32` softmax
- SHA-256 of the model: `9427784E667F491364C81CF7648872981181240A17E9CCF11727010FD1A91F56`
- Label order: Bangus, Dalagang bukid, Budboron, Pakol, Tulay, Bilong-bilong, Barilis, Tulingan, Hiwas, Tilapia

The backend refuses to start if the model hash or class count does not match. This prevents accidentally serving a different TFLite model.

`constants\labels.js` repeats the class order so the app can reject unknown labels from the server.

## Requirements

- Windows PC with Python 3.12 (TensorFlow wheels for this setup)
- Node.js and npm
- Android phone with **Expo Go 58.0.5** installed
- Phone and PC on the same Wi-Fi network
- The trained model and labels in `backend\model`

## 1. Start the inference server

First run only (or use `start-server.bat`):

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Every time you want to use the app:

```powershell
cd backend
.\.venv\Scripts\python.exe app.py
```

Or double-click `start-server.bat`. The first start can take 20–40 seconds while TensorFlow imports. Leave the console window open.

Verify on the PC:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

The response must say `status: ok` and list ten classes.

### Windows Firewall

If the phone cannot reach the server, allow TCP port 8000 for private networks. Run PowerShell **as Administrator**:

```powershell
New-NetFirewallRule -DisplayName "OFishx Backend 8000" `
  -Direction Inbound -Protocol TCP -LocalPort 8000 `
  -Action Allow -Profile Private
```

Keep the network profile **Private**, not Public, and do not use a guest Wi-Fi network that isolates clients.

On this PC, the Wi-Fi network is currently classified as **Public**. The rule above is Private-only, so either switch the home Wi-Fi profile to Private (Settings → Network & Internet → Wi-Fi → network properties), or use `-Profile Private,Public` **only** on a trusted home network. Windows already has inbound `python.exe` rules for Public networks, but a port-specific rule is easier to audit.

## 2. Point the app at the PC

Find the PC's Wi-Fi IPv4 address:

```powershell
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.InterfaceAlias -like '*Wi-Fi*' } |
  Select-Object IPAddress, InterfaceAlias
```

Edit `constants\config.js`:

```js
export const API_BASE_URL = "http://192.168.254.109:8000";
```

This project is currently set to `192.168.254.109`. If the router gives the PC a different address later, update that line and reload the app. A DHCP reservation is recommended.

Do **not** use `localhost` on the phone: that points at the phone itself.

Test from the phone's browser first:

```text
http://192.168.254.109:8000/health
```

If that page does not load, fix Wi-Fi/firewall before testing the app.

## 3. Start the app

In a second terminal:

```powershell
cd <repo folder>
npx.cmd expo start --go
```

PowerShell execution policy may block `npx`, so `npx.cmd` is used here. Scan the QR code with Expo Go, or open the project from Expo Go's development-server list. Both devices must be on the same network.

If Expo picks a different connection mode, choose **LAN** (not Tunnel) so the phone can reach Metro.

## 4. Test on the phone

1. Open **OFishx** in Expo Go.
2. Confirm the Home screen shows the ten-species label and no red error screen.
3. Open **About** and wait for **Model server connected**. If it fails, use the IP/firewall steps above.
4. Go to **Scan**. Allow camera access when asked.
5. Photograph one fish in good light, or choose a gallery photo.
6. Check the preview, then tap **Identify fish**.
7. Confirm the Results screen shows the photo, species, confidence percentage, top-five scores, and description.
8. Tap **Save this scan**; it should change to **Saved to history**.
9. Open **History** and confirm the scan appears. Open it again from History.
10. Delete one scan; confirm it disappears. Test **Clear all** only when you want to erase everything.
11. Open **Fish information**, pick a species, and check the detail page.
12. Turn the PC server off and try Identify again. The app must show a clear connection error and must **not** show a fabricated result.

## Verified backend smoke test

The server was started and `/health` returned the ten labels. One real dataset image per class was posted to `/predict`. All ten produced a model response, with these observations from that single-image sample:

| Dataset folder | Top prediction | Top-1 score |
| --- | --- | --- |
| Bangus | Bangus | 100.0% |
| Barilis | Barilis | 99.3% |
| Bilong-bilong | Bilong-bilong | 99.3% |
| Budboron | Bangus | 57.5% |
| Dalagang bukid | Dalagang bukid | 100.0% |
| Hiwas | Bilong-bilong | 100.0% |
| Pakol | Pakol | 98.5% |
| Tilapia | Tilapia | 100.0% |
| Tulay | Budboron | 58.9% |
| Tulingan | Tulingan | 100.0% |

Seven of ten were top-1 matches in this small smoke test. The Budboron photo landed on Bangus (with Budboron second at 40.6%), the Tulay photo landed on Budboron, and the Hiwas photo landed on the closely related moonfish class. This is **not** an accuracy benchmark; it shows why the UI warns about uncertainty and why the app does not present a result as a guaranteed identification.

`npx.cmd expo lint` passes. `npx.cmd expo export --platform android` bundles successfully.

## API contract

`GET /health` returns status, model name, input details, and the class list.

`POST /predict` accepts `multipart/form-data` with field name `image`:

```powershell
curl.exe -X POST http://127.0.0.1:8000/predict `
  -F "image=@C:\path\to\fish.jpg"
```

Success response:

```json
{
  "success": true,
  "topPrediction": { "label": "Bangus", "confidence": 0.99 },
  "predictions": [
    { "label": "Bangus", "confidence": 0.99 }
  ],
  "lowConfidence": false,
  "inferenceMs": 25.4,
  "receivedFormat": "JPEG"
}
```

Errors return `success: false`, a code, and a readable message. The client maps them to camera, gallery, network, timeout, format, and server messages.

## Error and edge-case handling

- Camera permission denied, blocked, or unavailable: permission card plus gallery fallback.
- Gallery cancellation: no error, no state change.
- Non-image, unsupported MIME type, image over 12 MB: rejected before upload with a clear message.
- Corrupt/empty file, missing file: rejected with a clear message.
- Server offline, wrong IP, timeout: explicit failure; no fake prediction.
- Backend model/label mismatch: rejected by both the server and the client.
- Duplicate Identify taps or Save taps: locked while the request is running.
- Low confidence below 60%: uncertainty banner on Results.
- Missing conditions or unsupported format on the server: 4xx JSON error.
- Corrupt local history: error state with a clear-history action.
- Missing saved photo: result screen shows a fallback instead of crashing.
- History empty: empty state with a Start scanning action.

## Remaining limitations

1. **The PC server is required.** Expo Go cannot load native TFLite modules, so identification is not offline. Phone and PC must be on the same Wi-Fi and the backend must stay running.
2. **One image, one class.** The model returns one of ten trained classes. A fish outside those classes will still be forced into one of them.
3. **Scores are not certainty.** A 100% model output can still be wrong, as the Hiwas sample shows. Results are labelled as suggestions.
4. **Local names overlap.** Hiwas and Bilong-bilong both map to moonfish in the project's data; Barilis and Tulay are broad market names. The app flags scientific names as confirmed, probable, or unconfirmed instead of inventing certainty.
5. **Image quality matters.** Angle, lighting, glare, partial fish, multiple fish, and background clutter can change the result.
6. **No trained accuracy figure is claimed.** No held-out evaluation was supplied with the model, so the app does not advertise an accuracy percentage.
7. **LAN security.** The Flask server has no authentication and must only run on a trusted network. Do not expose port 8000 to the internet.
8. **Not a scientific or safety tool.** Do not use it for food safety, conservation, regulatory, or medical decisions.

## Privacy

- The photo is uploaded only to the user's own PC over the local network.
- The server processes the image in memory and does not save it.
- Saved scans and copied photos remain in Expo Go's app storage on the phone and can be deleted from History.
- There is no account, analytics, or third-party API key in the client.
