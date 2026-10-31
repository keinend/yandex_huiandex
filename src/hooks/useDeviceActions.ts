import { useCallback, useRef, useState } from 'react';
import {
    deleteDevice, executeScenario, fetchDevice, fetchGroup, getCameraStream,
    setCameraPrivacyMode, setDeviceActions, setDeviceMode, setGroupActions,
    toggleDevice, toggleGroup,
} from '../services/yandexIoT';
import {
    CameraStreamResult, YandexCapabilityAction, YandexDevice, YandexGroup,
    YandexModeAction, YandexUserInfoResponse,
} from '../types/index';
import { cleanErrorMessage } from '../utils/errors';
import { applyDeviceActionsToData, applyGroupActionsToData, mergeFreshGroup } from '../utils/capabilityState';

interface UseDeviceActionsReturn {
    handleToggleDevice: (deviceId: string, currentState: boolean) => Promise<void>;
    handleToggleGroup: (groupId: string, currentState: boolean) => Promise<void>;
    handleExecuteScenario: (scenarioId: string) => Promise<void>;
    handleSetDeviceMode: (deviceId: string, actions: YandexModeAction[], turnOn?: boolean) => Promise<void>;
    handleSetDeviceActions: (deviceId: string, actions: YandexCapabilityAction[]) => Promise<void>;
    handleSetGroupActions: (groupId: string, actions: YandexCapabilityAction[]) => Promise<void>;
    handleDeleteDevice: (deviceId: string) => Promise<void>;
    handleRefreshDevice: (deviceId: string) => Promise<YandexDevice>;
    handleRefreshGroup: (groupId: string) => Promise<YandexGroup>;
    handleGetCameraStream: (deviceId: string) => Promise<CameraStreamResult>;
    handleSetCameraPrivacy: (deviceId: string, enabled: boolean, instance?: string) => Promise<void>;
    pendingActionKeys: ReadonlySet<string>;
}

