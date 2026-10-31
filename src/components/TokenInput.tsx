import React, { useState } from 'react';
import { KeyRound, ArrowRight, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface TokenInputProps {
  onTokenSubmit: (token: string) => void;
  isLoading: boolean;
  error?: string;
}

export const TokenInput: React.FC<TokenInputProps> = ({ onTokenSubmit, isLoading, error }) => {
  const [token, setToken] = useState('');
  const [isTokenVisible, setIsTokenVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onTokenSubmit(token.trim());
    }
  };

  return (
    <main className="auth-screen">
      <div className="auth-glow auth-glow-top" aria-hidden="true" />
      <div className="auth-glow auth-glow-bottom" aria-hidden="true" />

      <div className="auth-card">
        <div className="flex flex-col items-center mb-8">
          <div className="auth-icon" aria-hidden="true">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1>Подключите умный дом</h1>
          <p className="auth-lead">
            Введите OAuth‑токен Яндекса с правами <code>iot:view</code> и <code>iot:control</code>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="yandex-oauth-token">OAuth‑токен</label>
          <div className="auth-input-wrap">
            <input
              id="yandex-oauth-token"
              name="yandex-oauth-token"
              type={isTokenVisible ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="y0_AgAAAA..."
              autoComplete="off"
              aria-describedby={error ? 'token-error token-hint' : 'token-hint'}
              required
            />
            <button
              type="button"
              className="auth-visibility-button"
              onClick={() => setIsTokenVisible(current => !current)}
              aria-label={isTokenVisible ? 'Скрыть токен' : 'Показать токен'}
            >
              {isTokenVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </button>
          </div>
          <p id="token-hint" className="auth-hint">Токен хранится в защищённом хранилище операционной системы.</p>

          {error && (
            <div id="token-error" className="auth-error" role="alert">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="auth-submit primary-button"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-gray-400 dark:border-white/30 border-t-gray-600 dark:border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                Подключить дом
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="auth-help">
          <a 
            href="https://github.com/onegamerstory/Desktop-Yandex.Home-App/blob/main/README.md" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Открыть инструкцию по получению токена <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </div>
    </main>
  );
};
