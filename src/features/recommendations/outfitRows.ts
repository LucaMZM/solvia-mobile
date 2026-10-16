import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { KeyValueRowItem } from '@/src/components/ui/KeyValueRows';
import type { OutfitRecommendation } from '@/src/types/recommendations';

interface OutfitField {
  key: keyof OutfitRecommendation;
  label: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
}

const outfitFields: readonly OutfitField[] = [
  { key: 'superior', iconName: 'tshirt-crew', label: 'Superior' },
  { key: 'capa', iconName: 'hanger', label: 'Capa' },
  { key: 'calzado', iconName: 'shoe-sneaker', label: 'Calzado' },
  { key: 'accesorios', iconName: 'sunglasses', label: 'Accesorios' },
];

export function toOutfitRows(outfit: OutfitRecommendation, withIcons = true): KeyValueRowItem[] {
  return outfitFields.map((field) => ({
    id: field.key,
    label: field.label,
    value: outfit[field.key],
    iconName: withIcons ? field.iconName : undefined,
  }));
}
