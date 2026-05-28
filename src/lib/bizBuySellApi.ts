export interface BrokerListing {
  id: string;
  title: string;
  link: string;
  source: "synergybb" | "accelerated";
  sourceName: string;
  location: string | null;
  askingPrice: number | null;
  cashFlow: number | null;
  revenue: number | null;
  brokerName: string | null;
  brokerPhone: string | null;
  brokerEmail: string | null;
  financialsAvailable: boolean;
  pubDate: string;
}

export interface BrokerSource {
  key: string;
  label: string;
  description: string;
  focus: string;
}

export const BROKER_SOURCES: BrokerSource[] = [
  {
    key: "synergybb",
    label: "Synergy Business Brokers",
    description: "Full financials — asking price, revenue, cash flow",
    focus: "Manufacturing, O&G, Healthcare, Services",
  },
  {
    key: "accelerated",
    label: "Accelerated MFG Brokers",
    description: "Manufacturing-only deals — financials available w/ NDA",
    focus: "CNC, Aerospace, Defense, Industrial",
  },
];

export async function fetchBrokerListings(
  source: string,
): Promise<{ items: BrokerListing[]; fetchedAt: string }> {
  const res  = await fetch(`/api/broker-listings?source=${encodeURIComponent(source)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as { items: BrokerListing[]; fetchedAt: string };
}

export function formatPrice(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

export function daysAgo(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
