import type { RecommendationDerivation } from '@/src/features/recommendations/derivation';
import type { OutfitRecommendation } from '@/src/types/recommendations';

export function formatOutfitRecommendation(model: RecommendationDerivation): OutfitRecommendation {
  const { outfitNeeds, state } = model;

  const superior = outfitNeeds.rainProtection
    ? outfitNeeds.warmthLevel >= 2
      ? 'Base térmica + sudadera fina'
      : 'Camiseta técnica de secado rápido'
    : outfitNeeds.breathableLevel === 2
      ? 'Tejido ligero transpirable'
      : outfitNeeds.warmthLevel >= 2
        ? 'Jersey de punto suave'
        : state === 'golden_hour'
          ? 'Camiseta + camisa ligera'
          : 'Camiseta o camisa ligera';

  const capa = outfitNeeds.rainProtection
    ? 'Impermeable con capucha'
    : outfitNeeds.windProtection && outfitNeeds.warmthLevel >= 2
      ? 'Cortavientos + capa térmica'
      : outfitNeeds.windProtection
        ? 'Cortavientos ligero'
        : outfitNeeds.addEveningLayer || outfitNeeds.warmthLevel >= 1
          ? outfitNeeds.warmthLevel >= 2
            ? 'Chaqueta media'
            : 'Sobrecamisa ligera'
          : 'No necesaria ahora';

  const calzado = outfitNeeds.waterproofFootwear
    ? 'Calzado impermeable con suela adherente'
    : outfitNeeds.warmthLevel >= 2
      ? 'Zapatilla cerrada o botín ligero'
      : outfitNeeds.breathableLevel === 2
        ? 'Calzado ventilado'
        : 'Zapatilla urbana cómoda';

  const accesorios = outfitNeeds.rainProtection
    ? 'Paraguas compacto'
    : outfitNeeds.sunProtectionLevel >= 3
      ? 'SPF50+, gafas UV y gorra'
      : outfitNeeds.sunProtectionLevel >= 2
        ? 'Protector solar y gafas UV'
        : outfitNeeds.windProtection
          ? 'Gafas y cuello ligero'
          : outfitNeeds.warmthLevel >= 2
            ? 'Bufanda fina opcional'
            : 'Ninguno imprescindible';

  const noteByState: Record<typeof state, string> = {
    pleasant_sunny: 'Puedes mantener una capa ligera en bolso por si cambia el viento al final del día.',
    strong_sun: 'Reaplica protección solar cada 2 horas si sigues al aire libre.',
    soft_cloudy: 'Ajuste cómodo: suficiente libertad para moverte sin sobrecargar capas.',
    rainy: 'Prioriza tejidos que sequen rápido al volver y evita piezas muy pesadas.',
    windy: 'El cortavientos aporta más confort que sumar volumen de ropa.',
    cool_evening: 'Añade capa antes del atardecer para sostener confort térmico.',
    golden_hour: 'Franja muy amable: sal con capa fina para el regreso.',
    night_clear: 'La noche está limpia, pero el viento puede enfriar más de lo esperado.',
  };

  if (outfitNeeds.rainProtection && accesorios.toLowerCase().includes('gafas uv')) {
    return {
      superior,
      capa,
      calzado,
      accesorios: 'Paraguas compacto',
      note: noteByState[state],
    };
  }

  return {
    superior,
    capa,
    calzado,
    accesorios,
    note: noteByState[state],
  };
}
