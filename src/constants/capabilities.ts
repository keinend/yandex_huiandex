import { YandexCapability, YandexDevice } from '../types';

export const CONTROLLABLE_CAPABILITY_TYPES = new Set([
  'devices.capabilities.on_off',
  'devices.capabilities.toggle',
  'devices.capabilities.mode',
  'devices.capabilities.range',
  'devices.capabilities.color_setting',
]);

const INSTANCE_LABELS: Record<string, string> = {
  on: 'Питание',
  brightness: 'Яркость',
  channel: 'Канал',
  humidity: 'Влажность',
  open: 'Положение',
  temperature: 'Температура',
  volume: 'Громкость',
  backlight: 'Подсветка',
  controls_locked: 'Блокировка управления',
  ionization: 'Ионизация',
  keep_warm: 'Поддержание тепла',
  mute: 'Без звука',
  oscillation: 'Вращение',
  pause: 'Пауза',
  cleanup_mode: 'Режим уборки',
  coffee_mode: 'Режим кофе',
  dishwashing: 'Программа мойки',
  fan_speed: 'Скорость вентилятора',
  heat: 'Нагрев',
  input_source: 'Источник сигнала',
  program: 'Программа',
  swing: 'Направление воздуха',
  tea_mode: 'Режим чая',
  thermostat: 'Режим климата',
  ventilation_mode: 'Режим вентиляции',
  work_speed: 'Скорость работы',
  temperature_k: 'Температура света',
  scene: 'Световая сцена',
  hsv: 'Цвет',
  rgb: 'Цвет',
};

const MODE_LABELS: Record<string, string> = {
  auto: 'Авто',
  cool: 'Охлаждение',
  dry: 'Осушение',
  fan_only: 'Вентиляция',
  heat: 'Обогрев',
  preheat: 'Преднагрев',
  high: 'Высокая',
  low: 'Низкая',
  medium: 'Средняя',
  quiet: 'Тихая',
  turbo: 'Турбо',
  eco: 'Эко',
  express: 'Быстрая',
  normal: 'Обычная',
  wet_cleaning: 'Влажная уборка',
  dry_cleaning: 'Сухая уборка',
  mixed_cleaning: 'Комбинированная уборка',
  supply_air: 'Приток воздуха',
  extraction_air: 'Вытяжка воздуха',
  night: 'Ночь',
  ocean: 'Океан',
  party: 'Вечеринка',
  reading: 'Чтение',
  rest: 'Отдых',
  romance: 'Романтика',
  siren: 'Сирена',
  jungle: 'Джунгли',
  movie: 'Кино',
  neon: 'Неон',
};

export const isControllableCapability = (capability: YandexCapability): boolean =>
  CONTROLLABLE_CAPABILITY_TYPES.has(capability.type);

export const getControllableCapabilityInstance = (capability: YandexCapability): string => {
  if (capability.type === 'devices.capabilities.on_off') return 'on';
  return capability.parameters?.instance ?? capability.state?.instance ?? 'unknown';
};

export const getInstanceLabel = (instance: string): string =>
  INSTANCE_LABELS[instance] ?? instance.replaceAll('_', ' ');

export const getModeLabel = (value: string, providedName?: string): string =>
  providedName || MODE_LABELS[value] || value.replaceAll('_', ' ');

export const getCapabilityTypeLabel = (type: string): string => {
  const suffix = type.replace('devices.capabilities.', '');
  const labels: Record<string, string> = {
    on_off: 'Питание',
    toggle: 'Переключатель',
    mode: 'Режим',
    range: 'Значение',
    color_setting: 'Освещение',
    video_stream: 'Видеопоток',
  };
  return labels[suffix] ?? suffix.replaceAll('_', ' ');
};

const SUMMARY_UNITS: Record<string, string> = {
  'unit.percent': '%',
  'unit.temperature.celsius': '°C',
  'unit.temperature.kelvin': 'K',
  'unit.volume': '%',
};

export const getDeviceCapabilitySummaries = (device: YandexDevice, limit = 2): string[] => {
  const summaries: string[] = [];
  for (const capability of device.capabilities) {
    if (summaries.length >= limit || !capability.state || capability.type === 'devices.capabilities.on_off') continue;
    const instance = getControllableCapabilityInstance(capability);
    const label = getInstanceLabel(instance);

    if (capability.type === 'devices.capabilities.range' && typeof capability.state.value === 'number') {
      const unit = SUMMARY_UNITS[String(capability.parameters?.unit ?? '')]
        ?? (instance === 'brightness' || instance === 'volume' ? '%' : instance === 'temperature' ? '°C' : '');
      summaries.push(`${label} ${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(capability.state.value)}${unit}`);
    } else if (capability.type === 'devices.capabilities.mode' && typeof capability.state.value === 'string') {
      summaries.push(`${label}: ${getModeLabel(capability.state.value)}`);
    } else if (capability.type === 'devices.capabilities.toggle' && typeof capability.state.value === 'boolean') {
      summaries.push(`${label}: ${capability.state.value ? 'вкл.' : 'выкл.'}`);
    } else if (capability.type === 'devices.capabilities.color_setting') {
      if (capability.state.instance === 'temperature_k' && typeof capability.state.value === 'number') {
        summaries.push(`Свет ${capability.state.value} K`);
      } else if (capability.state.instance === 'scene' && typeof capability.state.value === 'string') {
        summaries.push(`Сцена: ${getModeLabel(capability.state.value)}`);
      }
    }
  }
  return summaries;
};
