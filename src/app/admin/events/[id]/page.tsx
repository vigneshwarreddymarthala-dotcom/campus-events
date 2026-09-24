"use client";

import { use } from "react";
import EventManagementPanel from "@/components/shared/EventManagementPanel";

export default function EventDashboardPage({ params }: PageProps<"/admin/events/[id]">) {
  const { id } = use(params);
  return <EventManagementPanel id={id} backHref="/admin/events" />;
}
