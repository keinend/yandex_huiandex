import React, { useMemo } from 'react';
import { ChevronDown, Star } from 'lucide-react';
import { getIconForDevice, isSensorDevice } from '../../constants';
import { useDashboardContext } from '../../contexts/DashboardContext';

interface SidebarSensorsProps {
    collapsed: boolean;
    onToggle: () => void;
}

export const SidebarSensors: React.FC<SidebarSensorsProps> = ({ collapsed, onToggle }) => {
    const ctx = useDashboardContext();

    const roomsForHome = useMemo(() => {
        if (!ctx.activeHouseholdId) return ctx.data.rooms;
        return ctx.data.rooms.filter(room => room.household_id === ctx.activeHouseholdId);
    }, [ctx.data.rooms, ctx.activeHouseholdId]);

    const roomIdsForHome = useMemo(() => new Set(roomsForHome.map(r => r.id)), [roomsForHome]);

    const allSensors = useMemo(() => {
        const devicesForHome = !ctx.activeHouseholdId ? ctx.data.devices
            : ctx.data.devices.filter(device => {
                const anyDevice = device as any;
                if (anyDevice.household_id) return anyDevice.household_id === ctx.activeHouseholdId;
                if (device.room && roomIdsForHome.has(device.room)) return true;
                return false;
            });
        return devicesForHome.filter(d => isSensorDevice(d));
    }, [ctx.data.devices, ctx.activeHouseholdId, roomIdsForHome]);

    if (allSensors.length === 0) return null;

    return (
        <>
            <button type="button" className="sidebar-section-title" onClick={onToggle} aria-expanded={!collapsed}>
                <ChevronDown className="w-3 h-3" style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 150ms ease' }} />
                Датчики
                <span className="sidebar-item-badge">{allSensors.length}</span>
            </button>
            {!collapsed && allSensors.map(d => {
                const isFav = ctx.favoriteDeviceIds.includes(d.id);
                return (
                    <div key={d.id} className="sidebar-item" style={{ paddingRight: '8px', opacity: 0.7 }}>
                        <span className="sidebar-item-icon">
                            {React.cloneElement(getIconForDevice(d.type) as React.ReactElement<{ className?: string }>, { className: 'w-3.5 h-3.5' })}
                        </span>
                        <span style={{ flex: 1, fontSize: 13 }}>
                            {d.name}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); ctx.onToggleDeviceFavorite(d.id); }}
                            className={`device-fav ${isFav ? 'is-fav' : ''}`}
                            aria-label={isFav ? `Убрать «${d.name}» из избранного` : `Добавить «${d.name}» в избранное`}
                            style={{
                                position: 'static',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: isFav ? 'var(--fav-star)' : 'var(--muted)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexShrink: 0,
                            }}
                        >
                            <Star className="w-3.5 h-3.5" fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                );
            })}
        </>
    );
};
