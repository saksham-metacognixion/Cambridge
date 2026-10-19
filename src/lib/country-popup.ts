import config from '../data/country-popup.json';

/** The Figma country pop-up is rendered when src/data/country-popup.json `enabled` is true, or PUBLIC_COUNTRY_POPUP=on (staging preview). */
export const countryPopupOn: boolean = config.enabled || import.meta.env.PUBLIC_COUNTRY_POPUP === 'on';
