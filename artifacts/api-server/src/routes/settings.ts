import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { userSettingsTable, profilesTable } from "@workspace/db";
import { UpsertSettingsBody, UpsertProfileBody } from "@workspace/api-zod";

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

const formatSettings = (s: any) => ({
  userId: s.userId,
  persona: s.persona,
  language: s.language,
  responseStyle: s.responseStyle,
  responseLength: s.responseLength,
  animationSpeed: s.animationSpeed,
  demoMode: s.demoMode,
  adultMode: s.adultMode,
  soundEnabled: s.soundEnabled,
  voiceEnabled: s.voiceEnabled,
  permissions: s.permissions ?? {},
});

router.get("/settings", requireAuth, async (req: any, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, req.userId))
    .limit(1);

  if (!row) {
    // Return defaults
    res.json({
      userId: req.userId,
      persona: "friend",
      language: "auto",
      responseStyle: "friendly",
      responseLength: "balanced",
      animationSpeed: "normal",
      demoMode: false,
      adultMode: false,
      soundEnabled: true,
      voiceEnabled: true,
      permissions: {},
    });
    return;
  }
  res.json(formatSettings(row));
});

router.put("/settings", requireAuth, async (req: any, res): Promise<void> => {
  const body = UpsertSettingsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const patch: any = {};
  if (body.data.persona != null) patch.persona = body.data.persona;
  if (body.data.language != null) patch.language = body.data.language;
  if (body.data.responseStyle != null) patch.responseStyle = body.data.responseStyle;
  if (body.data.responseLength != null) patch.responseLength = body.data.responseLength;
  if (body.data.animationSpeed != null) patch.animationSpeed = body.data.animationSpeed;
  if (body.data.demoMode != null) patch.demoMode = body.data.demoMode;
  if (body.data.adultMode != null) patch.adultMode = body.data.adultMode;
  if (body.data.soundEnabled != null) patch.soundEnabled = body.data.soundEnabled;
  if (body.data.voiceEnabled != null) patch.voiceEnabled = body.data.voiceEnabled;
  if (body.data.permissions != null) patch.permissions = body.data.permissions;

  const [existing] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, req.userId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(userSettingsTable)
      .set(patch)
      .where(eq(userSettingsTable.userId, req.userId))
      .returning();
    res.json(formatSettings(updated));
    return;
  }

  const [created] = await db
    .insert(userSettingsTable)
    .values({ userId: req.userId, ...patch })
    .returning();
  res.json(formatSettings(created));
});

// Profile
router.get("/profile", requireAuth, async (req: any, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, req.userId))
    .limit(1);

  if (!row) {
    res.json({ id: req.userId, displayName: "", mascotPersonality: "playful", email: null });
    return;
  }
  res.json({
    id: row.id,
    displayName: row.displayName,
    mascotPersonality: row.mascotPersonality,
    email: row.email ?? null,
  });
});

router.put("/profile", requireAuth, async (req: any, res): Promise<void> => {
  const body = UpsertProfileBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const patch: any = {};
  if (body.data.displayName != null) patch.displayName = body.data.displayName;
  if (body.data.mascotPersonality != null) patch.mascotPersonality = body.data.mascotPersonality;
  if (body.data.email != null) patch.email = body.data.email;

  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, req.userId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(profilesTable)
      .set(patch)
      .where(eq(profilesTable.id, req.userId))
      .returning();
    res.json({ id: updated.id, displayName: updated.displayName, mascotPersonality: updated.mascotPersonality, email: updated.email ?? null });
    return;
  }

  const [created] = await db
    .insert(profilesTable)
    .values({ id: req.userId, ...patch })
    .returning();
  res.json({ id: created.id, displayName: created.displayName, mascotPersonality: created.mascotPersonality, email: created.email ?? null });
});

export default router;
