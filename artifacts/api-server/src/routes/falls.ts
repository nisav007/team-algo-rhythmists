import { Router, type IRouter } from "express";
import { desc, eq, gte, sql } from "drizzle-orm";
import { db, fallEventsTable, contactsTable } from "@workspace/db";
import {
  ReportFallBody,
  DeleteFallParams,
  ListFallsResponse,
  ListFallsResponseItem,
  GetFallsSummaryResponse,
} from "@workspace/api-zod";
import { sendFallAlert } from "../lib/sms";

const router: IRouter = Router();

router.get("/falls", async (req, res): Promise<void> => {
  const falls = await db
    .select()
    .from(fallEventsTable)
    .orderBy(desc(fallEventsTable.createdAt));
  res.json(ListFallsResponse.parse(falls));
});

router.get("/falls/summary", async (req, res): Promise<void> => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fallEventsTable);

  const [todayResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fallEventsTable)
    .where(gte(fallEventsTable.detectedAt, startOfToday));

  const [weekResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(fallEventsTable)
    .where(gte(fallEventsTable.detectedAt, startOfWeek));

  const [lastFall] = await db
    .select({ detectedAt: fallEventsTable.detectedAt })
    .from(fallEventsTable)
    .orderBy(desc(fallEventsTable.detectedAt))
    .limit(1);

  const [contactsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contactsTable);

  res.json(
    GetFallsSummaryResponse.parse({
      totalFalls: totalResult?.count ?? 0,
      todayFalls: todayResult?.count ?? 0,
      thisWeekFalls: weekResult?.count ?? 0,
      lastFallAt: lastFall?.detectedAt?.toISOString() ?? null,
      totalContacts: contactsResult?.count ?? 0,
    })
  );
});

router.post("/falls", async (req, res): Promise<void> => {
  const parsed = ReportFallBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { location, notes } = parsed.data;

  const contacts = await db.select().from(contactsTable);

  const smsResults = await Promise.all(
    contacts.map((contact) =>
      sendFallAlert(contact.name, contact.phone, location, notes)
    )
  );

  const successCount = smsResults.filter((r) => r.success).length;
  const smsStatus =
    contacts.length === 0
      ? "no_contacts"
      : successCount === contacts.length
      ? "sent"
      : successCount === 0
      ? "failed"
      : "partial";

  const [fall] = await db
    .insert(fallEventsTable)
    .values({
      location: location ?? null,
      notes: notes ?? null,
      smsStatus,
      smsSentCount: successCount,
      detectedAt: new Date(),
    })
    .returning();

  req.log.info({ fallId: fall.id, smsStatus, successCount }, "Fall event reported");

  res.status(201).json({
    fall: ListFallsResponseItem.parse(fall),
    smsResults,
  });
});

router.delete("/falls/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFallParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(fallEventsTable)
    .where(eq(fallEventsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Fall event not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
