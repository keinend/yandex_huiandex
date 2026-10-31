export interface YandexScenarioStep {
  parameters?: {
    items?: Array<{ id: string }>;
  };
}

export interface YandexScenario {
  id: string;
  name: string;
  is_active: boolean;
  icon?: string;
  steps?: YandexScenarioStep[];
}

export interface YandexModeAction {
  instance: string;
  value: YandexStateValue;
  type?: string;
  relative?: boolean;
}

export type YandexStateValue = boolean | number | string | Record<string, unknown>;

export interface YandexCapabilityActionState {
  instance: string;
  value: YandexStateValue;
  relative?: boolean;
}

export interface YandexCapabilityAction {
  type: string;
  state: YandexCapabilityActionState;
}

export interface YandexCapabilityState {
  instance: string;
  value: YandexStateValue;
}

export interface YandexModeOption {
  value: string;
  name?: string;
}

export interface YandexRangeParameters {
  min?: number;
  max?: number;
  precision?: number;
}

export interface YandexColorScene {
  id?: string;
  value?: string;
  name?: string;
}

export interface YandexCapabilityParameters {
  instance?: string;
  unit?: string;
  random_access?: boolean;
  range?: YandexRangeParameters;
  modes?: YandexModeOption[];
  color_model?: 'hsv' | 'rgb' | string;
  temperature_k?: YandexRangeParameters;
  color_scene?: { scenes?: YandexColorScene[] };
  split?: boolean;
  [key: string]: unknown;
}

/** Backward-compatible narrower shape used by the existing climate modals. */
export interface YandexModeCapabilityParameters extends YandexCapabilityParameters {
  instance: string;
  modes: YandexModeOption[];
}

export interface YandexCapability {
  type: string;
  retrievable: boolean;
  reportable: boolean;
  state?: YandexCapabilityState;
  parameters?: YandexCapabilityParameters;
  last_updated?: number;
}

export interface YandexPropertyState {
  instance: string;
  value: boolean | number | string;
  unit?: string;
}

export interface YandexPropertyEvent {
  value: string;
  name: string;
}

export interface YandexPropertyParameters {
  instance: string;
  unit?: string;
  events?: YandexPropertyEvent[];
}

export interface YandexProperty {
  type: string;
  retrievable: boolean;
  reportable: boolean;
  parameters?: YandexPropertyParameters;
  state?: YandexPropertyState;
}

export interface YandexDevice {
  id: string;
  name: string;
  type: string;
  description?: string;
  household_id?: string;
  aliases?: string[];
  external_id?: string;
  skill_id?: string;
  room?: string;
  groups?: string[];
  capabilities: YandexCapability[];
  properties?: YandexProperty[];
  device_info?: {
    manufacturer?: string;
    model?: string;
    hw_version?: string;
    sw_version?: string;
  };
}

export interface YandexGroup {
  id: string;
  name: string;
  household_id: string;
  devices: string[];
  capabilities: YandexCapability[];
}

export interface YandexRoom {
  id: string;
  name: string;
  household_id: string;
  devices: string[]; 
}

export interface YandexHousehold {
  id: string;
  name: string;
  location?: unknown;
}

export interface YandexUserInfoResponse {
  status: string;
  request_id: string;
  rooms: YandexRoom[];
  groups: YandexGroup[];
  devices: YandexDevice[];
  scenarios: YandexScenario[];
  households: YandexHousehold[];
}

export interface YandexWebRtcRoom {
  serviceUrl: string;
  serviceName: string;
  roomId: string;
  participantId: string;
  credentials: string;
}

export interface CameraStreamResult {
  protocol: string;
  streamUrl?: string;
  webrtc?: YandexWebRtcRoom;
}

export enum AppState {
  AUTH = 'AUTH',
  LOADING = 'LOADING',
  DASHBOARD = 'DASHBOARD',
  ERROR = 'ERROR'
}

export type TrayItemType = 'device' | 'group' | 'scenario';

export interface TrayMenuItem {
    id: string;
    name: string;
    type: TrayItemType;
    isToggleable?: boolean; 
    isOn?: boolean;
    sensorValue?: string | null;
}
