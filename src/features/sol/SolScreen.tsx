import { AppScreen } from '@/src/components/ui/AppScreen';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { PermissionState } from '@/src/components/ui/PermissionState';
import { ScreenSurface } from '@/src/components/ui/ScreenSurface';
import { WeatherScreenSkeleton } from '@/src/components/ui/WeatherScreenSkeleton';
import { LocationQuickSwitchCard } from '@/src/features/location/components/LocationQuickSwitchCard';
import { SolHeroCard } from '@/src/features/sol/components/SolHeroCard';
import { SolRemindersCard } from '@/src/features/sol/components/SolRemindersCard';
import { SolUvChartCard } from '@/src/features/sol/components/SolUvChartCard';
import { SolWindowCard } from '@/src/features/sol/components/SolWindowCard';
import { useSolScreenModel } from '@/src/features/sol/useSolScreenModel';

export function SolScreen() {
  const { status, errorMessage, model, offlineMessage, locationPermissionDenied, refetch } = useSolScreenModel();

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
          title="No pudimos actualizar la guía solar"
        />
      </AppScreen>
    );
  }

  if (status === 'empty' || !model) {
    return (
      <AppScreen>
        <EmptyState
          actionLabel="Intentar de nuevo"
          body="Faltan datos para tu lectura solar ahora."
          onActionPress={() => void refetch()}
          title="Lectura solar no disponible"
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

      <SolHeroCard
        cityName={model.cityName}
        confidenceLabel={model.confidence.label}
        confidenceTone={model.confidence.tone}
        intensityHeadline={model.intensityHeadline}
        intensitySupport={model.intensitySupport}
        isDay={model.isDay}
        sunStateLabel={model.sunStateLabel}
        uvCurrent={model.uvCurrent}
        uvAvailable={model.uvAvailable}
        uvMaxForecast={model.uvMaxForecast}
        weatherState={model.weatherState}
      />

      <ScreenSurface>
        <LocationQuickSwitchCard />
        <SolWindowCard
          partOfDayLabel={model.bestWindow.partOfDayLabel}
          sunriseLabel={model.sunriseLabel}
          sunsetLabel={model.sunsetLabel}
          windowLabel={model.bestWindow.label}
          windowSupport={model.bestWindow.support}
        />
        <SolUvChartCard points={model.chartPoints} />
        <SolRemindersCard confidenceSupport={model.confidence.support} reminders={model.reminders} />
      </ScreenSurface>
    </AppScreen>
  );
}
