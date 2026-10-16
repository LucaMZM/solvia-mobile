import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { ChoicePills } from '@/src/features/trayecto/components/ChoicePills';
import { trayectoModes, trayectoModeLabels } from '@/src/domain/trayecto/trayectoDomain';
import { appIcons } from '@/src/theme/iconography';
import type { TrayectoMode } from '@/src/types/trayecto';

interface TrayectoModeSwitchCardProps {
  mode: TrayectoMode;
  onChange: (mode: TrayectoMode) => void;
}

export function TrayectoModeSwitchCard({ mode, onChange }: TrayectoModeSwitchCardProps) {
  return (
    <SectionCard>
      <SectionHeading iconName="map-clock-outline" title="Tipo de trayecto" />
      <ChoicePills
        accessibilityPrefix="Seleccionar modo"
        onChange={onChange}
        options={trayectoModes.map((value) => ({
          value,
          label: trayectoModeLabels[value],
          iconName: appIcons.trayectoModes[value],
        }))}
        value={mode}
      />
    </SectionCard>
  );
}
