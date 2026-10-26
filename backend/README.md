# OFishx local inference server

This small Flask service runs the **real trained TFLite model** for the OFishx phone app. Expo Go cannot load a `.tflite` file directly on Android, so the phone uploads one photo over the local Wi-Fi network and this server returns the model's actual scores.

## Model contract

Verified from `model/model_unquant.tflite`:

- Input: `1 × 224 × 224 × 3`, `float32`
- Preprocessing: RGB, stretch-resize to `224 × 224`, `pixel / 127.5 - 1.0` (range `-1…1`)
- Output: `1 × 10`, `float32` softmax probabilities
- Class order comes from `model/labels.txt`:

| Index | Label |
| --- | --- |
| 0 | Bangus |
| 1 | Dalagang bukid |
| 2 | Budboron |
| 3 | Pakol |
| 4 | Tulay |
| 5 | Bilong-bilong |
| 6 | Barilis |
| 7 | Tulingan |
| 8 | Hiwas |
| 9 | Tilapia |

The server refuses to start if the model's SHA-256 does not match the verified fish classifier (`9427784E…1F56`). This prevents accidentally serving the unrelated model that was found in another folder.

## First-time setup (Windows)

Requires **Python 3.12** (TensorFlow does not currently provide wheels for Python 3.15 here).

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Or just double-click `start-server.bat`, which creates the environment on first run.

## Run

```powershell
cd backend
.\.venv\Scripts\python.exe app.py
```

Keep this terminal open while using the app. It binds to `0.0.0.0:8000` so the phone can reach it on the same Wi-Fi network.

Verify on the PC:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Verify from the phone's browser:

```text
http://YOUR-PC-WIFI-IP:8000/health
```

## Endpoints

### `GET /health`

Returns model status, class names, and input details.

### `POST /predict`

Multipart form upload with field name `image`.

```powershell
curl.exe -X POST http://127.0.0.1:8000/predict `
  -F "image=@C:\path\to\fish.jpg"
```

Response includes the top prediction, every class score, inference time, and the low-confidence flag. It never returns a made-up result: if the image or model fails, it returns an error.

## Phone cannot connect?

1. Phone and PC must be on the **same Wi-Fi network** (not guest isolation, not mobile data).
2. Check that Windows network profile is **Private**, not Public.
3. Allow Python through Windows Defender Firewall for **Private** networks, or add a rule as Administrator:

   ```powershell
   New-NetFirewallRule -DisplayName "OFishx Backend 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -Profile Private
   ```

4. Find the PC's current Wi-Fi IPv4 address:

   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 |
     Where-Object { $_.InterfaceAlias -like '*Wi-Fi*' } |
     Select-Object IPAddress, InterfaceAlias
   ```

5. Put that address in `constants/config.js` at the repository root and restart Expo.

If the address changes (DHCP), update `config.js` again. A static DHCP reservation is recommended.

## Security notes

- This is a local development server with no authentication. Run it only on a trusted home/office network.
- It accepts images up to 12 MB, JPEG/PNG/WebP only, and limits decompression to 40 megapixels.
- Uploaded photos are processed in memory and are **not stored** by the server.
- Do not expose port 8000 to the public internet.
