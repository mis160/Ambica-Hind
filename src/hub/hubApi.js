import { HUB_API_URL } from './hubConfig.js';

// True once a real Apps Script URL has been pasted into hubConfig.js
export const hubConnected = () =>
  typeof HUB_API_URL === 'string' && HUB_API_URL.startsWith('https://script.google.com/');

// Links whose Category is one of these show in the Production tab (not on Home):
//   ZNO = Zinc Oxide only, WD = Wire Plant only, GI = Galvanizing only, Production = all three
export const PRODUCTION_TAGS = ['ZNO', 'WD', 'GI', 'PRODUCTION'];

// Only allow normal web links (blocks things like javascript: links)
export const isSafeUrl = (url) => /^https?:\/\//i.test(String(url || ''));

export async function fetchHub() {
  const res = await fetch(`${HUB_API_URL}?action=hub&_=${Date.now()}`);
  if (!res.ok) throw new Error('Server responded with status ' + res.status);
  const data = await res.json();
  if (data && data.error) throw new Error(data.error);
  return {
    notices: Array.isArray(data.notices) ? data.notices : [],
    rates: Array.isArray(data.rates) ? data.rates : [],
    links: Array.isArray(data.links) ? data.links : []
  };
}

// Sent as plain text so the browser does not need a pre-check (Apps Script cannot answer one)
export async function postHub(payload) {
  const res = await fetch(HUB_API_URL, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Server responded with status ' + res.status);
  const data = await res.json();
  if (!data || data.ok !== true) throw new Error((data && data.error) || 'Could not save.');
  return data;
}
