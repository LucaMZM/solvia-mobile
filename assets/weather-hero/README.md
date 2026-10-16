# Pipeline de Assets Hero Meteo (Solvía)

Pipeline profesional para reemplazar los placeholders premium del hero de `Hoy` por assets 3D finales con seguridad legal y buena performance.

## Objetivo del sistema
- Mantener Expo Go compatible (sin GLB runtime).
- Usar fallback procedural premium si falta un asset.
- Permitir reemplazo por drop-in de archivos exportados (Meshy, CrealityCloud, renders propios).
- Bloquear uso accidental de assets sin licencia comercial.

## Estructura obligatoria
- `assets/weather-hero/manifest.json`
- `assets/weather-hero/sunny.png`
- `assets/weather-hero/partly-cloudy.png`
- `assets/weather-hero/cloudy.png`
- `assets/weather-hero/rain.png`
- `assets/weather-hero/storm.png`
- `assets/weather-hero/wind.png`
- `assets/weather-hero/night-clear.png`
- `assets/weather-hero/night-cloudy.png`
- `assets/weather-hero/fog.png`
- `assets/weather-hero/snow.png`
- `assets/weather-hero/pleasant_sunny/`
- `assets/weather-hero/strong_sun/`
- `assets/weather-hero/soft_cloudy/`
- `assets/weather-hero/rainy/`
- `assets/weather-hero/windy/`
- `assets/weather-hero/cool_evening/`
- `assets/weather-hero/golden_hour/`
- `assets/weather-hero/night_clear/`
- `assets/weather-hero/<weather_state>/metadata.json`

## Formatos soportados
- `webp` (recomendado para producción)
- `png` con alpha (alternativa segura)
- `json` Lottie (solo si ya está soportado en tu app)
- `riv` (Rive, solo si ya está soportado)
- `mp4` corto (opcional y con criterio de rendimiento)

Hoy el hero usa `image` + fallback procedural; los demás formatos quedan listos en metadata/registry para integración progresiva.

## Pack PNG activo
El pack activo usado por la hero vive en la raíz de `assets/weather-hero/` y se centraliza en:

- `src/features/weatherVisuals/weatherAssets.ts`
- `src/features/weatherVisuals/AnimatedWeatherAsset.tsx`
- `assets/weather-hero/active-assets-metadata.json` documenta fuente, autor, licencia y estado comercial de cada PNG activo.

Los diez PNG activos fueron generados específicamente para Solvía con OpenAI image generation / ChatGPT bajo dirección de Luca Mazmishvili, según declaración del titular del proyecto. No proceden de un banco de imágenes conocido. Los términos de OpenAI atribuyen al usuario los derechos de output frente a OpenAI en la medida permitida por la ley; esto no garantiza exclusividad ni descarta similitudes con terceros. Conservar el historial de generación fuera del repositorio si se necesita prueba adicional. Antes de App Store, revisar los términos vigentes y cualquier contenido de terceros perceptible en los renders.

Si se sustituyen por WebP, cambia los nombres o requires en `weatherAssets.ts` y mantén el resto de pantallas sin cambios.

## Metadata obligatoria por asset
Cada `metadata.json` debe incluir:
- `id`
- `weatherState`
- `filePath`
- `format`
- `kind`
- `source`
- `author`
- `license`
- `attributionRequired`
- `commercialUseAllowed`
- `notes`

## Reglas legales (no negociables)
- No usar assets aleatorios de internet.
- No asumir que algo es “free/commercial”.
- No usar nada sin licencia verificable para uso comercial.
- Documentar siempre fuente y licencia en metadata.
- Si requiere atribución, dejarlo explícito antes de release.

## Flujo de reemplazo (Meshy / CrealityCloud / render propio)
1. Exporta el render en formato final (`webp` preferido, `png` permitido).
2. Nombra el archivo con convención del estado, por ejemplo:
   - `hero_soft_sun_v1.webp`
3. Copia el archivo en:
   - `assets/weather-hero/<weather_state>/`
4. Actualiza `metadata.json` del estado:
   - `filePath`: ruta relativa completa
   - `format`: `webp` o `png`
   - `source`: Meshy / CrealityCloud / pipeline interno
   - `author`, `license`, `attributionRequired`, `commercialUseAllowed`, `notes`
5. Regenera el registry:
   - `npm run assets:hero:sync`
6. Valida metadata/manifiesto:
   - `npm run assets:hero:check`
7. Verifica en Expo Go:
   - legibilidad del texto
   - ausencia de saltos de layout
   - fallback correcto si el archivo falla

## Guía rápida de export (recomendada)

### Meshy (o renderer equivalente)
- Fondo transparente si es posible.
- Cámara fija consistente por estado.
- Iluminación suave, sin bloom excesivo.
- Exportar a imagen 2D final (no GLB para hero runtime).

### CrealityCloud / marketplace 3D
- Confirmar licencia comercial antes de descargar/exportar.
- Guardar comprobante/licencia fuera del repo.
- Re-renderizar a 2D optimizada para app (WebP/PNG).

## Presupuesto visual y performance
- Resolución objetivo por asset: `900x900` a `1400x1400` (según detalle).
- Peso ideal por asset:
  - WebP: `120KB` a `320KB`
  - PNG alpha: intentar `< 500KB`
- Evitar videos largos y assets con alpha muy pesada.
- No usar GLB/real-time 3D en el hero principal por ahora.

## Comandos del pipeline
- `npm run assets:hero:sync`: detecta archivos reales y genera registry estático.
- `npm run assets:hero:check`: valida manifest + metadata + rutas.

## Advertencia final
No subas a producción ningún asset con `commercialUseAllowed: false` o con licencia no verificada. La procedencia declarada de este pack no convierte otros assets del repositorio en material autorizado.
