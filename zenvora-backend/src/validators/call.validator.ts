import { body } from "express-validator";

export const createCallValidator = [
  body("leadId")
    .trim()
    .notEmpty()
    .withMessage("Lead ID is required")
    .isMongoId()
    .withMessage("Valid Lead ID is required"),
  body("callDate")
    .optional()
    .isISO8601()
    .withMessage("Valid date is required for call date"),
  body("duration")
    .notEmpty()
    .withMessage("Duration is required")
    .isFloat({ min: 0 })
    .withMessage("Duration must be a positive number"),
  body("outcome")
    .trim()
    .notEmpty()
    .withMessage("Outcome is required")
    .isIn([
      "Interested",
      "Busy",
      "No Answer",
      "Call Back Later",
      "Not Interested",
    ])
    .withMessage("Invalid outcome value"),
  body("remarks").optional().trim(),
  body("nextFollowUp")
    .optional()
    .isISO8601()
    .withMessage("Valid date is required for next follow up"),
];