export function useDeviceActions(
    token: string | null,
    userData: YandexUserInfoResponse | null,
    setUserData: React.Dispatch<React.SetStateAction<YandexUserInfoResponse | null>>,
    showNotification: (message: string, type?: 'error' | 'success') => void,
    refreshDashboardData: (apiToken: string, silent?: boolean) => Promise<void>,
    requestXTokenAuth: () => Promise<boolean>
): UseDeviceActionsReturn {
    const [pendingActionKeys, setPendingActionKeys] = useState<Set<string>>(new Set());
    const pendingPromisesRef = useRef(new Map<string, Promise<unknown>>());

    const runPending = useCallback(<T,>(key: string, action: () => Promise<T>): Promise<T> => {
        const existing = pendingPromisesRef.current.get(key) as Promise<T> | undefined;
        if (existing) return existing;
        setPendingActionKeys((current) => new Set(current).add(key));
        const promise = Promise.resolve().then(action).finally(() => {
            pendingPromisesRef.current.delete(key);
            setPendingActionKeys((current) => {
                const next = new Set(current);
                next.delete(key);
                return next;
            });
        });
        pendingPromisesRef.current.set(key, promise);
        return promise;
    }, []);

    const runDeviceActions = useCallback(async (
        deviceId: string,
        actions: YandexCapabilityAction[],
        request: () => Promise<void>,
        successMessage?: string,
    ) => runPending(`device:${deviceId}`, async () => {
        if (!token) return;
        const previousCapabilities = userData?.devices.find((device) => device.id === deviceId)?.capabilities;
        setUserData((current) => current ? applyDeviceActionsToData(current, deviceId, actions) : current);
        try {
            await request();
            if (successMessage) showNotification(successMessage, 'success');
            await refreshDashboardData(token, true);
        } catch (err) {
            if (previousCapabilities) {
                setUserData((current) => current ? {
                    ...current,
                    devices: current.devices.map((device) => device.id === deviceId
                        ? { ...device, capabilities: previousCapabilities }
                        : device),
                } : current);
            }
            showNotification(`Команда не выполнена. ${cleanErrorMessage(err)}`, 'error');
            await refreshDashboardData(token, true);
            throw err;
        }
    }), [refreshDashboardData, runPending, setUserData, showNotification, token, userData]);

    const runGroupActions = useCallback(async (
        groupId: string,
        actions: YandexCapabilityAction[],
        request: () => Promise<void>,
        successMessage?: string,
    ) => runPending(`group:${groupId}`, async () => {
        if (!token) return;
        const group = userData?.groups.find((item) => item.id === groupId);
        const previousGroupCapabilities = group?.capabilities;
        const previousDeviceCapabilities = new Map(
            (userData?.devices ?? [])
                .filter((device) => group?.devices.includes(device.id))
                .map((device) => [device.id, device.capabilities] as const),
        );
        setUserData((current) => current ? applyGroupActionsToData(current, groupId, actions) : current);
        try {
            await request();
            if (successMessage) showNotification(successMessage, 'success');
            await refreshDashboardData(token, true);
        } catch (err) {
            setUserData((current) => current ? {
                ...current,
                groups: current.groups.map((item) => item.id === groupId && previousGroupCapabilities
                    ? { ...item, capabilities: previousGroupCapabilities }
                    : item),
                devices: current.devices.map((device) => previousDeviceCapabilities.has(device.id)
                    ? { ...device, capabilities: previousDeviceCapabilities.get(device.id)! }
                    : device),
            } : current);
            showNotification(`Команда группе не выполнена. ${cleanErrorMessage(err)}`, 'error');
            await refreshDashboardData(token, true);
            throw err;
        }
    }), [refreshDashboardData, runPending, setUserData, showNotification, token, userData]);

    const handleToggleDevice = useCallback(async (deviceId: string, currentState: boolean) => {
        if (!token || !userData) return;
        const newState = !currentState;
        const actions: YandexCapabilityAction[] = [{ type: 'devices.capabilities.on_off', state: { instance: 'on', value: newState } }];
        await runDeviceActions(deviceId, actions, () => toggleDevice(token, deviceId, newState));
    }, [runDeviceActions, token, userData]);

    const handleToggleGroup = useCallback(async (groupId: string, currentState: boolean) => {
        if (!token || !userData) return;
        const group = userData.groups.find((item) => item.id === groupId);
        const newState = !currentState;
        const actions: YandexCapabilityAction[] = [{ type: 'devices.capabilities.on_off', state: { instance: 'on', value: newState } }];
        await runGroupActions(groupId, actions, () => toggleGroup(token, groupId, group?.devices ?? [], newState));
    }, [runGroupActions, token, userData]);

    const handleExecuteScenario = useCallback(async (scenarioId: string) => {
        if (!token) return;
        await runPending(`scenario:${scenarioId}`, async () => {
            try {
                await executeScenario(token, scenarioId);
                showNotification('Сценарий запущен', 'success');
                await refreshDashboardData(token, true);
            } catch (err) {
                showNotification(`Сценарий не запущен. ${cleanErrorMessage(err)}`, 'error');
                throw err;
            }
        });
    }, [refreshDashboardData, runPending, showNotification, token]);

    const handleSetDeviceMode = useCallback(async (deviceId: string, modeActions: YandexModeAction[], turnOn = false) => {
        if (!token) return;
        await runPending(`device:${deviceId}`, async () => {
            try {
                await setDeviceMode(token, deviceId, modeActions, turnOn);
                showNotification('Настройки устройства применены', 'success');
                await refreshDashboardData(token, true);
            } catch (err) {
                showNotification(`Настройки не применены. ${cleanErrorMessage(err)}`, 'error');
                throw err;
            }
        });
    }, [refreshDashboardData, runPending, showNotification, token]);

    const handleSetDeviceActions = useCallback(async (deviceId: string, actions: YandexCapabilityAction[]) => {
        if (!token) return;
        await runDeviceActions(deviceId, actions, () => setDeviceActions(token, deviceId, actions), 'Настройки устройства применены');
    }, [runDeviceActions, token]);

    const handleSetGroupActions = useCallback(async (groupId: string, actions: YandexCapabilityAction[]) => {
        if (!token) return;
        await runGroupActions(groupId, actions, () => setGroupActions(token, groupId, actions), 'Настройки группы применены');
    }, [runGroupActions, token]);

    const handleDeleteDevice = useCallback(async (deviceId: string) => {
        if (!token) return;
        await runPending(`device:${deviceId}`, async () => {
            try {
                await deleteDevice(token, deviceId);
                showNotification('Устройство удалено из Яндекс Умного дома', 'success');
                await refreshDashboardData(token, true);
            } catch (err) {
                showNotification(`Устройство не удалено. ${cleanErrorMessage(err)}`, 'error');
                throw err;
            }
        });
    }, [refreshDashboardData, runPending, showNotification, token]);

    const handleRefreshDevice = useCallback(async (deviceId: string): Promise<YandexDevice> => {
        if (!token) throw new Error('Нет OAuth‑токена');
        return runPending(`device:${deviceId}`, async () => {
            const fresh = await fetchDevice(token, deviceId);
            let merged = fresh;
            setUserData((current) => {
                if (!current) return current;
                const existing = current.devices.find((device) => device.id === deviceId);
                if (existing) {
                    merged = { ...existing, ...fresh, room: fresh.room ?? existing.room, household_id: fresh.household_id ?? existing.household_id, groups: fresh.groups ?? existing.groups };
                }
                return { ...current, devices: current.devices.map((device) => device.id === deviceId ? merged : device) };
            });
            return merged;
        });
    }, [runPending, setUserData, token]);

    const handleRefreshGroup = useCallback(async (groupId: string): Promise<YandexGroup> => {
        if (!token) throw new Error('Нет OAuth‑токена');
        return runPending(`group:${groupId}`, async () => {
            const fresh = await fetchGroup(token, groupId);
            let merged = fresh;
            setUserData((current) => {
                if (!current) return current;
                const existing = current.groups.find((group) => group.id === groupId);
                if (existing) merged = mergeFreshGroup(existing, fresh);
                return { ...current, groups: current.groups.map((group) => group.id === groupId ? merged : group) };
            });
            return merged;
        });
    }, [runPending, setUserData, token]);

    const handleGetCameraStream = useCallback(async (deviceId: string) => {
        const isXTokenError = (message: string) => message.includes('X_TOKEN_REQUIRED') || message.includes('Quasar auth') || message.includes('x-token');
        try {
            return await getCameraStream(deviceId);
        } catch (err) {
            const message = err instanceof Error ? err.message : '';
            if (isXTokenError(message)) {
                const authenticated = await requestXTokenAuth();
                if (authenticated) return getCameraStream(deviceId);
                throw new Error('Требуется вход по QR для просмотра камер');
            }
            throw err;
        }
    }, [requestXTokenAuth]);

    const handleSetCameraPrivacy = useCallback(async (deviceId: string, privacyEnabled: boolean, instance?: string) => {
        await runPending(`device:${deviceId}`, () => setCameraPrivacyMode(deviceId, privacyEnabled, instance));
    }, [runPending]);

    return {
        handleToggleDevice, handleToggleGroup, handleExecuteScenario,
        handleSetDeviceMode, handleSetDeviceActions, handleSetGroupActions, handleDeleteDevice,
        handleRefreshDevice, handleRefreshGroup, handleGetCameraStream, handleSetCameraPrivacy,
        pendingActionKeys,
    };
}
