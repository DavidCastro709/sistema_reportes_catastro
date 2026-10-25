export function recordAudit(tx, { actorId, action, entity, entityId, oldValues = null, newValues = null, ipAddress = null }) {
  return tx.auditLog.create({
    data: { actorId, action, entity, entityId, oldValues, newValues, ipAddress },
  });
}
