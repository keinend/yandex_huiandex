import React, { useState } from 'react';
import { getIconForScenario } from '../../constants';
import { YandexScenario } from '../../types/index';
import { Loader2, CheckCircle2, Star, Eye, EyeOff } from 'lucide-react';
import { useDashboardContext } from '../../contexts/DashboardContext';

interface ScenarioCardProps {
  scenario: YandexScenario;
  onExecute: (id: string) => Promise<void>;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isEditMode?: boolean;
  iconHiddenState?: boolean;
  onToggleVisibility?: (id: string) => void;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onExecute, isFavorite, onToggleFavorite, isEditMode = false, iconHiddenState = false, onToggleVisibility }) => {
  const ctx = useDashboardContext();
  const [loading, setLoading] = useState(false);
  const [justExecuted, setJustExecuted] = useState(false);
  const isBusy = loading || ctx.isActionPending('scenario', scenario.id);

  const handleClick = async () => {
    if (isBusy) return;
    setLoading(true);
    try {
      await onExecute(scenario.id);
      setJustExecuted(true);
      setTimeout(() => setJustExecuted(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const icon = getIconForScenario(scenario.icon, scenario.name);

  return (
    <article
      className={`scenario-card ${isBusy ? 'opacity-80' : ''} ${justExecuted ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/10' : ''} ${isEditMode && iconHiddenState ? 'opacity-50 grayscale' : ''}`}
      style={{ position: 'relative' }}
      aria-busy={isBusy}
    >
      <button
        type="button"
        className="scenario-hit-target"
        onClick={handleClick}
        disabled={isBusy}
        aria-label={`Запустить сценарий «${scenario.name}»`}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isEditMode && onToggleVisibility) {
            onToggleVisibility(`scenario_${scenario.id}`);
          } else {
            onToggleFavorite(scenario.id);
          }
        }}
        className={`scenario-fav-btn ${isFavorite ? 'is-fav' : ''}`}
        aria-label={isEditMode && onToggleVisibility
          ? iconHiddenState ? `Показать сценарий «${scenario.name}»` : `Скрыть сценарий «${scenario.name}»`
          : isFavorite ? `Удалить сценарий «${scenario.name}» из избранного` : `Добавить сценарий «${scenario.name}» в избранное`}
        aria-pressed={isEditMode && onToggleVisibility ? iconHiddenState : isFavorite}
      >
        {isEditMode && onToggleVisibility ? (
          iconHiddenState ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />
        ) : (
          <Star className="w-3 h-3" fill={isFavorite ? 'currentColor' : 'none'} />
        )}
      </button>

      <div className="scenario-icon">
        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : justExecuted ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} /> : React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-3.5 h-3.5' })}
      </div>
      <span className="scenario-name">{scenario.name}</span>
    </article>
  );
};
