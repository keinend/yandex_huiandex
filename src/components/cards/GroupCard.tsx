import React, { useState, useMemo } from 'react';
import { YandexGroup, YandexDevice } from '../../types/index';
import { DeviceCardAdapter } from './DeviceCardAdapter';
import { Loader2, Power, ChevronDown, ChevronRight, Settings, Star } from 'lucide-react';
import { isControllableCapability } from '../../constants';
import { useDashboardContext } from '../../contexts/DashboardContext';


interface GroupCardProps {
  group: YandexGroup;
  devices: YandexDevice[];
  onToggleGroup: (id: string, currentState: boolean) => Promise<void>;
  onToggleDevice: (id: string, currentState: boolean) => Promise<void>;
  favoriteDeviceIds: string[];
  onToggleDeviceFavorite: (id: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onOpenSettings?: (device: YandexDevice) => void;
  onOpenCameraStream?: (device: YandexDevice) => void;
  onOpenGroupSettings?: (group: YandexGroup) => void;
  isEditMode?: boolean;
  getEffectiveHidden?: (cardId: string) => boolean;
  getIconHiddenState?: (cardId: string) => boolean;
  onToggleDeviceVisibility?: (id: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  devices,
  onToggleGroup,
  onToggleDevice,
  favoriteDeviceIds,
  onToggleDeviceFavorite,
  isFavorite = false,
  onToggleFavorite,
  onOpenSettings,
  onOpenCameraStream,
  onOpenGroupSettings,
  isEditMode = false,
  getEffectiveHidden = (_cardId: string) => false,
  getIconHiddenState = (_cardId: string) => false,
  onToggleDeviceVisibility,
}) => {
  const ctx = useDashboardContext();
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isBusy = loading || ctx.isActionPending('group', group.id);

  const groupDevices = useMemo(() => {
    return devices.filter(d => group.devices.includes(d.id));
  }, [devices, group.devices]);

  const groupInfo = useMemo(() => {
    if (groupDevices.length === 0) {
      return {
        isLightGroup: false,
        isThermostatGroup: false,
        isFanGroup: false,
        groupIsOn: false,
        groupIsMixed: false,
        onCount: 0,
        totalOnOff: 0,
        hasOnOffCapability: group.capabilities.some(c => c.type === 'devices.capabilities.on_off'),
        visibleDevices: [] as YandexDevice[],
      };
    }

    let isLight = true, isThermostat = true, isFan = true;
    let onCount = 0, totalOnOff = 0;

    for (const d of groupDevices) {
      if (!d.type.startsWith('devices.types.light')) isLight = false;
      if (!(d.type === 'devices.types.thermostat.ac' || d.type === 'devices.types.thermostat')) isThermostat = false;
      if (d.type !== 'devices.types.ventilation.fan') isFan = false;
      const onOffCap = d.capabilities.find(c => c.type === 'devices.capabilities.on_off');
      if (onOffCap) {
        totalOnOff++;
        if (onOffCap.state?.value === true) onCount++;
      }
    }

    const onOffCap = group.capabilities.find(c => c.type === 'devices.capabilities.on_off');

    return {
      isLightGroup: isLight,
      isThermostatGroup: isThermostat,
      isFanGroup: isFan,
      groupIsOn: totalOnOff > 0 && onCount === totalOnOff,
      groupIsMixed: onCount > 0 && onCount < totalOnOff,
      onCount,
      totalOnOff,
      hasOnOffCapability: !!onOffCap,
      visibleDevices: groupDevices.filter(d => !getEffectiveHidden(`device_${d.id}`)),
    };
  }, [groupDevices, group.capabilities, getEffectiveHidden]);

  const handleToggleGroup = async () => {
    if (!groupInfo.hasOnOffCapability || isBusy) return;
    setLoading(true);
    try { await onToggleGroup(group.id, groupInfo.groupIsOn); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  const groupStateText = groupInfo.groupIsOn
    ? 'Всё включено'
    : groupInfo.groupIsMixed
      ? `${groupInfo.onCount} из ${groupInfo.totalOnOff}`
      : 'Выключено';

  return (
    <section className="group-wrapper" aria-labelledby={`group-title-${group.id}`} style={{ opacity: isEditMode && getIconHiddenState(`group_${group.id}`) ? 0.5 : 1, filter: isEditMode && getIconHiddenState(`group_${group.id}`) ? 'grayscale(1)' : 'none' }}>
      <div className="group-header">
        <button type="button" className="group-collapse-button" onClick={() => setIsCollapsed(!isCollapsed)} aria-expanded={!isCollapsed} aria-label={`${group.name}, ${groupStateText}`}>
          {isCollapsed ? <ChevronRight className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />}
          <h3 id={`group-title-${group.id}`}>{group.name}</h3>
          <span className="sidebar-item-badge" style={{ fontSize: 11 }}>{groupDevices.length}</span>
          {groupInfo.totalOnOff > 0 && (
            <span className={`group-state ${groupInfo.groupIsOn ? 'is-on' : groupInfo.groupIsMixed ? 'is-mixed' : ''}`}>
              {groupStateText}
            </span>
          )}
        </button>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(group.id); }}
              className={`group-favorite-button ${isFavorite ? 'is-fav' : ''}`}
              aria-label={isFavorite ? `Удалить группу «${group.name}» из избранного` : `Добавить группу «${group.name}» в избранное`}
              aria-pressed={isFavorite}
            >
              <Star className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}
          {group.capabilities.some(isControllableCapability) && onOpenGroupSettings && (
            <button
              type="button"
              onClick={() => onOpenGroupSettings(group)}
              className="group-power-btn"
              disabled={isBusy}
              title="Все настройки группы"
              aria-label={`Открыть настройки группы «${group.name}»`}
            >
              <Settings />
            </button>
          )}
          {groupInfo.hasOnOffCapability && (
            <button
              type="button"
              onClick={handleToggleGroup}
              disabled={isBusy}
              className={`group-power-btn ${groupInfo.groupIsOn ? 'is-on' : groupInfo.groupIsMixed ? 'is-mixed' : ''}`}
              title={groupInfo.groupIsOn ? 'Выключить всю группу' : 'Включить всю группу'}
              aria-label={groupInfo.groupIsOn ? `Выключить группу «${group.name}»` : `Включить группу «${group.name}»`}
              aria-pressed={groupInfo.groupIsOn}
            >
              {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power />}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {groupInfo.visibleDevices.length > 0 ? (
            <div className="device-grid">
              {groupInfo.visibleDevices.map(device => (
                <DeviceCardAdapter key={device.id} device={device} onToggle={onToggleDevice} isFavorite={favoriteDeviceIds.includes(device.id)} onToggleFavorite={onToggleDeviceFavorite} onOpenSettings={onOpenSettings} onOpenCameraStream={onOpenCameraStream} isEditMode={isEditMode} iconHiddenState={getIconHiddenState(`device_${device.id}`)} onToggleVisibility={() => onToggleDeviceVisibility?.(`device_${device.id}`)} />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Все устройства в этой группе скрыты</p>
          )}
        </>
      )}

      {groupDevices.length === 0 && (
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>В этой группе нет устройств</p>
      )}
    </section>
  );
};
