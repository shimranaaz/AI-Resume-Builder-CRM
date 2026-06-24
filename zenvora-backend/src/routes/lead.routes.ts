import { Router } from "express";
import * as leadController from "../controllers/lead.controller";
import { createLeadValidator, updateLeadValidator } from "../validators/lead.validator";

const router = Router();

router.get("/", leadController.getAllLeads);
router.get("/:id", leadController.getLeadById);
router.post("/", createLeadValidator, leadController.createLead);
router.put("/:id", updateLeadValidator, leadController.updateLead);
router.delete("/:id", leadController.deleteLead);

export default router;