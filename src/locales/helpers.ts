import { moment } from 'obsidian';

import en from './lang/en';


const localeMap: { [k: string]: Partial<typeof en> } = {
    en,
  };

const locale = localeMap[moment.locale()];

/**
 * 
 * @param {String} str
 * @returns  
 */
export function t(str: keyof typeof en): string {
  if (!locale) {
    console.error("Error: Plugin obsidian-asciinema-player locale not found", moment.locale());
  }

  return (locale && locale[str]) || en[str];
}
