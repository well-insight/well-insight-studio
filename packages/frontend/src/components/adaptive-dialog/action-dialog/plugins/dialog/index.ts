import { withInstall } from "element-plus/es/utils/index";
import Dialog from "./src/dialog.vue";

import type { SFCWithInstall } from "element-plus/es/utils/index";

export const ElDialog: SFCWithInstall<typeof Dialog> = withInstall(Dialog);
export default ElDialog;

export { Dialog };

export * from "./src/use-dialog";
export * from "./src/dialog";
export * from "./src/constants";
