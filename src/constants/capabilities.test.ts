import { describe, expect, it } from 'vitest';
import {
  getCapabilityTypeLabel,
  getControllableCapabilityInstance,
  getInstanceLabel,
  getModeLabel,
  getDeviceCapabilitySummaries,
  isControllableCapability,
} from './capabilities';
import { YandexCapability } from '../types';

const capability = (type: string, instance?: string): YandexCapability => ({
  type,
  retrievable: true,
  reportable: true,
  ...(instance ? { parameters: { instance }, state: { instance, value: false } } : {}),
});

describe('capability metadata', () => {
  it.each(['on_off', 'toggle', 'mode', 'range', 'color_setting'])('recognises %s as controllable', (suffix) => {
    expect(isControllableCapability(capability(`devices.capabilities.${suffix}`))).toBe(true);
  });

  it('does not expose read-only video streams as a generic control', () => {
    expect(isControllableCapability(capability('devices.capabilities.video_stream'))).toBe(false);
  });

  it('normalises the on/off instance', () => {
    expect(getControllableCapabilityInstance(capability('devices.capabilities.on_off'))).toBe('on');
  });

  it('prefers the parameter instance for other capabilities', () => {
    expect(getControllableCapabilityInstance(capability('devices.capabilities.range', 'brightness'))).toBe('brightness');
  });

  it('uses readable Russian labels and a safe fallback', () => {
    expect(getInstanceLabel('controls_locked')).toBe('Блокировка управления');
    expect(getInstanceLabel('custom_value')).toBe('custom value');
    expect(getModeLabel('turbo')).toBe('Турбо');
    expect(getModeLabel('turbo', 'Сверхскорость')).toBe('Сверхскорость');
    expect(getCapabilityTypeLabel('devices.capabilities.color_setting')).toBe('Освещение');
  });

  it('builds compact current-state summaries for cards', () => {
    const summaries = getDeviceCapabilitySummaries({
      id: 'light', name: 'Лампа', type: 'devices.types.light',
      capabilities: [
        { type: 'devices.capabilities.range', retrievable: true, reportable: true, parameters: { instance: 'brightness', unit: 'unit.percent' }, state: { instance: 'brightness', value: 73 } },
        { type: 'devices.capabilities.mode', retrievable: true, reportable: true, parameters: { instance: 'fan_speed' }, state: { instance: 'fan_speed', value: 'turbo' } },
      ],
    });
    expect(summaries).toEqual(['Яркость 73%', 'Скорость вентилятора: Турбо']);
  });
});
