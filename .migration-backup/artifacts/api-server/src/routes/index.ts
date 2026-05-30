import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import memoriesRouter from "./memories";
import settingsRouter from "./settings";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(conversationsRouter);
router.use(memoriesRouter);
router.use(settingsRouter);
router.use(chatRouter);

export default router;
