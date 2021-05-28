import { withPluginApi } from "discourse/lib/plugin-api";
import { on } from "discourse-common/utils/decorators";

export default {
  name: "custom-new-banner",
  initialize() {
    withPluginApi("0.8", api => {
        api.modifyClass("controller:static", {
          @on("init")
          showNewsBannerOnStatic() {
            this.set("application.showFooter", true);
          }
        });
    });
  }
};
