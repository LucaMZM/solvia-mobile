import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { HeroAssetSceneKind } from '@/src/features/weatherHeroAssets/heroAssetProfiles';
import { withAlpha } from '@/src/theme/colorUtils';

interface ProceduralHeroSceneProps {
  sceneKind: HeroAssetSceneKind;
  accentColor: string;
}

const CLOUD_RAIN_DROPS = [
  { left: 78, top: 126, height: 17 },
  { left: 108, top: 137, height: 18 },
  { left: 138, top: 124, height: 20 },
  { left: 168, top: 138, height: 16 },
  { left: 198, top: 129, height: 18 },
] as const;

const WIND_CURVES = [
  { left: 30, top: 70, width: 90, rotation: -9 },
  { left: 62, top: 94, width: 104, rotation: -7 },
  { left: 96, top: 70, width: 112, rotation: -10 },
  { left: 136, top: 100, width: 96, rotation: -6 },
] as const;

const NIGHT_STARS = [
  { left: 18, top: 22, size: 3 },
  { left: 46, top: 12, size: 2 },
  { left: 158, top: 22, size: 2 },
  { left: 174, top: 46, size: 3 },
] as const;

function OrbScene({
  coreColors,
  haloColor,
  shadowColor,
  rimColor,
  glossOpacity,
  hazeColor,
}: {
  coreColors: [string, string, string];
  haloColor: string;
  shadowColor: string;
  rimColor: string;
  glossOpacity: number;
  hazeColor?: string;
}) {
  return (
    <View style={styles.orbScene}>
      <View style={[styles.castShadow, { backgroundColor: shadowColor }]} />
      <View style={[styles.orbHalo, { backgroundColor: haloColor }]} />
      <LinearGradient
        colors={coreColors}
        end={{ x: 0.9, y: 0.9 }}
        start={{ x: 0.12, y: 0.08 }}
        style={styles.orbCore}
      />
      <View style={[styles.orbRim, { borderColor: rimColor }]} />
      <LinearGradient
        colors={[withAlpha('#ffffff', glossOpacity), withAlpha('#ffffff', 0)]}
        end={{ x: 0.95, y: 0.9 }}
        start={{ x: 0.2, y: 0.1 }}
        style={styles.orbGloss}
      />
      <View style={styles.orbSpecular} />
      {hazeColor ? <View style={[styles.orbHaze, { backgroundColor: hazeColor }]} /> : null}
    </View>
  );
}

function CloudScene({
  windy,
  rainy,
  tintColor,
}: {
  windy?: boolean;
  rainy?: boolean;
  tintColor?: string;
}) {
  return (
    <View style={styles.cloudScene}>
      <View style={styles.cloudCastShadow} />

      <LinearGradient
        colors={['#eef5ff', '#b8c7dc', '#526a8d']}
        end={{ x: 0.88, y: 0.92 }}
        start={{ x: 0.1, y: 0.08 }}
        style={styles.cloudLobeBack}
      />
      <LinearGradient
        colors={['#f2f8ff', '#c1d0e4', '#627a9c']}
        end={{ x: 0.9, y: 0.9 }}
        start={{ x: 0.12, y: 0.08 }}
        style={styles.cloudLobeMid}
      />
      <LinearGradient
        colors={['#f8fbff', '#cad7ea', '#6f84a2']}
        end={{ x: 0.9, y: 0.9 }}
        start={{ x: 0.12, y: 0.08 }}
        style={styles.cloudLobeFront}
      />
      <View style={styles.cloudRim} />
      <LinearGradient
        colors={[withAlpha('#ffffff', 0.2), withAlpha('#ffffff', 0)]}
        end={{ x: 0.9, y: 0.9 }}
        start={{ x: 0.2, y: 0.1 }}
        style={styles.cloudGloss}
      />
      {tintColor ? <View style={[styles.cloudTint, { backgroundColor: tintColor }]} /> : null}

      {rainy
        ? CLOUD_RAIN_DROPS.map((drop, index) => (
            <View
              key={`cloud-rain-${drop.left}-${drop.top}`}
              style={[
                styles.cloudRainDrop,
                {
                  left: drop.left,
                  top: drop.top,
                  height: drop.height,
                  opacity: 0.42 + ((index % 3) * 0.12),
                },
              ]}
            />
          ))
        : null}

      {windy
        ? WIND_CURVES.map((curve, index) => (
            <LinearGradient
              colors={[
                withAlpha('#c9d8ee', 0),
                withAlpha('#c9d8ee', 0.68 - ((index % 2) * 0.1)),
                withAlpha('#c9d8ee', 0),
              ]}
              end={{ x: 1, y: 0.5 }}
              key={`wind-curve-${curve.left}-${curve.top}`}
              start={{ x: 0, y: 0.5 }}
              style={[
                styles.windCurve,
                {
                  left: curve.left,
                  top: curve.top,
                  width: curve.width,
                  transform: [{ rotate: `${curve.rotation}deg` }],
                },
              ]}
            />
          ))
        : null}
    </View>
  );
}

