import { Router } from "express";
import * as callController from "../controllers/call.controller";
import { createCallValidator } from "../validators/call.validator";

const router = Router();

router.get("/", callController.getAllCalls);
router.post("/", createCallValidator, callController.createCall);
router.delete("/:id", callController.deleteCall);

export default router;