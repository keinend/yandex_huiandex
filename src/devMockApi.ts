import { IYandexApi } from './types/electron-api';
import { YandexCapabilityAction, YandexDevice, YandexUserInfoResponse } from './types';

const data: YandexUserInfoResponse = {
  status: 'ok',
  request_id: 'local-preview',
  households: [
    { id: 'home-main', name: 'Квартира' },
    { id: 'home-country', name: 'Дача' },
  ],
  rooms: [
    { id: 'room-living', name: 'Гостиная', household_id: 'home-main', devices: ['light-main', 'thermostat', 'camera'] },
    { id: 'room-bedroom', name: 'Спальня', household_id: 'home-main', devices: ['lamp-bed', 'sensor'] },
    { id: 'room-kitchen', name: 'Кухня', household_id: 'home-main', devices: ['kettle', 'socket'] },
    { id: 'room-country', name: 'Терраса', household_id: 'home-country', devices: ['country-light'] },
  ],
  groups: [
    {
      id: 'group-lights',
      name: 'Весь свет',
      household_id: 'home-main',
      devices: ['light-main', 'lamp-bed'],
      capabilities: [
        { type: 'devices.capabilities.on_off', retrievable: true, reportable: true, state: { instance: 'on', value: true } },
        { type: 'devices.capabilities.range', retrievable: true, reportable: true, parameters: { instance: 'brightness', random_access: true, range: { min: 1, max: 100, precision: 1 } }, state: { instance: 'brightness', value: 72 } },
      ],
    },
  ],
  devices: [
    {
      id: 'light-main', name: 'Люстра', type: 'devices.types.light', description: 'Основной свет', household_id: 'home-main', room: 'room-living', groups: ['group-lights'], aliases: ['Большой свет'],
      device_info: { manufacturer: 'Yandex', model: 'YNDX-00501', sw_version: '1.4.8' },
      capabilities: [
        { type: 'devices.capabilities.on_off', retrievable: true, reportable: true, state: { instance: 'on', value: true } },
        { type: 'devices.capabilities.range', retrievable: true, reportable: true, parameters: { instance: 'brightness', unit: 'unit.percent', random_access: true, range: { min: 1, max: 100, precision: 1 } }, state: { instance: 'brightness', value: 72 } },
        { type: 'devices.capabilities.color_setting', retrievable: true, reportable: true, parameters: { color_model: 'hsv', temperature_k: { min: 2700, max: 6500 }, color_scene: { scenes: [{ id: 'sunset', value: 'sunset', name: 'Закат' }, { id: 'party', value: 'party', name: 'Вечеринка' }] } }, state: { instance: 'temperature_k', value: 4300 } },
      ], properties: [],
    },
    {
      id: 'lamp-bed', name: 'Ночник', type: 'devices.types.light', household_id: 'home-main', room: 'room-bedroom', groups: ['group-lights'],
      capabilities: [
        { type: 'devices.capabilities.on_off', retrievable: true, reportable: true, state: { instance: 'on', value: false } },
        { type: 'devices.capabilities.range', retrievable: true, reportable: true, parameters: { instance: 'brightness', random_access: true, range: { min: 1, max: 100, precision: 1 } }, state: { instance: 'brightness', value: 28 } },
      ], properties: [],
    },
    {
      id: 'thermostat', name: 'Термостат', type: 'devices.types.thermostat', household_id: 'home-main', room: 'room-living',
      capabilities: [
        { type: 'devices.capabilities.on_off', retrievable: true, reportable: true, state: { instance: 'on', value: true } },
        { type: 'devices.capabilities.range', retrievable: true, reportable: true, parameters: { instance: 'temperature', unit: 'unit.temperature.celsius', random_access: true, range: { min: 16, max: 30, precision: 0.5 } }, state: { instance: 'temperature', value: 23.5 } },
        { type: 'devices.capabilities.mode', retrievable: true, reportable: true, parameters: { instance: 'thermostat', modes: [{ value: 'auto', name: 'Авто' }, { value: 'heat', name: 'Нагрев' }, { value: 'cool', name: 'Охлаждение' }] }, state: { instance: 'thermostat', value: 'auto' } },
      ], properties: [{ type: 'devices.properties.float', retrievable: true, reportable: true, parameters: { instance: 'temperature', unit: 'unit.temperature.celsius' }, state: { instance: 'temperature', value: 22.8, unit: 'unit.temperature.celsius' } }],
    },
    {
      id: 'sensor', name: 'Датчик климата', type: 'devices.types.sensor.climate', household_id: 'home-main', room: 'room-bedroom', capabilities: [],
      properties: [
        { type: 'devices.properties.float', retrievable: true, reportable: true, parameters: { instance: 'temperature', unit: 'unit.temperature.celsius' }, state: { instance: 'temperature', value: 22.4 } },
        { type: 'devices.properties.float', retrievable: true, reportable: true, parameters: { instance: 'humidity', unit: 'unit.percent' }, state: { instance: 'humidity', value: 46 } },
        { type: 'devices.properties.float', retrievable: true, reportable: true, parameters: { instance: 'battery_level', unit: 'unit.percent' }, state: { instance: 'battery_level', value: 87 } },
      ],
    },
    {
      id: 'kettle', name: 'Чайник', type: 'devices.types.cooking.kettle', household_id: 'home-main', room: 'room-kitchen',
      capabilities: [
        { type: 'devices.capabilities.on_off', retrievable: true, reportable: true, state: { instance: 'on', value: false } },
        { type: 'devices.capabilities.range', retrievable: true, reportable: true, parameters: { instance: 'temperature', unit: 'unit.temperature.celsius', random_access: true, range: { min: 40, max: 100, precision: 5 } }, state: { instance: 'temperature', value: 85 } },
        { type: 'devices.capabilities.toggle', retrievable: true, reportable: true, parameters: { instance: 'keep_warm' }, state: { instance: 'keep_warm', value: true } },
      ], properties: [],
    },
    {
      id: 'socket', name: 'Розетка', type: 'devices.types.socket', household_id: 'home-main', room: 'room-kitchen',
      capabilities: [
        { type: 'devices.capabilities.on_off', retrievable: true, reportable: true, state: { instance: 'on', value: true } },
        { type: 'devices.capabilities.toggle', retrievable: true, reportable: true, parameters: { instance: 'controls_locked' }, state: { instance: 'controls_locked', value: false } },
      ], properties: [{ type: 'devices.properties.float', retrievable: true, reportable: true, parameters: { instance: 'electricity_meter', unit: 'unit.kilowatt_hour' }, state: { instance: 'electricity_meter', value: 13.7 } }],
    },
    {
      id: 'camera', name: 'Камера', type: 'devices.types.camera', household_id: 'home-main', room: 'room-living',
      capabilities: [
        { type: 'devices.capabilities.video_stream', retrievable: false, reportable: false },
        { type: 'devices.capabilities.toggle', retrievable: true, reportable: true, parameters: { instance: 'mute' }, state: { instance: 'mute', value: false } },
      ], properties: [],
    },
    {
      id: 'country-light', name: 'Подсветка террасы', type: 'devices.types.light', household_id: 'home-country', room: 'room-country',
      capabilities: [{ type: 'devices.capabilities.on_off', retrievable: true, reportable: true, state: { instance: 'on', value: false } }], properties: [],
    },
  ],
  scenarios: [
    { id: 'scenario-morning', name: 'Доброе утро', is_active: true },
    { id: 'scenario-cinema', name: 'Кино', is_active: true },
    { id: 'scenario-away', name: 'Ухожу из дома', is_active: true },
  ],
};

