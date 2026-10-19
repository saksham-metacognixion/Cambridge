import config from '../data/country-popup.json';

/** The Figma country pop-up is rendered when src/data/country-popup.json `enabled` is true, or PUBLIC_COUNTRY_POPUP=on (staging preview). */
export const countryPopupOn: boolean = config.enabled || import.meta.env.PUBLIC_COUNTRY_POPUP === 'on';

export interface PopupButton { key: string; style: string; target: string }
export interface PopupVersion { text: string; buttons: PopupButton[] }
export interface CountryPopupEntry { iso: string; map: string; flag: string; version: PopupVersion }

type CountryConfig = { map: string; flag: string; onGlobal?: PopupVersion; onRegion?: PopupVersion };
const countries = config.countries as Record<string, CountryConfig>;
const redirect = config.redirect as Record<string, string>;

/**
 * The pop-ups an edition can show, one per detected country (empty when the pop-up is off):
 *   - Global: each country's `onGlobal` (a visitor who was not redirected, e.g. a page their region does not have);
 *   - /ae, /sa: the `onRegion` of the countries the location redirect sends to that region (the confirmation after it).
 */
export function countryPopups(region: string): CountryPopupEntry[] {
  if (!countryPopupOn) return [];
  return Object.entries(countries).flatMap(([iso, c]) => {
    const version = region === 'global' ? c.onGlobal : redirect[iso] === region ? c.onRegion : undefined;
    return version ? [{ iso, map: c.map, flag: c.flag, version }] : [];
  });
}
