import { z } from "zod";

export const feedbackSchema = z.object({
  kind: z.enum(["feature_request", "bug_report"]),
  subject: z.string().trim().min(1, "Enter a subject.").max(160),
  message: z.string().trim().min(1, "Enter your request or bug details.").max(5000),
});
export type FeedbackInput = z.infer<typeof feedbackSchema>;