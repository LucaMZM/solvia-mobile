import { StyleSheet } from 'react-native';

import { AppScreen } from '@/src/components/ui/AppScreen';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ErrorState } from '@/src/components/ui/ErrorState';
import { OfflineBanner } from '@/src/components/ui/OfflineBanner';
import { PermissionState } from '@/src/components/ui/PermissionState';
import { PremiumSkeleton } from '@/src/components/ui/PremiumSkeleton';
import { ScreenSurface } from '@/src/components/ui/ScreenSurface';
import { SectionCard } from '@/src/components/ui/SectionCard';
import { SectionHeading } from '@/src/components/ui/SectionHeading';
import { WeatherScreenSkeleton } from '@/src/components/ui/WeatherScreenSkeleton';
import { buildRoutePointSubtitle } from '@/src/domain/trayecto/trayectoDomain';
import { TrayectoHeroCard } from '@/src/features/trayecto/components/TrayectoHeroCard';
import { TrayectoLocalAnalysisCard } from '@/src/features/trayecto/components/TrayectoLocalAnalysisCard';
import { TrayectoLocalPlannerCard } from '@/src/features/trayecto/components/TrayectoLocalPlannerCard';
import { TrayectoModeSwitchCard } from '@/src/features/trayecto/components/TrayectoModeSwitchCard';
import { TrayectoRoutePlannerCard } from '@/src/features/trayecto/components/TrayectoRoutePlannerCard';
import { TrayectoRouteSegmentsCard } from '@/src/features/trayecto/components/TrayectoRouteSegmentsCard';
import { TrayectoRouteSummaryCard } from '@/src/features/trayecto/components/TrayectoRouteSummaryCard';
import { useTrayectoScreenModel } from '@/src/features/trayecto/useTrayectoScreenModel';
import { appIcons } from '@/src/theme/iconography';
import { appTheme } from '@/src/theme/tokens';

function CarRouteEmptyState() {
  return (
    <EmptyState
      body="Define ruta y Solvía te dirá si salir ahora o esperar."
      title="Define origen y destino para activar la lectura"
    />
  );
}

function CarRouteLoadingState() {
  return (
    <SectionCard>
      <SectionHeading iconName={appIcons.modules.trayecto} title="Analizando ruta" />
      <PremiumSkeleton borderRadius={appTheme.radii.full} height={14} style={styles.loadingSkeletonTop} width={164} />
      <PremiumSkeleton height={18} style={styles.loadingSkeleton} width="94%" />
      <PremiumSkeleton height={18} style={styles.loadingSkeleton} width="72%" />
    </SectionCard>
  );
}

interface CarRouteErrorStateProps {
  message: string;
  onRetry: () => void;
}

function CarRouteErrorState({ message, onRetry }: CarRouteErrorStateProps) {
  return (
    <ErrorState
      actionLabel="Reintentar análisis"
      body={message}
      onActionPress={onRetry}
      title="No pudimos analizar la ruta"
    />
  );
}

