import { system, world } from "@minecraft/server";

// Only machines with the crafted indicator component opt into storage observation.
// Runtime-only state prevents a saved pulse from surviving a world restart.
const watched = new Map();
const activeUntil = new Map();

export function watchIndicatorStorage(entity, kind, holdTicks = 28) {
  watched.set(entity.id, { kind, holdTicks: Math.max(28, holdTicks) });
}

export function pulseMachineIndicator(entity, holdTicks = 28) {
  if (!entity?.isValid) return;
  activeUntil.set(entity.id, Math.max(activeUntil.get(entity.id) ?? 0, system.currentTick + holdTicks));
}

export function hasIndicatorActivity(entity) {
  const end = activeUntil.get(entity.id) ?? 0;
  if (end > system.currentTick) return true;
  activeUntil.delete(entity.id);
  return false;
}

export function beginIndicatorStorageChange(storage, kind) {
  if (watched.get(storage.entity?.id)?.kind !== kind) return undefined;
  try { return storage.get(); } catch { return undefined; }
}

export function endIndicatorStorageChange(storage, before) {
  if (!Number.isFinite(before)) return;
  // Indicator failures must never abort a storage transaction.
  try {
    const after = storage.get();
    const watch = watched.get(storage.entity.id);
    if (watch && Number.isFinite(after) && before !== after) {
      pulseMachineIndicator(storage.entity, watch.holdTicks);
    }
  } catch {}
}

world.afterEvents.entityRemove.subscribe(({ removedEntityId }) => {
  watched.delete(removedEntityId);
  activeUntil.delete(removedEntityId);
});
