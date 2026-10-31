import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDashboardContext } from '../../contexts/DashboardContext';

interface SidebarGroupsProps {
    collapsed: boolean;
    onToggle: () => void;
}

export const SidebarGroups: React.FC<SidebarGroupsProps> = ({ collapsed, onToggle }) => {
    const ctx = useDashboardContext();

    const groupsForHome = useMemo(() => {
        if (!ctx.activeHouseholdId) return ctx.data.groups;
        return ctx.data.groups.filter(group => group.household_id === ctx.activeHouseholdId);
    }, [ctx.data.groups, ctx.activeHouseholdId]);

    if (groupsForHome.length === 0) return null;

    return (
        <>
            <button type="button" className="sidebar-section-title" onClick={onToggle} aria-expanded={!collapsed}>
                <ChevronDown className="w-3 h-3" style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 150ms ease' }} />
                Группы устройств
            </button>
            {!collapsed && groupsForHome.map(group => (
                <button
                    type="button"
                    key={group.id}
                    className={`sidebar-item ${ctx.activeSidebarView === 'group' && ctx.activeGroupId === group.id ? 'active' : ''}`}
                    onClick={() => ctx.onSelectGroup(group.id)}
                >
                    <span className="sidebar-item-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                        </svg>
                    </span>
                    {group.name}
                    <span className="sidebar-item-badge">{group.devices.length}</span>
                </button>
            ))}
        </>
    );
};
