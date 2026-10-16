import { AppScreen } from '@/src/components/ui/AppScreen';
import { AtmosphericHero } from '@/src/components/ui/AtmosphericHero';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { PermissionState } from '@/src/components/ui/PermissionState';
import { ScreenSurface } from '@/src/components/ui/ScreenSurface';
import { WeatherScreenSkeleton } from '@/src/components/ui/WeatherScreenSkeleton';
import { ActivitiesCard } from '@/src/features/hoy/components/ActivitiesCard';
import { DailyReportCard } from '@/src/features/hoy/components/DailyReportCard';
import { NextHoursCard } from '@/src/features/hoy/components/NextHoursCard';
import { OutfitCard } from '@/src/features/hoy/components/OutfitCard';
import { PlanModeCard } from '@/src/features/hoy/components/PlanModeCard';
import { SunUvCard } from '@/src/features/hoy/components/SunUvCard';
import { WeeklyOutlookCard } from '@/src/features/hoy/components/WeeklyOutlookCard';
import { WindCard } from '@/src/features/hoy/components/WindCard';
import { LocationQuickSwitchCard } from '@/src/features/location/components/LocationQuickSwitchCard';
import { useHoyScreenModel } from '@/src/features/hoy/useHoyScreenModel';

export function HoyScreen() {
  const {
    status,
    errorMessage,
    snapshot,
    recommendations,
    dailyBrief,
    dailyBriefByMoment,
    nextHours,
    offlineMessage,
    locationPermissionDenied,
    refetch,
    selectedPlanType,
    setSelectedPlanType,
  } =
    useHoyScreenModel();

  if (status === 'loading') {
    return <WeatherScreenSkeleton cards={5} />;
  }

  if (status === 'error') {
    return (
      <AppScreen>
        <ErrorState
          actionLabel="Reintentar"
          body={errorMessage}
          onActionPress={() => void refetch()}
          title="No pudimos actualizar tu clima ahora"
        />
      </AppScreen>
    );
  }

  if (status === 'empty' || !snapshot || !recommendations) {
    return (
      <AppScreen>
        <EmptyState
          actionLabel="Intentar de nuevo"
          body="No encontramos una lectura útil ahora. Reintenta en unos segundos."
          onActionPress={() => void refetch()}
          title="Clima temporalmente no disponible"
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

      <AtmosphericHero
        atmosphere={recommendations.atmosphere}
        cityName={snapshot.cityName}
        feelsLikeC={snapshot.current.apparentTemperatureC}
        cloudCoverPct={snapshot.current.cloudCoverPct}
        isDay={snapshot.current.isDay}
        mainHeadline={recommendations.mainHeadline}
        precipitationMm={snapshot.current.precipitationMm}
        precipitationProbability={snapshot.current.precipitationProbability}
        supportCopy={recommendations.supportCopy}
        temperatureC={snapshot.current.temperatureC}
        uvIndex={snapshot.current.uvIndex}
        uvStatus={snapshot.current.uvStatus}
        weatherCode={snapshot.current.weatherCode}
        windGustKmh={snapshot.current.windGustKmh}
        windSpeedKmh={snapshot.current.windSpeedKmh}
        weatherState={recommendations.state}
        dailyBriefLine={dailyBrief?.shortLine}
      />

      <ScreenSurface>
        <LocationQuickSwitchCard />
        <ActivitiesCard activities={recommendations.activities} />
        <PlanModeCard
          onSelectPlanType={setSelectedPlanType}
          planning={recommendations.planning}
          selectedPlanType={selectedPlanType}
        />
        <DailyReportCard
          cityName={snapshot.cityName}
          dailyBriefByMoment={dailyBriefByMoment}
          recommendations={recommendations}
        />
        <SunUvCard
          isDay={snapshot.current.isDay}
          sunUv={recommendations.sunUv}
          uvStatus={snapshot.current.uvStatus}
        />
        <OutfitCard outfit={recommendations.outfit} />
        <WindCard wind={recommendations.wind} />
        <NextHoursCard
          bestNextWindow={recommendations.bestNextWindow}
          hourly={nextHours}
          weatherState={recommendations.state}
        />
        <WeeklyOutlookCard dailySeries={snapshot.dailySeries} />
      </ScreenSurface>
    </AppScreen>
  );
}
