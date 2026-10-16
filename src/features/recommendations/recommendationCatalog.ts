import type { HeroAtmosphere, WeatherState, ActivityId } from '@/src/types/recommendations';

export const activityOrder: readonly ActivityId[] = ['tomar_sol', 'caminar', 'terraza', 'running_suave'];

const activityLabels: Record<ActivityId, string> = {
  tomar_sol: 'Tomar el sol',
  caminar: 'Caminar',
  terraza: 'Terraza',
  running_suave: 'Correr suave',
};

const stateLabelMap: Record<WeatherState, string> = {
  pleasant_sunny: 'Soleado agradable',
  strong_sun: 'Sol intenso',
  soft_cloudy: 'Nublado suave',
  rainy: 'Lluvia',
  windy: 'Viento',
  cool_evening: 'Tarde fresca',
  golden_hour: 'Hora dorada',
  night_clear: 'Noche despejada',
};

export interface StateNarrative {
  headline: string;
  support: string;
}

const atmosphereByState: Record<WeatherState, HeroAtmosphere> = {
  pleasant_sunny: {
    badge: 'CONFORT EXTERIOR',
    title: 'Día amable',
    support: 'Buen momento para salir.',
    gradientColors: ['#1f4b63', '#26415f', '#121318'],
    accent: '#f6bc63',
  },
  strong_sun: {
    badge: 'UV ELEVADO',
    title: 'Luz intensa',
    support: 'Sol fuerte. Protección primero.',
    gradientColors: ['#3f4f69', '#4f3d31', '#161317'],
    accent: '#ffb95f',
  },
  soft_cloudy: {
    badge: 'NUBOSIDAD SUAVE',
    title: 'Luz difusa',
    support: 'Día gris, cómodo si no llueve.',
    gradientColors: ['#304052', '#243141', '#0d1320'],
    accent: '#bed0e8',
  },
  rainy: {
    badge: 'PRECIPITACIÓN ACTIVA',
    title: 'Modo refugio',
    support: 'Prioriza interior y trayectos cortos.',
    gradientColors: ['#163049', '#172433', '#090f1a'],
    accent: '#93b8df',
  },
  windy: {
    badge: 'RACHAS PRESENTES',
    title: 'Viento marcado',
    support: 'Viento con impacto en confort.',
    gradientColors: ['#263942', '#25303a', '#111216'],
    accent: '#9fb7ce',
  },
  cool_evening: {
    badge: 'DESCENSO TÉRMICO',
    title: 'Fresco gradual',
    support: 'Refresca. Añade una capa.',
    gradientColors: ['#32465d', '#463744', '#111216'],
    accent: '#c2c9d8',
  },
  golden_hour: {
    badge: 'HORA DORADA',
    title: 'Luz premium',
    support: 'Franja amable para estar fuera.',
    gradientColors: ['#6f5a46', '#2e2d3f', '#101116'],
    accent: '#ffb95f',
  },
  night_clear: {
    badge: 'NOCHE ABIERTA',
    title: 'Cielo limpio',
    support: 'Sin UV. Mira viento y fresco.',
    gradientColors: ['#1a2548', '#1b2235', '#0f1014'],
    accent: '#8ea4c7',
  },
};

const narrativeByState: Record<WeatherState, StateNarrative[]> = {
  pleasant_sunny: [
    {
      headline: 'Buen momento para salir.',
      support: 'Confort estable y viento suave.',
    },
    {
      headline: 'Buen momento para moverte.',
      support: 'Aprovecha esta franja.',
    },
  ],
  strong_sun: [
    {
      headline: 'Sol intenso: mejor tramos cortos.',
      support: 'UV alto. Protección y sombra.',
    },
    {
      headline: 'Se puede salir, con protección.',
      support: 'Evita exposición larga.',
    },
  ],
  soft_cloudy: [
    {
      headline: 'Día gris, pero manejable.',
      support: 'Cómodo si no aparece lluvia.',
    },
    {
      headline: 'Buena ventana para moverte.',
      support: 'Ritmo cómodo en exterior.',
    },
  ],
  rainy: [
    {
      headline: 'Lluvia activa: mejor interior.',
      support: 'Si sales, que sea corto.',
    },
    {
      headline: 'Prioriza rutas cortas y cubiertas.',
      support: 'Paraguas recomendable.',
    },
  ],
  windy: [
    {
      headline: 'Viento con carácter.',
      support: 'Mejor zonas resguardadas.',
    },
    {
      headline: 'Con capa ligera se sostiene mejor.',
      support: 'Evita exposición abierta larga.',
    },
  ],
  cool_evening: [
    {
      headline: 'Refresca: suma una capa.',
      support: 'Mejor salir antes del bajón térmico.',
    },
    {
      headline: 'Agradable ahora, más fresco después.',
      support: 'Anticípate con capa ligera.',
    },
  ],
  golden_hour: [
    {
      headline: 'Luz amable para salir.',
      support: 'Luz amable y confort alto.',
    },
    {
      headline: 'Hora dorada: aprovéchala.',
      support: 'Buena para paseo o terraza.',
    },
  ],
  night_clear: [
    {
      headline: 'Noche limpia para salida corta.',
      support: 'Sin UV. Vigila el fresco.',
    },
    {
      headline: 'Buena noche para moverte tranquilo.',
      support: 'Capa ligera y listo.',
    },
  ],
};

export function getActivityLabel(activityId: ActivityId): string {
  return activityLabels[activityId];
}

export function getWeatherStateLabel(state: WeatherState): string {
  return stateLabelMap[state];
}

export function getAtmosphereForState(state: WeatherState): HeroAtmosphere {
  return atmosphereByState[state];
}

export function getNarrativeForState(state: WeatherState, variantSeed: number): StateNarrative {
  const variants = narrativeByState[state];
  if (variants.length === 0) {
    return {
      headline: 'Condiciones variables para hoy.',
      support: 'Consulta recomendaciones antes de salir.',
    };
  }
  return variants[Math.abs(variantSeed) % variants.length];
}
