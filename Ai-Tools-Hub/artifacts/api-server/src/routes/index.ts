import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import toolsRouter from "./tools";
import miniToolsRouter from "./mini-tools";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", openaiRouter);
router.use("/tools", toolsRouter);
router.use("/tools", miniToolsRouter);

export default router;
