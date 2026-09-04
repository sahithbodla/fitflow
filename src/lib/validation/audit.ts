import { z } from "zod";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit/actions";

export const auditLogFilterSchema = z.object({
  action: z.enum(AUDIT_ACTIONS).optional().catch(undefined),
  entityType: z.enum(AUDIT_ENTITY_TYPES).optional().catch(undefined),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