const applyActions = (target: { capabilities: YandexDevice['capabilities'] }, actions: YandexCapabilityAction[]) => {
  actions.forEach((action) => {
    const capability = target.capabilities.find((item) => item.type === action.type && (item.state?.instance ?? item.parameters?.instance) === action.state.instance);
    if (capability) capability.state = { instance: action.state.instance, value: action.state.value };
  });
};

const applyGroupActions = (groupId: string, actions: YandexCapabilityAction[]) => {
  const group = data.groups.find((item) => item.id === groupId);
  if (!group) return;
  applyActions(group, actions);
  data.devices.filter((device) => group.devices.includes(device.id)).forEach((device) => applyActions(device, actions));
};

let autostartEnabled = false;
const mockMode = new URLSearchParams(window.location.search).get('mock');
const mockNetworkDelay = (milliseconds = 280) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const failActionWhenRequested = () => {
  if (mockMode === 'error') throw new Error('Устройство отклонило тестовую команду');
};

const api: IYandexApi = {
  fetchUserInfo: async () => structuredClone(data),
  fetchDevice: async (_token, deviceId) => { await mockNetworkDelay(180); return structuredClone(data.devices.find((device) => device.id === deviceId) ?? data.devices[0]); },
  fetchGroup: async (_token, groupId) => { await mockNetworkDelay(180); return structuredClone(data.groups.find((group) => group.id === groupId) ?? data.groups[0]); },
  executeScenario: async () => { await mockNetworkDelay(); },
  toggleDevice: async (_token, deviceId, newState) => {
    await mockNetworkDelay();
    failActionWhenRequested();
    const device = data.devices.find((item) => item.id === deviceId);
    if (device) applyActions(device, [{ type: 'devices.capabilities.on_off', state: { instance: 'on', value: newState } }]);
  },
  toggleGroup: async (_token, groupId, _deviceIds, newState) => {
    await mockNetworkDelay();
    failActionWhenRequested();
    applyGroupActions(groupId, [{ type: 'devices.capabilities.on_off', state: { instance: 'on', value: newState } }]);
  },
  setDeviceMode: async (_token, deviceId, actions) => {
    await mockNetworkDelay();
    failActionWhenRequested();
    const device = data.devices.find((item) => item.id === deviceId);
    if (device) applyActions(device, actions.map((action) => ({ type: action.type ?? 'devices.capabilities.mode', state: { instance: action.instance, value: action.value, relative: action.relative } })));
  },
  setDeviceActions: async (_token, deviceId, actions) => {
    await mockNetworkDelay();
    failActionWhenRequested();
    const device = data.devices.find((item) => item.id === deviceId);
    if (device) applyActions(device, actions);
  },
  setGroupActions: async (_token, groupId, actions) => {
    await mockNetworkDelay();
    failActionWhenRequested();
    applyGroupActions(groupId, actions);
  },
  deleteDevice: async (_token, deviceId) => {
    data.devices = data.devices.filter((device) => device.id !== deviceId);
    data.rooms.forEach((room) => { room.devices = room.devices.filter((id) => id !== deviceId); });
    data.groups.forEach((group) => { group.devices = group.devices.filter((id) => id !== deviceId); });
  },
  getCameraStream: async () => ({ protocol: 'hls', streamUrl: '' }),
  setCameraPrivacyMode: async () => undefined,
  getQuasarCameraDevice: async (_deviceId) => structuredClone(data.devices.find((device) => device.id === 'camera') ?? data.devices[0]),
  getSecureToken: async () => mockMode === 'auth' ? null : 'preview-token',
  setSecureToken: async () => undefined,
  deleteSecureToken: async () => undefined,
  hasXToken: async () => true,
  startQrAuth: async () => ({ qrUrl: '', qrDataUrl: '' }),
  pollQrAuth: async () => ({ status: 'pending' }),
  cancelQrAuth: async () => undefined,
  isAutostartEnabled: async () => autostartEnabled,
  setAutostartEnabled: async (enabled) => (autostartEnabled = enabled),
  sendFavoritesToTray: () => undefined,
  onTrayCommand: () => undefined,
  removeTrayCommandListener: () => undefined,
  onRetryAttempt: () => () => undefined,
  showCameraStreamErrorNotification: async () => true,
  onCameraStreamRetry: () => () => undefined,
};

window.api = api;
