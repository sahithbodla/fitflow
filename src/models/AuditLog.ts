import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import { AUDIT_ACTIONS } from "@/lib/audit/actions";

/**
 * A minimal, append-only record of who did what.
 *
 * Deliberately flat — `metadata` is a free-form object holding only the
 * useful fields for that one event (an amount, a status change, a reason),
 * never a full copy of the document it describes. See `src/lib/audit.ts` for
 * how entries are written.
 */
const auditLogSchema = new Schema(
  {
    actorUserId: { type: Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, enum: AUDIT_ACTIONS, index: true },
    entityType: { type: String, required: true, trim: true, maxlength: 60 },
    entityId: { type: String, required: true, trim: true, maxlength: 60 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    // No updatedAt — an audit entry is never edited after it's written.
    timestamps: { createdAt: true, updatedAt: false },
    collection: COLLECTIONS.auditLogs,
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema> & {
  _id: string;
};

export const AuditLog: Model<AuditLogDoc> =
  (models.AuditLog as Model<AuditLogDoc>) ??
  model<AuditLogDoc>("AuditLog", auditLogSchema);