export function TrayectoScreen() {
  const model = useTrayectoScreenModel();

  if (model.mode === 'paseo_local' && model.briefing.status === 'loading') {
    return <WeatherScreenSkeleton cards={3} />;
  }

  if (model.mode === 'paseo_local' && model.briefing.status === 'error') {
    return (
      <AppScreen>
        <ErrorState
          actionLabel="Reintentar"
          body={model.briefing.errorMessage}
          onActionPress={() => void model.briefing.refetch()}
          title="No pudimos preparar tu trayecto local"
        />
      </AppScreen>
    );
  }

  const heroSummary =
    model.mode === 'paseo_local'
      ? model.localAnalysis?.summary ?? 'Configura tu salida para obtener una lectura detallada.'
      : model.carAnalysis?.summary ??
        (model.canAnalyzeRoute
          ? model.routeLoading
            ? 'Analizando condiciones por tramo.'
            : 'Ruta lista para decisión.'
          : 'Selecciona origen y destino para empezar.');

  const heroDecision =
    model.mode === 'paseo_local'
      ? model.localAnalysis?.leaveDecision ?? 'Revisa lluvia, viento y hora de regreso antes de salir.'
      : model.carAnalysis?.leaveDecision ?? 'Sal ahora o espera: te lo diremos aquí.';

  const cityName =
    model.mode === 'paseo_local'
      ? model.briefing.snapshot?.cityName ?? model.carConfig.origin?.cityName ?? 'Tu zona'
      : model.carConfig.origin?.cityName ?? model.briefing.snapshot?.cityName ?? 'Tu zona';
  const heroSubtitle =
    model.mode === 'coche_ruta'
      ? model.carConfig.origin
        ? buildRoutePointSubtitle(model.carConfig.origin)
        : null
      : model.locationSubtitle;

  return (
    <AppScreen>
      {model.briefing.locationPermissionDenied ? (
        <PermissionState
          body="La lectura usa tu última ubicación válida. Activa la ubicación para actualizar la salida."
          title="Ubicación limitada por permisos"
        />
      ) : null}
      {!model.briefing.locationPermissionDenied && model.briefing.offlineMessage ? (
        <OfflineBanner body={model.briefing.offlineMessage} />
      ) : null}
      {model.mode === 'coche_ruta' && model.routeFallbackActive ? (
        <OfflineBanner
          body="Usamos ruta estimada. Revísala antes de salir."
          title="Ruta en modo de respaldo"
        />
      ) : null}
      {model.mode === 'coche_ruta' && model.routeUsingCachedWeather ? (
        <OfflineBanner
          body="Parte del clima usa la última lectura guardada."
          title="Clima de ruta en respaldo"
        />
      ) : null}

      <TrayectoHeroCard
        cityName={cityName}
        decision={heroDecision}
        locationSubtitle={heroSubtitle}
        mode={model.mode}
        summary={heroSummary}
      />

      <ScreenSurface>
        <TrayectoModeSwitchCard mode={model.mode} onChange={model.setMode} />
        {model.mode === 'paseo_local' ? (
          <>
            <TrayectoLocalPlannerCard
              config={model.localConfig}
              onActivityTypeChange={model.setLocalActivityType}
              onDepartureModeChange={model.setLocalDepartureMode}
              onDepartureTimeChange={model.setLocalDepartureTime}
              onDurationChange={model.setLocalDuration}
            />

            {model.localAnalysis ? (
              <TrayectoLocalAnalysisCard analysis={model.localAnalysis} />
            ) : (
              <EmptyState
                body="Ajusta duración, tipo y salida para obtener decisión."
                title="Sin análisis disponible"
              />
            )}
          </>
        ) : (
          <>
            <TrayectoRoutePlannerCard
              carConfig={model.carConfig}
              destinationSearchError={model.destinationSearchError}
              destinationSearchLoading={model.destinationSearchLoading}
              destinationSearchResults={model.destinationSearchResults}
              destinationSearchText={model.destinationSearchText}
              onAddStop={(point) => {
                model.addCarStop(point);
                model.setStopSearchText('');
              }}
              onClearStops={model.clearCarStops}
              onDepartureModeChange={model.setCarDepartureMode}
              onDepartureTimeChange={model.setCarDepartureTime}
              onDestinationSearchTextChange={model.setDestinationSearchText}
              onOriginSearchTextChange={model.setOriginSearchText}
              onRemoveStop={model.removeCarStop}
              onSetDestination={(point) => {
                model.setCarDestination(point);
                model.setDestinationSearchText('');
              }}
              onSetOrigin={(point) => {
                model.setCarOrigin(point);
                model.setOriginSearchText('');
              }}
              onStopSearchTextChange={model.setStopSearchText}
              onSwap={model.swapCarEndpoints}
              originSearchError={model.originSearchError}
              originSearchLoading={model.originSearchLoading}
              originSearchResults={model.originSearchResults}
              originSearchText={model.originSearchText}
              quickPoints={model.quickPoints}
              stopSearchError={model.stopSearchError}
              stopSearchLoading={model.stopSearchLoading}
              stopSearchResults={model.stopSearchResults}
              stopSearchText={model.stopSearchText}
            />

            {!model.canAnalyzeRoute ? <CarRouteEmptyState /> : null}
            {model.canAnalyzeRoute && model.routeLoading ? <CarRouteLoadingState /> : null}
            {model.canAnalyzeRoute && !model.routeLoading && model.routeErrorMessage ? (
              <CarRouteErrorState message={model.routeErrorMessage} onRetry={() => void model.refetchRoute()} />
            ) : null}
            {model.routeReady && model.carAnalysis && model.routePlan ? (
              <>
                <TrayectoRouteSummaryCard analysis={model.carAnalysis} routePlan={model.routePlan} />
                <TrayectoRouteSegmentsCard segments={model.carAnalysis.segments} />
              </>
            ) : null}
          </>
        )}
      </ScreenSurface>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  loadingSkeletonTop: {
    marginTop: appTheme.spacing.sm,
  },
  loadingSkeleton: {
    marginTop: appTheme.spacing.sm,
  },
});
