import { fetchProxied } from "./api";

export interface Alert {
  id: string;
  company_name: string;
  message: string;
  type: "new_filing" | "signal" | "form_d" | "warn";
  timestamp: string;
  read: boolean;
  link?: string;
}

const ALERTS_KEY = "stc_alerts";
const MONITORED_KEY = "stc_monitored";
const LAST_CHECK_KEY = "stc_last_check";

export function getAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    return raw ? (JSON.parse(raw) as Alert[]) : [];
  } catch { return []; }
}

function saveAlerts(alerts: Alert[]): void {
  try { localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts)); } catch { /* quota */ }
}

export function markRead(id: string): void {
  const alerts = getAlerts().map(a => a.id === id ? { ...a, read: true } : a);
  saveAlerts(alerts);
  window.dispatchEvent(new CustomEvent("stc:alert"));
}

export function markAllRead(): void {
  const alerts = getAlerts().map(a => ({ ...a, read: true }));
  saveAlerts(alerts);
  window.dispatchEvent(new CustomEvent("stc:alert"));
}

export function addAlert(alert: Omit<Alert, "id" | "timestamp" | "read">): void {
  const alerts = getAlerts();
  const newAlert: Alert = {
    ...alert,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  saveAlerts([newAlert, ...alerts].slice(0, 100));
  window.dispatchEvent(new CustomEvent("stc:alert"));

  if (Notification.permission === "granted") {
    try {
      new Notification(`DEALNEXA — ${alert.company_name}`, {
        body: alert.message,
        icon: "/favicon.ico",
      });
    } catch { /* unsupported */ }
  }
}

export function getUnreadCount(): number {
  return getAlerts().filter(a => !a.read).length;
}

export function getMonitored(): string[] {
  try {
    const raw = localStorage.getItem(MONITORED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

export function addMonitored(name: string): void {
  const list = getMonitored();
  if (!list.includes(name)) {
    try { localStorage.setItem(MONITORED_KEY, JSON.stringify([...list, name])); } catch { /* quota */ }
  }
}

export function removeMonitored(name: string): void {
  const list = getMonitored().filter(n => n !== name);
  try { localStorage.setItem(MONITORED_KEY, JSON.stringify(list)); } catch { /* quota */ }
}

function getLastCheck(): string {
  return localStorage.getItem(LAST_CHECK_KEY) || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function setLastCheck(): void {
  try { localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString().slice(0, 10)); } catch { /* quota */ }
}

function getAlertKey(company: string, accession: string): string {
  return `${company.toLowerCase().replace(/\s+/g, "_")}_${accession}`;
}

function isAlertDuplicate(company: string, accession: string): boolean {
  const alerts = getAlerts();
  const key = getAlertKey(company, accession);
  return alerts.some(a => getAlertKey(a.company_name, a.link || "") === key);
}

export async function checkForNewFilings(): Promise<void> {
  const monitored = getMonitored();
  if (monitored.length === 0) return;

  const lastCheck = getLastCheck();

  await Promise.allSettled(
    monitored.map(async (company) => {
      try {
        const url = `/api/efts/LATEST/search-index?q=${encodeURIComponent(`"${company}"`)}&dateRange=custom&startdt=${lastCheck}`;
        // Route through CORS proxy — efts.sec.gov blocks direct browser requests from non-localhost origins
        const data = await fetchProxied(url);
        const hits: unknown[] = data?.hits?.hits || [];

        for (const h of hits) {
          const src = (h as Record<string, unknown>)._source as Record<string, unknown> || {};
          const accession = String(src.accession_no || "");
          const formType = String(src.form_type || "");
          const fileDate = String(src.file_date || "");

          if (!accession || isAlertDuplicate(company, accession)) continue;

          addAlert({
            company_name: company,
            message: `New ${formType} filing on ${fileDate}`,
            type: "new_filing",
            link: accession,
          });
        }
      } catch { /* skip company on error */ }
    })
  );

  setLastCheck();
}

export function requestNotificationPermission(): void {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => { /* denied */ });
  }
}

let _engineStarted = false;

export function startAlertEngine(): void {
  if (_engineStarted) return;
  _engineStarted = true;

  requestNotificationPermission();
  checkForNewFilings();

  setInterval(() => {
    checkForNewFilings();
  }, 30 * 60 * 1000);
}
