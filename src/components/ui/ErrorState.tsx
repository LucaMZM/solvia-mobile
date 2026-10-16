import { StateCard } from '@/src/components/ui/StateCard';

interface ErrorStateProps {
  title: string;
  body: string;
  actionLabel?: string;
  onActionPress?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
}

export function ErrorState({
  title,
  body,
  actionLabel,
  onActionPress,
  secondaryActionLabel,
  onSecondaryActionPress,
}: ErrorStateProps) {
  return (
    <StateCard
      actionLabel={actionLabel}
      body={body}
      iconName="alert-circle-outline"
      onActionPress={onActionPress}
      onSecondaryActionPress={onSecondaryActionPress}
      secondaryActionLabel={secondaryActionLabel}
      title={title}
      tone="danger"
    />
  );
}
