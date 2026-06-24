import { body } from "express-validator";

export const createLeadValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email is required"),
  body("mobile").trim().notEmpty().withMessage("Mobile is required").isMobilePhone("any").withMessage("Valid mobile number is required"),
  body("source")
    .trim()
    .notEmpty()
    .withMessage("Source is required")
    .isIn(["LinkedIn", "WhatsApp", "Website", "Referral", "Cold Call", "Other"])
    .withMessage("Invalid source value"),
  body("status")
    .optional()
    .isIn(["New Lead", "Called", "Interested", "Follow Up", "Demo Scheduled", "Demo Completed", "Closed Won", "Closed Lost"])
    .withMessage("Invalid status value"),
  body("expectedRevenue").optional().isFloat({ min: 0 }).withMessage("Expected revenue must be a positive number"),
  body("actualRevenue").optional().isFloat({ min: 0 }).withMessage("Actual revenue must be a positive number"),
  body("nextFollowUp").optional().isISO8601().withMessage("Valid date is required for next follow up"),
];

export const updateLeadValidator = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().trim().isEmail().withMessage("Valid email is required"),
  body("mobile").optional().trim().isMobilePhone("any").withMessage("Valid mobile number is required"),
  body("source")
    .optional()
    .isIn(["LinkedIn", "WhatsApp", "Website", "Referral", "Cold Call", "Other"])
    .withMessage("Invalid source value"),
  body("status")
    .optional()
    .isIn(["New Lead", "Called", "Interested", "Follow Up", "Demo Scheduled", "Demo Completed", "Closed Won", "Closed Lost"])
    .withMessage("Invalid status value"),
  body("expectedRevenue").optional().isFloat({ min: 0 }).withMessage("Expected revenue must be a positive number"),
  body("actualRevenue").optional().isFloat({ min: 0 }).withMessage("Actual revenue must be a positive number"),
  body("nextFollowUp").optional().isISO8601().withMessage("Valid date is required for next follow up"),
];