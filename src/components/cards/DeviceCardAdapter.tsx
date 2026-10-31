import React from 'react';
import { isSensorDevice } from '../../constants';
import { SensorCard } from './SensorCard';
import { DeviceCard, DeviceCardProps } from './DeviceCard';
import { useDashboardContext } from '../../contexts/DashboardContext';

export const DeviceCardAdapter: React.FC<DeviceCardProps> = (props) => {
  const ctx = useDashboardContext();
  const isPending = ctx.isActionPending('device', props.device.id);
  return isSensorDevice(props.device)
    ? <SensorCard {...props} isPending={isPending} />
    : <DeviceCard {...props} isPending={isPending} />;
};
