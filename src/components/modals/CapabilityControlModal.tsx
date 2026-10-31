import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  YandexCapability,
  YandexCapabilityAction,
  YandexDevice,
  YandexGroup,
  YandexStateValue,
} from '../../types';
import {
  getControllableCapabilityInstance,
  getCapabilityTypeLabel,
  getInstanceLabel,
  getModeLabel,
  isControllableCapability,
  localizeUnit,
} from '../../constants';
import { hsvToRgb, rgbToHsv } from '../../utils/colorConverter';

type CapabilityEntity = YandexDevice | YandexGroup;

interface CapabilityControlModalProps {
  entity: CapabilityEntity;
  kind: 'device' | 'group';
  isOpen: boolean;
  onClose: () => void;
  onApply: (actions: YandexCapabilityAction[]) => Promise<void>;
  onDelete?: () => Promise<void>;
  onRefresh?: (id: string) => Promise<unknown>;
}

const UNIT_FALLBACKS: Record<string, string> = {
  brightness: '%',
  humidity: '%',
  open: '%',
  temperature: '°C',
  temperature_k: 'K',
  volume: '%',
};

const keyFor = (capability: YandexCapability, index: number, instance = getControllableCapabilityInstance(capability)) =>
  `${index}:${capability.type}:${instance}`;

const numberFromState = (value: YandexStateValue | undefined, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const rgbNumberToHex = (rgb: number): string => `#${Math.max(0, Math.min(0xffffff, rgb)).toString(16).padStart(6, '0')}`;

const initialColorHex = (capability: YandexCapability): string => {
  if (capability.state?.instance === 'rgb' && typeof capability.state.value === 'number') {
    return rgbNumberToHex(capability.state.value);
  }
  if (capability.state?.instance === 'hsv' && capability.state.value && typeof capability.state.value === 'object') {
    const hsv = capability.state.value as { h?: number; s?: number; v?: number };
    return rgbNumberToHex(hsvToRgb(hsv.h ?? 260, hsv.s ?? 75, hsv.v ?? 100));
  }
  return '#6d5dfc';
};

const formatPropertyValue = (value: unknown): string => {
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (typeof value === 'number') return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);
  if (value === null || value === undefined || value === '') return 'Нет данных';
  return String(value);
};

