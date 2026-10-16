# Solvía

**El tiempo, traducido a decisiones.**

Cross-platform weather decision assistant built with React Native, Expo and TypeScript. Solvía turns current conditions and forecasts into concise guidance for going out, choosing clothes and planning a trip. The product interface is in Spanish.

> Portfolio source by Luca Mazmishvili. Solvía is a Mazmi Systems project. This public repository is **not** an open-source licence; see [LICENSE](LICENSE).

## What the app does

- **Hoy:** current conditions, short activity guidance, hourly forecast, weekly outlook and daily brief.
- **Sol and Ropa:** UV guidance and outfit suggestions using the same weather snapshot and thermal profile.
- **Trayecto:** local outing and two-city trip weather analysis, with a basic routing fallback when no route provider is configured.
- **Perfil:** saved locations, thermal profile, weather routines and local notification preferences.
- **First run:** onboarding, location permission handling and loading/error states.

The app distinguishes live weather from cached fallback data. It requests a fresh reading when the selected location changes, and does not present a cache older than 60 minutes as current weather. The recommendation policy checks rain, storms, wind, UV, night conditions and uncertainty before presenting an activity as suitable.

## Engineering highlights

| Area | Implementation |
| --- | --- |
| Cross-platform | React Native UI and Expo configuration for iOS and Android; Expo Router tabs and safe-area layout. |
| Data | Open-Meteo forecast and geocoding clients, response parsing, local-time matching and weather integrity checks. |
| Decisions | Shared weather risk profile and recommendation policy used by screen models and trip analysis. |
| Resilience | Location-specific AsyncStorage cache, freshness limits, retry, partial data and offline fallback states. |
| Device | Foreground location permission, app lifecycle refresh, reduced-motion support and local notification guards. |
| Architecture | Typed domain, services, state, hooks, features and reusable UI components. |

## What this project demonstrates

- One React Native codebase for iOS and Android, with Expo Router navigation, safe areas, responsive mobile UI and accessible controls.
- Device integration for geolocation, permissions and app-lifecycle refresh, with AsyncStorage-backed locations and preferences.
- Open-Meteo network handling and normalization into location-aware snapshots, local-time matching, cache freshness and explicit loading/error/fallback states.
- A shared `WeatherRiskProfile` and `RecommendationPolicy` that keep activity and trip guidance consistent across features.

## Data flow

```text
Open-Meteo forecast / geocoding
          ↓
Parsing / normalization
          ↓
Weather integrity + location-scoped cache and freshness
          ↓
WeatherRiskProfile
          ↓
RecommendationPolicy
          ↓
Hoy / Sol / Ropa / Trayecto / daily brief
```

The UI renders decisions from the shared policy rather than independently deciding whether an activity is suitable. The weather and routing providers have registries for future replacements. The active route provider is a distance-based fallback, not turn-by-turn navigation; future widgets and remote push are inactive adapters, not active product features.

## Project map

```text
app/                    Expo Router entry points and tabs
src/domain/             Location domain rules
src/services/weather/   Open-Meteo client, parser, cache, integrity
src/features/           Hoy, Sol, Ropa, Trayecto, Perfil, recommendations
src/hooks/              Shared location and weather orchestration
src/state/              Zustand stores persisted through AsyncStorage
src/components/         Reusable UI and accessibility primitives
assets/weather-hero/    Weather artwork and provenance metadata
scripts/                Asset registry and validation utilities
```

## Stack and platforms

React Native, Expo SDK 54, TypeScript, Expo Router, TanStack Query, Zustand, AsyncStorage, Expo Location, Expo Notifications, Reanimated and Open-Meteo. iOS and Android are the intended targets. A web script exists for development, but the web interface is not a V1 release target.

The current workflow targets Expo Go. Notification capabilities vary by platform and runtime; advanced push, widgets, Live Activities, native MMKV and a production route provider require separate native work. The repository contains no paid-provider credentials or configured backend.

## Screenshots

Final captures are pending. Add reviewed iOS/Android screenshots under `docs/screenshots/` for onboarding, Hoy, Trayecto, Sol and Ropa, then link them here. Do not commit captures containing personal locations or notification content.

## Run locally

```bash
npm ci
npx expo start
```

Open the project with Expo Go, or use an iOS/Android simulator where available. No `.env` file or API key is required for the current Open-Meteo endpoints. Useful checks:

```bash
npm run typecheck
npm run assets:hero:check
npx expo install --check
npx expo-doctor
```

`EXPO_PUBLIC_*` values are included in the client bundle. Never place private API keys, service tokens or signing credentials there. A future paid weather or routing service must be called through a controlled backend/proxy if it requires a secret.

## Dependency security snapshot

On 17 October 2026, both `npm audit` and `npm audit --omit=dev` reported 43 package advisories (24 high, 19 moderate, none critical). `--omit=dev` does not remove Expo/Metro/Jest tooling because these packages are reached through production-declared Expo and React Native dependencies; it does **not** mean all 43 advisories execute in the mobile runtime. `decode-uri-component` through Expo Router's `query-string` path is a plausible runtime input-parsing exposure and should be revisited during SDK upgrades. Most other findings concern bundling, CSS processing, image inspection, signing or test tooling. A safe in-range PostCSS update is unavailable because Expo's Metro config pins `~8.4.32`; `npm audit fix --force` would propose incompatible major SDK changes and was not used. Re-run the audits before publishing a release.

## Weather data and privacy

Forecast data and city search are supplied by [Open-Meteo](https://open-meteo.com/). The app calls `api.open-meteo.com` with coordinates and `geocoding-api.open-meteo.com` with the search term. It uses the free endpoints without authentication. [Open-Meteo's terms](https://open-meteo.com/en/terms) limit free access to non-commercial use and rate limits; its [data licence](https://open-meteo.com/en/licence) is CC BY 4.0 and requires attribution with a link near displayed location data. Perfil includes a visible source link. Before an App Store release, check attribution placement across every weather view and obtain an appropriate plan if use becomes commercial.

With permission, device coordinates are used to request local weather and may be handled by the device's geocoding service. Saved locations, preferences, routines, cache and local notification settings are stored on the device through AsyncStorage. The repository has no analytics SDK, account service or remote push backend. This is a technical description of the current code, not a published privacy policy.

## Artwork and third-party rights

The ten active weather PNGs in `assets/weather-hero/` were generated specifically for Solvía with OpenAI image generation under Luca Mazmishvili's direction, as declared by the project owner. Their [per-file metadata](assets/weather-hero/active-assets-metadata.json) and [asset guide](assets/weather-hero/README.md) record that provenance. Generated output is subject to the applicable [OpenAI terms](https://openai.com/policies/eu-terms-of-use/) and law; no exclusivity is claimed. Other third-party components are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The app icon is an original, reproducible procedural mark generated by [`scripts/generate-brand-icon.mjs`](scripts/generate-brand-icon.mjs). Unused Expo starter branding and image placeholders are excluded from the clean public source copy.

## Security and licence

Do not report suspected secrets or exploitable flaws in a public issue; see [SECURITY.md](SECURITY.md). Copyright © 2026 Luca Mazmishvili. All rights reserved. Solvía is a Mazmi Systems project. Third-party components remain under their own licences.

**Author:** Luca Mazmishvili · [LucaMZM](https://github.com/LucaMZM)
