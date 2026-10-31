import {
  YandexCapability,
  YandexCapabilityAction,
  YandexGroup,
  YandexUserInfoResponse,
} from '../types';

const capabilityInstance = (capability: YandexCapability): string | undefined => {
  if (capability.type === 'devices.capabilities.on_off') return 'on';
  return capability.parameters?.instance ?? capability.state?.instance;
};

const supportsAction = (capability: YandexCapability, action: YandexCapabilityAction): boolean => {
  if (capability.type !== action.type) return false;
  if (action.type === 'devices.capabilities.on_off' || action.type === 'devices.capabilities.color_setting') return true;
  return capabilityInstance(capability) === action.state.instance;
};

export const applyCapabilityActions = (
  capabilities: YandexCapability[],
  actions: YandexCapabilityAction[],
): YandexCapability[] => capabilities.map((capability) => {
  const matchingAction = actions.filter((action) => supportsAction(capability, action)).at(-1);
  if (!matchingAction) return capability;
  return {
    ...capability,
    state: {
      instance: matchingAction.state.instance,
      value: matchingAction.state.value,
    },
    last_updated: Math.floor(Date.now() / 1000),
  };
});

export const applyDeviceActionsToData = (
  data: YandexUserInfoResponse,
  deviceId: string,
  actions: YandexCapabilityAction[],
): YandexUserInfoResponse => ({
  ...data,
  devices: data.devices.map((device) => device.id === deviceId
    ? { ...device, capabilities: applyCapabilityActions(device.capabilities, actions) }
    : device),
});

export const applyGroupActionsToData = (
  data: YandexUserInfoResponse,
  groupId: string,
  actions: YandexCapabilityAction[],
): YandexUserInfoResponse => {
  const group = data.groups.find((item) => item.id === groupId);
  if (!group) return data;
  const deviceIds = new Set(group.devices);
  return {
    ...data,
    groups: data.groups.map((item) => item.id === groupId
      ? { ...item, capabilities: applyCapabilityActions(item.capabilities, actions) }
      : item),
    devices: data.devices.map((device) => deviceIds.has(device.id)
      ? { ...device, capabilities: applyCapabilityActions(device.capabilities, actions) }
      : device),
  };
};

export const mergeFreshGroup = (current: YandexGroup, fresh: YandexGroup): YandexGroup => ({
  ...current,
  ...fresh,
  household_id: fresh.household_id || current.household_id,
  devices: fresh.devices?.length ? fresh.devices : current.devices,
});
