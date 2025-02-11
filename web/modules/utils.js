export function getRandomInteger() {
    return Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER + 1));
}

export const SETTINGS_STORAGE_KEY = 'comfyui-mobile-settings';

/**
 * ローカルストレージから設定を読み込む
 * @returns {Object} 設定オブジェクト
 */
export function loadSettings() {
    let settings = null;
    const defaultSettings = {
        origin: '/',
        username: '',
        password: '',
        seedKeyPatterns: 'noise_seed, seed',
        textareaKeyPatterns: 'prompt, text',
        inputKeyPatterns: '',
        integerKeyPatterns: 'steps, start_at_step, width, height, batch_size',
        floatKeyPatterns: 'cfg',
        autoRandomizeSeed: true,
        retryInterval: 2000,
    };

    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // 古い設定キーの削除
        Object.keys(parsedSettings).forEach(key => {
            if (!defaultSettings.hasOwnProperty(key)) {
                console.debug(`Removing deprecated setting: ${key}`);
                delete parsedSettings[key];
            }
        });
        
        // 不足している設定キーの追加
        Object.keys(defaultSettings).forEach(key => {
            if (!parsedSettings.hasOwnProperty(key)) {
                console.debug(`Adding missing setting: ${key}`);
                parsedSettings[key] = defaultSettings[key];
            }
        });
        
        // 変更があった場合は保存
        saveSettings(parsedSettings);
        
        settings = parsedSettings;
    }else{
        settings = defaultSettings;
    }
    return settings;
}

/**
 * 設定をローカルストレージに保存
 * @param {Object} settings - 保存する設定オブジェクト
 */
export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

// その他のユーティリティ関数   