export const CapabilityControlModal: React.FC<CapabilityControlModalProps> = ({
  entity,
  kind,
  isOpen,
  onClose,
  onApply,
  onDelete,
  onRefresh,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [draft, setDraft] = useState<Record<string, YandexStateValue>>({});
  const [colorDraft, setColorDraft] = useState<Record<string, string>>({});
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isRefreshingEntity, setIsRefreshingEntity] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const refreshedKeyRef = useRef<string | null>(null);

  const capabilities = useMemo(
    () => entity.capabilities.filter(isControllableCapability),
    [entity.capabilities],
  );

  useEffect(() => {
    if (!isOpen) return;
    const nextDraft: Record<string, YandexStateValue> = {};
    const nextColors: Record<string, string> = {};

    capabilities.forEach((capability, index) => {
      const instance = getControllableCapabilityInstance(capability);
      const params = capability.parameters;
      const fallback = capability.type === 'devices.capabilities.mode'
        ? params?.modes?.[0]?.value ?? ''
        : capability.type === 'devices.capabilities.range'
          ? params?.range?.min ?? 0
          : false;
      nextDraft[keyFor(capability, index, instance)] = capability.state?.value ?? fallback;

      if (capability.type === 'devices.capabilities.color_setting') {
        nextColors[keyFor(capability, index, 'color')] = initialColorHex(capability);
        nextDraft[keyFor(capability, index, 'temperature_k')] =
          capability.state?.instance === 'temperature_k'
            ? capability.state.value
            : params?.temperature_k?.min ?? 2700;
        const scenes = params?.color_scene?.scenes ?? [];
        const currentScene = capability.state?.instance === 'scene' && typeof capability.state.value === 'string'
          ? capability.state.value
          : scenes[0]?.id ?? scenes[0]?.value ?? '';
        nextDraft[keyFor(capability, index, 'scene')] = currentScene;
      }
    });

    setDraft(nextDraft);
    setColorDraft(nextColors);
    setDirtyKeys(new Set());
    setError(null);
    setDetailsOpen(false);
    setDeleteStep(false);
    setDeleteConfirmation('');
  }, [capabilities, entity.id, isOpen]);

  const refreshEntity = async () => {
    if (!onRefresh || isRefreshingEntity || isSaving) return;
    setIsRefreshingEntity(true);
    setError(null);
    try {
      await onRefresh(entity.id);
      setLastSyncedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить состояние');
    } finally {
      setIsRefreshingEntity(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      refreshedKeyRef.current = null;
      return;
    }
    const key = `${kind}:${entity.id}`;
    if (!onRefresh || refreshedKeyRef.current === key) return;
    refreshedKeyRef.current = key;
    void refreshEntity();
  // refreshEntity intentionally reads the latest entity but should run once per modal opening.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity.id, isOpen, kind, onRefresh]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const background = document.querySelector<HTMLElement>('.body');
    const backgroundWasInert = background?.hasAttribute('inert') ?? false;
    background?.setAttribute('inert', '');
    requestAnimationFrame(() => closeButtonRef.current?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]',
      )) as HTMLElement[];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (!backgroundWasInert) background?.removeAttribute('inert');
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const controlsDisabled = isSaving || isRefreshingEntity;

  const setValue = (key: string, value: YandexStateValue) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirtyKeys((current) => new Set(current).add(key));
    setError(null);
  };

  const setColor = (key: string, value: string) => {
    setColorDraft((current) => ({ ...current, [key]: value }));
    setDirtyKeys((current) => new Set(current).add(key));
    setError(null);
  };

  const submitActions = async (actions: YandexCapabilityAction[], closeAfterSave = false) => {
    if (actions.length === 0 || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onApply(actions);
      setDirtyKeys(new Set());
      if (closeAfterSave) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось применить настройки');
    } finally {
      setIsSaving(false);
    }
  };

  const buildActions = (): YandexCapabilityAction[] => {
    const actions: YandexCapabilityAction[] = [];
    capabilities.forEach((capability, index) => {
      if (capability.type === 'devices.capabilities.color_setting') {
        const colorKey = keyFor(capability, index, 'color');
        const temperatureKey = keyFor(capability, index, 'temperature_k');
        const sceneKey = keyFor(capability, index, 'scene');

        if (dirtyKeys.has(colorKey)) {
          const hex = colorDraft[colorKey] ?? '#6d5dfc';
          const rgb = Number.parseInt(hex.slice(1), 16);
          const isRgb = capability.parameters?.color_model === 'rgb';
          actions.push({
            type: capability.type,
            state: { instance: isRgb ? 'rgb' : 'hsv', value: isRgb ? rgb : rgbToHsv(rgb) },
          });
        }
        if (dirtyKeys.has(temperatureKey)) {
          actions.push({
            type: capability.type,
            state: { instance: 'temperature_k', value: Number(draft[temperatureKey]) },
          });
        }
        if (dirtyKeys.has(sceneKey) && draft[sceneKey]) {
          actions.push({
            type: capability.type,
            state: { instance: 'scene', value: String(draft[sceneKey]) },
          });
        }
        return;
      }

      const instance = getControllableCapabilityInstance(capability);
      const key = keyFor(capability, index, instance);
      if (!dirtyKeys.has(key)) return;
      actions.push({
        type: capability.type,
        state: { instance, value: draft[key] },
      });
    });
    return actions;
  };

  const handleSave = () => submitActions(buildActions(), true);

  const handleRelativeRange = async (capability: YandexCapability, amount: number) => {
    const instance = getControllableCapabilityInstance(capability);
    await submitActions([{ type: capability.type, state: { instance, value: amount, relative: true } }]);
  };

  const handleDelete = async () => {
    if (!onDelete || deleteConfirmation !== entity.name || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить устройство');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCapability = (capability: YandexCapability, index: number) => {
    const instance = getControllableCapabilityInstance(capability);
    const key = keyFor(capability, index, instance);
    const label = getInstanceLabel(instance === 'unknown' ? getCapabilityTypeLabel(capability.type) : instance);
    const params = capability.parameters;

    if (capability.type === 'devices.capabilities.on_off' || capability.type === 'devices.capabilities.toggle') {
      const checked = Boolean(draft[key]);
      return (
        <label className="capability-switch-row" key={key}>
          <span>
            <strong>{label}</strong>
            <small>{checked ? 'Включено' : 'Выключено'}</small>
          </span>
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setValue(key, event.target.checked)}
          />
          <span className="switch-track" aria-hidden="true"><span /></span>
        </label>
      );
    }

    if (capability.type === 'devices.capabilities.mode') {
      const modes = params?.modes ?? [];
      return (
        <label className="capability-field" key={key}>
          <span>{label}</span>
          <select value={String(draft[key] ?? '')} onChange={(event) => setValue(key, event.target.value)}>
            {modes.map((mode) => (
              <option key={mode.value} value={mode.value}>{getModeLabel(mode.value, mode.name)}</option>
            ))}
          </select>
        </label>
      );
    }

    if (capability.type === 'devices.capabilities.range') {
      const range = params?.range ?? {};
      const min = range.min ?? 0;
      const max = range.max ?? 100;
      const step = range.precision ?? 1;
      const current = numberFromState(draft[key], min);
      const unit = localizeUnit(params?.unit).trim() || UNIT_FALLBACKS[instance] || '';

      if (params?.random_access === false) {
        return (
          <div className="capability-field" key={key}>
            <span>{label}</span>
            <div className="relative-stepper" aria-label={label}>
              <button type="button" onClick={() => handleRelativeRange(capability, -step)} disabled={controlsDisabled} aria-label={`Уменьшить: ${label}`}>
                <Minus aria-hidden="true" />
              </button>
              <span>Шаг {step}{unit}</span>
              <button type="button" onClick={() => handleRelativeRange(capability, step)} disabled={controlsDisabled} aria-label={`Увеличить: ${label}`}>
                <Plus aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      }

      return (
        <label className="capability-field capability-range-field" key={key}>
          <span>{label}</span>
          <output>{current}{unit}</output>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={current}
            onChange={(event) => setValue(key, Number(event.target.value))}
          />
          <input
            className="capability-number-input"
            type="number"
            min={min}
            max={max}
            step={step}
            value={current}
            onChange={(event) => setValue(key, Number(event.target.value))}
            aria-label={`${label}, точное значение`}
          />
        </label>
      );
    }

    if (capability.type === 'devices.capabilities.color_setting') {
      const colorKey = keyFor(capability, index, 'color');
      const temperatureKey = keyFor(capability, index, 'temperature_k');
      const sceneKey = keyFor(capability, index, 'scene');
      const temperature = params?.temperature_k;
      const scenes = params?.color_scene?.scenes ?? [];
      const temperatureValue = numberFromState(draft[temperatureKey], temperature?.min ?? 2700);

      return (
        <fieldset className="capability-color-group" key={key}>
          <legend>Освещение</legend>
          {params?.color_model && (
            <label className="capability-field capability-color-field">
              <span>Цвет</span>
              <input
                type="color"
                value={colorDraft[colorKey] ?? '#6d5dfc'}
                onChange={(event) => setColor(colorKey, event.target.value)}
              />
              <code>{(colorDraft[colorKey] ?? '#6d5dfc').toUpperCase()}</code>
            </label>
          )}
          {temperature && (
            <label className="capability-field capability-range-field">
              <span>Температура света</span>
              <output>{temperatureValue} K</output>
              <input
                type="range"
                min={temperature.min ?? 1700}
                max={temperature.max ?? 6500}
                step={temperature.precision ?? 100}
                value={temperatureValue}
                onChange={(event) => setValue(temperatureKey, Number(event.target.value))}
              />
              <span className="range-hints"><span>Теплее</span><span>Холоднее</span></span>
            </label>
          )}
          {scenes.length > 0 && (
            <label className="capability-field">
              <span>Световая сцена</span>
              <select value={String(draft[sceneKey] ?? '')} onChange={(event) => setValue(sceneKey, event.target.value)}>
                {scenes.map((scene, sceneIndex) => {
                  const value = scene.id ?? scene.value ?? String(sceneIndex);
                  return <option key={value} value={value}>{getModeLabel(value, scene.name)}</option>;
                })}
              </select>
            </label>
          )}
        </fieldset>
      );
    }

    return null;
  };

  const device = kind === 'device' ? entity as YandexDevice : null;
  const properties = device?.properties ?? [];

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className="capability-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="capability-modal-title"
        aria-describedby="capability-modal-description"
      >
        <header className="capability-modal-header">
          <div className="capability-modal-title-wrap">
            <span className="capability-modal-icon" aria-hidden="true"><SlidersHorizontal /></span>
            <div>
              <p>{kind === 'device' ? 'Управление устройством' : 'Управление группой'}</p>
              <h2 id="capability-modal-title">{entity.name}</h2>
            </div>
          </div>
          <div className="capability-modal-header-actions">
            {onRefresh && (
              <button type="button" className="icon-button" onClick={() => void refreshEntity()} disabled={controlsDisabled} aria-label={`Обновить состояние ${kind === 'device' ? 'устройства' : 'группы'}`} title="Получить актуальное состояние">
                <RefreshCw className={isRefreshingEntity ? 'spin' : ''} aria-hidden="true" />
              </button>
            )}
            <button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="Закрыть настройки">
              <X aria-hidden="true" />
            </button>
          </div>
        </header>

        <p id="capability-modal-description" className="capability-modal-description">
          {kind === 'device'
            ? 'Доступные элементы управления сформированы из умений, которые устройство передало Яндексу.'
            : 'Доступные элементы управления сформированы из умений, которые группа передала Яндексу.'}
          <span className="capability-sync-status" role="status">
            {isRefreshingEntity ? 'Получаю актуальное состояние…' : lastSyncedAt ? `Синхронизировано в ${lastSyncedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : `${capabilities.length} элементов управления`}
          </span>
        </p>

        <div className="capability-modal-body">
          {capabilities.length > 0 ? (
            <fieldset className="capability-control-list" aria-label="Умения устройства" disabled={controlsDisabled}>
              {capabilities.map(renderCapability)}
            </fieldset>
          ) : (
            <div className="capability-empty-state">
              <Info aria-hidden="true" />
              <strong>Нет доступных элементов управления</strong>
              <p>Устройство передаёт только показания или управляется через приложение производителя.</p>
            </div>
          )}

          <section className="capability-details">
            <button type="button" className="details-toggle" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}>
              <span><Info aria-hidden="true" /> Состояние и сведения</span>
              {detailsOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
            </button>
            {detailsOpen && (
              <div className="details-content">
                {properties.length > 0 && (
                  <dl className="property-list">
                    {properties.map((property, index) => {
                      const instance = property.parameters?.instance ?? property.state?.instance ?? `property-${index}`;
                      const unit = localizeUnit(property.parameters?.unit ?? property.state?.unit).trim();
                      return (
                        <div key={`${instance}-${index}`}>
                          <dt>{getInstanceLabel(instance)}</dt>
                          <dd>{formatPropertyValue(property.state?.value)}{unit ? ` ${unit}` : ''}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {device?.device_info && (
                  <dl className="property-list device-meta-list">
                    {device.device_info.manufacturer && <div><dt>Производитель</dt><dd>{device.device_info.manufacturer}</dd></div>}
                    {device.device_info.model && <div><dt>Модель</dt><dd>{device.device_info.model}</dd></div>}
                    {device.device_info.sw_version && <div><dt>Версия ПО</dt><dd>{device.device_info.sw_version}</dd></div>}
                  </dl>
                )}
                <p className="technical-id">ID: <code>{entity.id}</code></p>
              </div>
            )}
          </section>

          {kind === 'device' && onDelete && (
            <section className="danger-zone">
              {!deleteStep ? (
                <button type="button" className="danger-link" onClick={() => setDeleteStep(true)}>
                  <Trash2 aria-hidden="true" /> Удалить устройство из Яндекса
                </button>
              ) : (
                <div className="delete-confirmation">
                  <strong>Удалить «{entity.name}»?</strong>
                  <p>Устройство исчезнет из Яндекс Умного дома. Для возврата может потребоваться повторное подключение через производителя.</p>
                  <label>
                    Введите название устройства для подтверждения
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(event) => setDeleteConfirmation(event.target.value)}
                      autoComplete="off"
                    />
                  </label>
                  <div>
                    <button type="button" className="secondary-button" onClick={() => { setDeleteStep(false); setDeleteConfirmation(''); }}>Отменить удаление</button>
                    <button type="button" className="danger-button" onClick={handleDelete} disabled={deleteConfirmation !== entity.name || controlsDisabled}>Удалить устройство</button>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {error && <div className="modal-error" role="alert">{error}</div>}

        <footer className="capability-modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>Закрыть</button>
          <button type="button" className="primary-button" onClick={handleSave} disabled={dirtyKeys.size === 0 || controlsDisabled}>
            {isSaving && <Loader2 className="spin" aria-hidden="true" />}
            {isSaving ? 'Сохранение…' : isRefreshingEntity ? 'Обновление…' : dirtyKeys.size === 0 ? 'Изменений нет' : 'Сохранить настройки'}
          </button>
        </footer>
      </div>
    </div>
  );
};
