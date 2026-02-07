const isDev = process.env.NODE_ENV !== 'production';

// Toggle between mock and real backend
export const USE_MOCK_BACKEND = false; // Set to false to use real backend

// For mobile: Use your computer's local IP (find with ipconfig/ifconfig)
// Replace this IP with your actual local IP address when it changes
export const API_CONFIG = {
    BASE_URL: isDev
        ? 'http://10.132.26.221:8000/api/v1'
        : 'https://api.absense.com/api/v1',

    TIMEOUT: 10000,
    QR_EXPIRY_WARNING_SECONDS: 5,
    GEOFENCE_DEFAULT_RADIUS: 100,
} as const;

export const STORAGE_KEYS = {
    ACCESS_TOKEN: '@absense/access_token',
    REFRESH_TOKEN: '@absense/refresh_token',
    USER_DATA: '@absense/user_data',
} as const;

export const APP_CONFIG = {
    NAME: 'Absense',
    VERSION: '1.0.0',

    FACE_IMAGE_QUALITY: 0.8,
    FACE_IMAGE_MAX_WIDTH: 1024,
    FACE_IMAGE_MAX_HEIGHT: 1024,

    QR_SCANNER_ASPECT_RATIO: 1,

    SELFIE_IMAGE_QUALITY: 0.7,
    LOCATION_ACCURACY_HIGH: true,
} as const;
