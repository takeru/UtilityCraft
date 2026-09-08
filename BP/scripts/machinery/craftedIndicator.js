import * as DoriosLib from "DoriosLib/index.js";
import { TickScheduler } from "../DoriosCore/machinery/tickScheduler.js";
import { watchIndicatorStorage, hasIndicatorActivity } from "../DoriosCore/machinery/activitySignals.js";

const STATE = "utilitycraft:indicator_active";

DoriosLib.registry.blockComponent("utilitycraft:crafted_indicator", {
  onTick({ block }, { params }) {
    const entity = block.dimension.getEntitiesAtBlockLocation(block.location)
      .find(candidate => candidate.typeId === "utilitycraft:machine_entity");
    let active = false;
    if (entity) {
      if (params.mode === "display") {
        active = !!entity.getComponent("minecraft:inventory")?.container?.getItem(3);
      } else {
        if (["battery", "receiver", "xp"].includes(params.mode)) {
          watchIndicatorStorage(entity, params.mode === "xp" ? "fluid" : "energy",
            TickScheduler.getProcessingInterval(entity) + 8);
        }
        active = hasIndicatorActivity(entity);
      }
    }
    if (block.permutation.getState(STATE) !== active) {
      block.setPermutation(block.permutation.withState(STATE, active));
    }
  }
});
