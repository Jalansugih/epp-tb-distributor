/**
 * Single source of truth for the app's display name and version.
 * Previously this was hardcoded inconsistently in 4 different places
 * ("BuildDistro ERP", "DistribuERP", "Distributor ERP", "v2.4 PRO") —
 * import from here instead of hardcoding the name/version again.
 */
export const APP_NAME = 'Rajakas.ID ERP';
export const APP_VERSION = '1.0.0'; // keep in sync with package.json "version"
