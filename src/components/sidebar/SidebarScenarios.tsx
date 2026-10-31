import React from 'react';
import { ChevronDown, Star, Loader2 } from 'lucide-react';
import { YandexScenario } from '../../types/index';
import { getIconForScenario } from '../../constants';
import { useDashboardContext } from '../../contexts/DashboardContext';

interface SidebarScenariosProps {
    collapsed: boolean;
    onToggle: () => void;
    loadingItems: Record<string, boolean>;
    withLoading: (key: string, action: () => Promise<void>) => () => void;
    scenarios: YandexScenario[];
}

export const SidebarScenarios: React.FC<SidebarScenariosProps> = ({
    collapsed, onToggle, loadingItems, withLoading, scenarios,
}) => {
    const ctx = useDashboardContext();

    if (scenarios.length === 0) return null;

    return (
        <>
            <button type="button" className="sidebar-section-title" onClick={onToggle} aria-expanded={!collapsed}>
                <ChevronDown className="w-3 h-3" style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 150ms ease' }} />
                Сценарии
            </button>
            {!collapsed && scenarios.map(s => (
                <div key={s.id} className="sidebar-item" style={{ paddingRight: '8px' }}>
                    <span className="sidebar-item-icon">
                        {loadingItems[`scenario:${s.id}`]
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : React.cloneElement(getIconForScenario(s.icon, s.name) as React.ReactElement<{ className?: string }>, { className: 'w-3.5 h-3.5' })
                        }
                    </span>
                    <button
                        type="button"
                        className="sidebar-item-action"
                        onClick={withLoading(`scenario:${s.id}`, () => ctx.onExecuteScenario(s.id))}
                    >
                        {s.name}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); ctx.onToggleScenarioFavorite(s.id); }}
                        className="sidebar-favorite-button"
                        aria-label={ctx.favoriteScenarioIds.includes(s.id) ? `Убрать сценарий «${s.name}» из избранного` : `Добавить сценарий «${s.name}» в избранное`}
                        style={{
                            position: 'static', background: 'none', border: 'none', cursor: 'pointer',
                            color: ctx.favoriteScenarioIds.includes(s.id) ? 'var(--fav-star)' : 'var(--muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 2, flexShrink: 0,
                        }}
                    >
                        <Star className="w-3.5 h-3.5" fill={ctx.favoriteScenarioIds.includes(s.id) ? 'currentColor' : 'none'} />
                    </button>
                </div>
            ))}
        </>
    );
};