export function ProceduralHeroScene({ sceneKind, accentColor }: ProceduralHeroSceneProps) {
  if (sceneKind === 'sun_soft') {
    return (
      <OrbScene
        coreColors={['#fff3d8', '#ffc47b', '#a36230']}
        glossOpacity={0.24}
        haloColor={withAlpha(accentColor, 0.36)}
        rimColor={withAlpha('#ffffff', 0.24)}
        shadowColor={withAlpha('#221a17', 0.24)}
      />
    );
  }

  if (sceneKind === 'sun_strong') {
    return (
      <OrbScene
        coreColors={['#ffefce', '#ffb668', '#b44f1f']}
        glossOpacity={0.3}
        haloColor={withAlpha('#ffb15a', 0.5)}
        rimColor={withAlpha('#ffe5c1', 0.34)}
        shadowColor={withAlpha('#2a1710', 0.28)}
      />
    );
  }

  if (sceneKind === 'golden') {
    return (
      <OrbScene
        coreColors={['#ffe9c9', '#ffbb76', '#b15e35']}
        glossOpacity={0.24}
        haloColor={withAlpha('#ffbb73', 0.42)}
        hazeColor={withAlpha('#ffb173', 0.26)}
        rimColor={withAlpha('#ffe8ca', 0.32)}
        shadowColor={withAlpha('#2a1d17', 0.24)}
      />
    );
  }

  if (sceneKind === 'twilight') {
    return (
      <OrbScene
        coreColors={['#e7f0ff', '#9ab4df', '#4c628f']}
        glossOpacity={0.2}
        haloColor={withAlpha('#8ab2e8', 0.32)}
        hazeColor={withAlpha('#8ab2e8', 0.2)}
        rimColor={withAlpha('#d5e3ff', 0.28)}
        shadowColor={withAlpha('#121b2b', 0.26)}
      />
    );
  }

  if (sceneKind === 'moon') {
    return (
      <View style={styles.orbScene}>
        <OrbScene
          coreColors={['#f5f8ff', '#c8d4ee', '#546b96']}
          glossOpacity={0.16}
          haloColor={withAlpha('#9ab1e8', 0.3)}
          rimColor={withAlpha('#edf4ff', 0.24)}
          shadowColor={withAlpha('#0f1422', 0.26)}
        />
        {NIGHT_STARS.map((star, index) => (
          <View
            key={`night-star-${star.left}-${star.top}`}
            style={[
              styles.nightStar,
              {
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                opacity: 0.7 - ((index % 3) * 0.12),
              },
            ]}
          />
        ))}
      </View>
    );
  }

  if (sceneKind === 'cloud_soft') {
    return <CloudScene tintColor={withAlpha('#b9c8de', 0.16)} />;
  }

  if (sceneKind === 'cloud_rain') {
    return <CloudScene rainy tintColor={withAlpha('#8ea4c7', 0.2)} />;
  }

  return <CloudScene tintColor={withAlpha(accentColor, 0.14)} windy />;
}

const styles = StyleSheet.create({
  orbScene: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  castShadow: {
    borderRadius: 999,
    bottom: 30,
    height: 50,
    position: 'absolute',
    width: 170,
  },
  orbHalo: {
    borderRadius: 999,
    height: 232,
    position: 'absolute',
    width: 232,
  },
  orbCore: {
    borderRadius: 999,
    height: 172,
    width: 172,
  },
  orbRim: {
    borderRadius: 999,
    borderWidth: 1.5,
    height: 172,
    position: 'absolute',
    width: 172,
  },
  orbGloss: {
    borderRadius: 999,
    height: 172,
    left: '17%',
    position: 'absolute',
    top: '15%',
    width: 172,
  },
  orbSpecular: {
    backgroundColor: withAlpha('#ffffff', 0.28),
    borderRadius: 999,
    height: 23,
    left: '35%',
    position: 'absolute',
    top: '31%',
    width: 23,
  },
  orbHaze: {
    borderRadius: 180,
    bottom: 24,
    height: 82,
    position: 'absolute',
    width: 188,
  },
  nightStar: {
    backgroundColor: withAlpha('#f6f9ff', 0.92),
    borderRadius: 999,
    position: 'absolute',
  },
  cloudScene: {
    flex: 1,
  },
  cloudCastShadow: {
    backgroundColor: withAlpha('#0e1626', 0.28),
    borderRadius: 120,
    bottom: 12,
    height: 46,
    left: 70,
    position: 'absolute',
    width: 170,
  },
  cloudLobeBack: {
    borderRadius: 110,
    height: 94,
    left: 70,
    position: 'absolute',
    top: 54,
    width: 170,
  },
  cloudLobeMid: {
    borderRadius: 100,
    height: 88,
    left: 30,
    position: 'absolute',
    top: 66,
    width: 138,
  },
  cloudLobeFront: {
    borderRadius: 96,
    height: 84,
    left: 146,
    position: 'absolute',
    top: 72,
    width: 122,
  },
  cloudRim: {
    borderColor: withAlpha('#f2f7ff', 0.32),
    borderRadius: 110,
    borderWidth: 1,
    height: 92,
    left: 72,
    position: 'absolute',
    top: 56,
    width: 164,
  },
  cloudGloss: {
    borderRadius: 90,
    height: 38,
    left: 96,
    position: 'absolute',
    top: 72,
    width: 102,
  },
  cloudTint: {
    borderRadius: 110,
    height: 66,
    left: 92,
    position: 'absolute',
    top: 96,
    width: 148,
  },
  cloudRainDrop: {
    backgroundColor: withAlpha('#d4e2f4', 0.78),
    borderRadius: 999,
    position: 'absolute',
    transform: [{ rotate: '-8deg' }],
    width: 2.4,
  },
  windCurve: {
    borderRadius: 999,
    height: 7,
    position: 'absolute',
  },
});
