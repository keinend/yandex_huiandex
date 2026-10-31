import { describe, expect, it } from 'vitest';
import { applyCapabilityActions, applyDeviceActionsToData, applyGroupActionsToData } from './capabilityState';
import { YandexCapability, YandexUserInfoResponse } from '../types';

const onOff = (value: boolean): YandexCapability => ({
  type: 'devices.capabilities.on_off', retrievable: true, reportable: true,
  state: { instance: 'on', value },
});

const range = (instance: string, value: number): YandexCapability => ({
  type: 'devices.capabilities.range', retrievable: true, reportable: true,
  parameters: { instance, random_access: true, range: { min: 0, max: 100 } },
  state: { instance, value },
});

const data: YandexUserInfoResponse = {
  status: 'ok', request_id: 'test', households: [{ id: 'home', name: 'Дом' }], rooms: [], scenarios: [],
  groups: [{ id: 'group', name: 'Свет', household_id: 'home', devices: ['light', 'sensor'], capabilities: [onOff(false)] }],
  devices: [
    { id: 'light', name: 'Лампа', type: 'devices.types.light', capabilities: [onOff(false), range('brightness', 40)] },
    { id: 'sensor', name: 'Датчик', type: 'devices.types.sensor', capabilities: [] },
  ],
};

describe('optimistic capability state', () => {
  it('updates a matching capability without mutating the source', () => {
    const updated = applyCapabilityActions(data.devices[0].capabilities, [{ type: 'devices.capabilities.on_off', state: { instance: 'on', value: true } }]);
    expect(updated[0].state?.value).toBe(true);
    expect(data.devices[0].capabilities[0].state?.value).toBe(false);
  });

  it('updates only the requested device', () => {
    const updated = applyDeviceActionsToData(data, 'light', [{ type: 'devices.capabilities.range', state: { instance: 'brightness', value: 75 } }]);
    expect(updated.devices[0].capabilities[1].state?.value).toBe(75);
    expect(updated.devices[1]).toBe(data.devices[1]);
  });

  it('updates a group and only compatible member capabilities', () => {
    const updated = applyGroupActionsToData(data, 'group', [{ type: 'devices.capabilities.on_off', state: { instance: 'on', value: true } }]);
    expect(updated.groups[0].capabilities[0].state?.value).toBe(true);
    expect(updated.devices[0].capabilities[0].state?.value).toBe(true);
    expect(updated.devices[1].capabilities).toEqual([]);
  });
});
