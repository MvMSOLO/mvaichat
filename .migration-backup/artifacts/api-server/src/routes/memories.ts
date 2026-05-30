import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { userMemoriesTable } from "@workspace/db";
import { UpsertMemoryBody, DeleteMemoryParams } from "@workspace/api-zod";

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

router.get("/memories", requireAuth, async (req: any, res): Promise<void> => {
  const rows = await db
    .select()
    .from(userMemoriesTable)
    .where(eq(userMemoriesTable.userId, req.userId))
    .orderBy(desc(userMemoriesTable.weight))
    .limit(20);
  res.json(rows);
});

router.post("/memories", requireAuth, async (req: any, res): Promise<void> => {
  const body = UpsertMemoryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  // Check if exists
  const [existing] = await db
    .select()
    .from(userMemoriesTable)
    .where(and(
      eq(userMemoriesTable.userId, req.userId),
      eq(userMemoriesTable.key, body.data.key),
    ))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(userMemoriesTable)
      .set({ value: body.data.value, weight: body.data.weight ?? 1 })
      .where(eq(userMemoriesTable.id, existing.id))
      .returning();
    res.json(updated);
    return;
  }

  const [created] = await db
    .insert(userMemoriesTable)
    .values({ userId: req.userId, key: body.data.key, value: body.data.value, weight: body.data.weight ?? 1 })
    .returning();
  res.json(created);
});

router.delete("/memories/:key", requireAuth, async (req: any, res): Promise<void> => {
  const params = DeleteMemoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(userMemoriesTable)
    .where(and(
      eq(userMemoriesTable.userId, req.userId),
      eq(userMemoriesTable.key, params.data.key),
    ));
  res.sendStatus(204);
});

export default router;
