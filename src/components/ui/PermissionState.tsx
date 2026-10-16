import { StateCard } from '@/src/components/ui/StateCard';

interface PermissionStateProps {
  title: string;
  body: string;
  actionLabel?: string;
  onActionPress?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
}

export function PermissionState({
  title,
  body,
  actionLabel,
  onActionPress,
  secondaryActionLabel,
  onSecondaryActionPress,
}: PermissionStateProps) {
  return (
    <StateCard
      actionLabel={actionLabel}
      body={body}
      iconName="shield-alert-outline"
      onActionPress={onActionPress}
      onSecondaryActionPress={onSecondaryActionPress}
      secondaryActionLabel={secondaryActionLabel}
      title={title}
      tone="warning"
    />
  );
}
