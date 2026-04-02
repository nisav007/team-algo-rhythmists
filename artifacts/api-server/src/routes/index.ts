import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fallsRouter from "./falls";
import contactsRouter from "./contacts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fallsRouter);
router.use(contactsRouter);

export default router;
