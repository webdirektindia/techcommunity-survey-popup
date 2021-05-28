import { getOwner } from "discourse-common/lib/get-owner";
import { withPluginApi } from "discourse/lib/plugin-api";

export default {
	// Seting up New banner to display on the Topics under News category. [Added By: Saurabh, Date: 26/05/2021]
	setupComponent(args, component) {
		withPluginApi("0.8", (api) => {
			api.onPageChange((url) => {
				// Set showNewsBanner to false as default
				component.set('showNewsBanner', false);
				// Check if user is loged in.
				if(!api.getCurrentUser()){
					// Check whether current url is topic page URL
					if(/^\/t\//.test(url)){
						// Get the Topic controller to find which category of the current topic.
						const topicController = getOwner(this).lookup("controller:topic");
						// If Topic controller is not null then get the topic category
						if(topicController){
							// Get the topic category name
							let currentCategory= topicController.get("model.category.name");
							// If topic category is News then set showNewsBanner to true (This will display News banner on the News topics)
							if(currentCategory && currentCategory.toLowerCase() == 'news'){
								component.set('showNewsBanner', true);
							}
						}
					}
				}
			});
		});
	}
}
