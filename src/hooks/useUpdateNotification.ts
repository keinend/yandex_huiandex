import { useState, useEffect } from 'react';
import { compareVersions } from '../utils/dataUtils';
import packageJson from '../../package.json';

interface UpdateInfo {
    latestVersion: string;
    releaseUrl: string;
    releaseDate: string;
}

interface UseUpdateNotificationReturn {
    showUpdateNotification: boolean;
    setShowUpdateNotification: React.Dispatch<React.SetStateAction<boolean>>;
    updateInfo: UpdateInfo | null;
}

const checkForUpdates = async (): Promise<UpdateInfo | null> => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('mock')) return null;
    try {
        const response = await fetch(
            'https://api.github.com/repos/keinend/yandex_huiandex/releases/latest',
            { signal: AbortSignal.timeout(8000) }
        );
        if (!response.ok) {
            throw new Error('Не удалось получить информацию о последней версии');
        }
        const data = await response.json();
        const latestVersion = data.tag_name || null;
        const currentVersion = packageJson.version;

        if (latestVersion && compareVersions(latestVersion, currentVersion) > 0) {
            return {
                latestVersion,
                releaseUrl: data.html_url,
                releaseDate: new Date(data.published_at).toLocaleDateString('ru-RU'),
            };
        }
        return null;
    } catch (err) {
        console.warn('Проверка обновлений недоступна:', err);
        return null;
    }
};

export function useUpdateNotification(): UseUpdateNotificationReturn {
    const [showUpdateNotification, setShowUpdateNotification] = useState<boolean>(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

    useEffect(() => {
        checkForUpdates().then(newUpdateInfo => {
            if (newUpdateInfo) {
                setUpdateInfo(newUpdateInfo);
                setShowUpdateNotification(true);
            }
        });
    }, []);

    return { showUpdateNotification, setShowUpdateNotification, updateInfo };
}
