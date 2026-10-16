import { StateCard } from '@/src/components/ui/StateCard';

interface EmptyStateProps {
  title: string;
  body: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function EmptyState({ title, body, actionLabel, onActionPress }: EmptyStateProps) {
  return (
    <StateCard
      actionLabel={actionLabel}
      body={body}
      iconName="weather-cloudy-alert"
      onActionPress={onActionPress}
      title={title}
      tone="default"
    />
  );
}
