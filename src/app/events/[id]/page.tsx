import { mockApi } from "@/lib/mock-data";
import EventDetailClient from "./event-detail-client";

// Pre-render sample event routes for static hosting (GitHub Pages).
export async function generateStaticParams() {
  const events = await mockApi.events({ limit: 100 });
  return events.items.map((event) => ({ id: event.id }));
}

export default function EventDetailPage() {
  return <EventDetailClient />;
}
