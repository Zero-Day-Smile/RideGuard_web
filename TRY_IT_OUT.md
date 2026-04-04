# Try It Out

Download and test the latest Android app build:

- APK: [RideGuard Android APK](downloads/RideGuard-riderweb-debug.apk)

## Quick install (Android)

1. Download the APK to your Android phone.
2. Enable install from unknown sources when prompted.
3. Open the APK and install.
4. Start the app and connect it to your backend API.

## Backend required

Run the backend before testing app features:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

For complete setup instructions, see [README.md](README.md).
