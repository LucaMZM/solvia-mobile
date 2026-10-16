import { AppScreen } from '@/src/components/ui/AppScreen';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { PermissionState } from '@/src/components/ui/PermissionState';
import { ScreenSurface } from '@/src/components/ui/ScreenSurface';
import { WeatherScreenSkeleton } from '@/src/components/ui/WeatherScreenSkeleton';
import { LocationQuickSwitchCard } from '@/src/features/location/components/LocationQuickSwitchCard';
import { RopaCurrentOutfitCard } from '@/src/features/ropa/components/RopaCurrentOutfitCard';
import { RopaReasoningCard } from '@/src/features/ropa/components/RopaReasoningCard';
import { RopaSummaryCard } from '@/src/features/ropa/components/RopaSummaryCard';
import { RopaTimelineCard } from '@/src/features/ropa/components/RopaTimelineCard';
import { useRopaScreenModel } from '@/src/features/ropa/useRopaScreenModel';

export function RopaScreen() {
  const { status, errorMessage, model, offlineMessage, locationPermissionDenied, refetch } = useRopaScreenModel();

  if (status === 'loading') {
    return <WeatherScreenSkeleton cards={3} />;
  }

  if (status === 'error') {
    return (
      <AppScreen>
        <ErrorState
          actionLabel="Reintentar"
          body={errorMessage}
          onActionPress={() => void refetch()}
          title="No pudimos actualizar tu guía de ropa"
        />
      </AppScreen>
    );
  }

  if (status === 'empty' || !model) {
    return (
      <AppScreen>
        <EmptyState
          actionLabel="Intentar de nuevo"
          body="Faltan datos para construir tu guía de ropa."
          onActionPress={() => void refetch()}
          title="Guía de ropa no disponible"
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      {locationPermissionDenied ? (
        <PermissionState
          body="Usamos tu última ubicación válida. Activa la ubicación para actualizar tu zona."
          title="Ubicación limitada por permisos"
        />
      ) : null}
      {!locationPermissionDenied && offlineMessage ? <OfflineBanner body={offlineMessage} /> : null}

      <RopaSummaryCard
        cityName={model.cityName}
        support={model.summary.support}
        thermalProfileLabel={model.thermalProfileLabel}
        title={model.summary.title}
      />

      <ScreenSurface>
        <LocationQuickSwitchCard />
        <RopaCurrentOutfitCard outfit={model.currentOutfit} />
        <RopaTimelineCard moments={model.moments} />
        <RopaReasoningCard items={model.reasoning} />
      </ScreenSurface>
    </AppScreen>
  );
}
