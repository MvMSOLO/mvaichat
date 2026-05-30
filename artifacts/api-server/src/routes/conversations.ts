import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable } from "@workspace/db";
import {
  UpdateConversationParams,
  UpdateConversationBody,
  DeleteConversationParams,
  ListMessagesParams,
  CreateMessageParams,
  CreateMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

router.get("/conversations", requireAuth, async (req: any, res): Promise<void> => {
  const rows = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.userId, req.userId))
    .orderBy(desc(conversationsTable.updatedAt));
  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  })));
});

router.post("/conversations", requireAuth, async (req: any, res): Promise<void> => {
  const { title, modelId } = req.body;
  if (!title || !modelId) {
    res.status(400).json({ error: "title and modelId required" });
    return;
  }
  const [conv] = await db
    .insert(conversationsTable)
    .values({ userId: req.userId, title, modelId })
    .returning();
  res.status(201).json({
    ...conv,
    createdAt: conv.createdAt.toISOString(),
    updatedAt: conv.updatedAt.toISOString(),
  });
});

router.patch("/conversations/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = UpdateConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateConversationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const patch: any = {};
  if (body.data.title != null) patch.title = body.data.title;
  if (body.data.modelId != null) patch.modelId = body.data.modelId;
  if (body.data.pinned != null) patch.pinned = body.data.pinned;
  if (body.data.updatedAt != null) patch.updatedAt = new Date(body.data.updatedAt);

  const [updated] = await db
    .update(conversationsTable)
    .set(patch)
    .where(and(eq(conversationsTable.id, params.data.id), eq(conversationsTable.userId, req.userId)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/conversations/:id", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  // Delete messages first
  await db.delete(messagesTable).where(eq(messagesTable.conversationId, params.data.id));
  const [deleted] = await db
    .delete(conversationsTable)
    .where(and(eq(conversationsTable.id, params.data.id), eq(conversationsTable.userId, req.userId)))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendStatus(204);
});

// Messages
router.get("/conversations/:id/messages", requireAuth, async (req: any, res): Promise<void> => {
  const params = ListMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(messagesTable)
    .where(and(
      eq(messagesTable.conversationId, params.data.id),
      eq(messagesTable.userId, req.userId),
    ))
    .orderBy(messagesTable.createdAt);
  res.json(rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/conversations/:id/messages", requireAuth, async (req: any, res): Promise<void> => {
  const params = CreateMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = CreateMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [msg] = await db
    .insert(messagesTable)
    .values({
      conversationId: params.data.id,
      userId: req.userId,
      role: body.data.role,
      content: body.data.content,
      modelId: body.data.modelId ?? null,
      attachments: body.data.attachments ?? null,
    })
    .returning();
  res.status(201).json({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
