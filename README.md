# JCE Bridal Mobile App

Fully mobile, app-native version using Expo + React Native (no `gownweb` dependency).

## Included Mobile Features

- Home screen with hero and featured gowns
- Gowns catalog with type filters
- Gown details with add-to-cart
- Cart with quantity updates and subtotal
- Checkout form with GCash/BDO payment option
- OTP-based login flow for customer profile
- OTP + password signup flow
- Forgot-password reset flow
- My Orders screen (local persistent storage)
- Contact screen (email intent)
- App-native local backend layer:
  - local gowns catalog data
  - local OTP generation/verification
  - local users/accounts
  - local orders storage

## Run Locally

1. In this project:

```bash
npm install
npm run start
```

## Build and Deploy (Future Upload)

1. Install EAS CLI:

```bash
npm install -g eas-cli
```

2. Login and configure:

```bash
eas login
eas build:configure
```

3. Build production apps:

```bash
eas build -p android --profile production
eas build -p ios --profile production
```

4. Submit to stores:

```bash
eas submit -p android --profile production
eas submit -p ios --profile production
```

Before store upload, replace app icons/splash, and verify final package IDs in `app.json`.
