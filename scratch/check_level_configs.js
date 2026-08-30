import l1 from "../apps/web/src/levels/level1/config.js";
import l2 from "../apps/web/src/levels/level2/config.js";
import l3 from "../apps/web/src/levels/level3/config.js";
import l4 from "../apps/web/src/levels/level4/config.js";
import l5 from "../apps/web/src/levels/level5/config.js";
import l6 from "../apps/web/src/levels/level6/config.js";
import l7 from "../apps/web/src/levels/level7/config.js";
import l8 from "../apps/web/src/levels/level8/config.js";
import l9 from "../apps/web/src/levels/level9/config.js";
import l10 from "../apps/web/src/levels/level10/config.js";
import l11 from "../apps/web/src/levels/level11/config.js";
import l12 from "../apps/web/src/levels/level12/config.js";
import l13 from "../apps/web/src/levels/finalBoss/config.js";

const configs = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10, l11, l12, l13];
configs.forEach((c, idx) => {
  console.log(`Level ${idx + 1} (${c.id}): title="${c.title}", duration=${c.durationSeconds}s (${c.durationSeconds / 60}m), basePoints=${c.basePoints}`);
});
