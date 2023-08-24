import { auth } from "@clerk/nextjs";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { db } from "~/lib/database";
import { EventsListTable } from "./components/events-list-table";

export default async function EventsPage() {
  const { orgId, userId } = auth();

  const events = await db.event.findMany({
    where: {
      OR: [
        { store: String(orgId) },
        { user: String(userId) },
        { user: `client-store:${orgId}` },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(events);

  return (
    <Card className="pb-6">
      <CardHeader>
        <CardTitle>Eventos</CardTitle>
        <CardDescription>
          Todos os eventos da sua loja aparecem aqui.
        </CardDescription>
      </CardHeader>

      {events.length > 0 ? <EventsListTable events={events} /> : null}
    </Card>
  );
}
