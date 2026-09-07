# KalaSetu AI — Mobile App (Expo + React Native)

AI-powered digital commerce assistant for Indian artisans:
photo/voice → AI understanding → image enhancement → catalogue →
translation → price recommendation → publish → marketplace → enquiry.

## Run

```bash
cd mobile
npm install
npx expo start
```

- Press `a` (Android emulator), `i` (iOS simulator), or scan the QR with Expo Go.
- Backend must be running: `python run.py` (FastAPI on `http://127.0.0.1:8000`).
- On a physical device set `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000`.

## Structure

```
mobile/
  App.js                 # AuthProvider + NavigationContainer
  app.json               # Expo config (KalaSetu AI, camera/photos permissions)
  src/
    theme.js             # Natural Heritage + Modern AI tokens
    i18n.js              # en/hi/bn UI strings
    api/client.js        # Axios REST client (JWT via AsyncStorage)
    auth/AuthContext.js  # Email auth vs existing FastAPI /api/auth/*
    navigation/RootNavigator.js  # BuyerTabs (5) + ArtisanTabs (5) + stacks
    components/ui.js     # Header, search, chips, cards, buttons, empty states
    screens/             # Splash, Onboarding, Login, RoleSelect
      buyer/             # Home, Explore, Search, Category, Details, Artisan, Enquiry, Enquiries, Cart, Profile
      artisan/           # Home, MyProducts, Create, Studio, Voice, Review, Price, Success, Dashboard, Profile
```

## Backend contract (existing FastAPI reused, nothing rewritten)

Auth, products, categories, cart, orders, notifications, seller dashboard,
`/api/ai/upload-and-enhance`, `/api/ai/regenerate-text` are reused as-is.
New additive endpoints in `backend/routers/mobile_router.py`:
`/api/enquiries/*`, `/api/translate`, `/api/pricing/recommend`.

OAuth (Google/Apple) and Phone/OTP show honest configuration states until
backend credentials are provisioned — no fake logins.
