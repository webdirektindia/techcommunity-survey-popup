import EmberObject from "@ember/object";
import WidgetGlue from "discourse/widgets/glue";
import { getRegister } from "discourse-common/lib/get-owner";
import { observes } from "discourse-common/utils/decorators";
import { withPluginApi } from "discourse/lib/plugin-api";
import { getOwner } from "discourse-common/lib/get-owner";

function initializePolls(api) {
  debugger;
  const register = getRegister(api);

  api.modifyClass("controller:topic", {
    subscribe() {
      this._super(...arguments);
      this.messageBus.subscribe("/polls/" + this.get("model.id"), (msg) => {
        const post = this.get("model.postStream").findLoadedPost(msg.post_id);
        if (post) {
          post.set("polls", msg.polls);
        }
      });
    },
    unsubscribe() {
      this.messageBus.unsubscribe("/polls/*");
      this._super(...arguments);
    },
  });

  let _glued = [];
  let _interval = null;

  function rerender() {
    _glued.forEach((g) => g.queueRerender());
  }

  api.modifyClass("model:post", {
    _polls: null,
    pollsObject: null,

    // we need a proper ember object so it is bindable
    @observes("polls")
    pollsChanged() {
      const polls = this.polls;
      if (polls) {
        this._polls = this._polls || {};
        polls.forEach((p) => {
          const existing = this._polls[p.name];
          if (existing) {
            this._polls[p.name].setProperties(p);
          } else {
            this._polls[p.name] = EmberObject.create(p);
          }
        });
        this.set("pollsObject", this._polls);
        rerender();
      }
    },
  });

  function attachPolls($elem) {
    debugger;
    const $polls = $(".poll", $elem);
    if (!$polls.length) {
      return;
    }
    
    const topicRoute = getOwner(this).lookup("route:topic");
    let props = Object.assign({}, {'slug': 'test-topic-what-do-you-think-of-the-tech-forums' , 'id': 178});
    delete props.username_filters;
    delete props.filter;
    const topic = topicRoute.store.createRecord("topic", props);
    
    //const post = helper.getModel();
    const post = topic.postStream.posts[0];
    api.preventCloak(post.id);
    post.pollsChanged();

    const polls = post.pollsObject || {};
    const votes = post.polls_votes || {};

    _interval = _interval || setInterval(rerender, 30000);

    $polls.each((idx, pollElem) => {
      const $poll = $(pollElem);
      const pollName = $poll.data("poll-name");
      let poll = polls[pollName];
      let pollPost = post;
      let vote = votes[pollName] || [];

      const quotedId = $poll.parent(".expanded-quote").data("post-id");
      if (quotedId && post.quoted[quotedId]) {
        pollPost = post.quoted[quotedId];
        pollPost = EmberObject.create(pollPost);
        poll = EmberObject.create(
          pollPost.polls.find((p) => p.name === pollName)
        );
        vote = pollPost.polls_votes || {};
        vote = vote[pollName] || [];
      }

      if (poll) {
        const titleElement = pollElem.querySelector(".poll-title");

        const attrs = {
          id: `${pollName}-${pollPost.id}`,
          post: pollPost,
          poll,
          vote,
          titleHTML: titleElement && titleElement.outerHTML,
          groupableUserFields: (
            api.container.lookup("site-settings:main")
              .poll_groupable_user_fields || ""
          )
            .split("|")
            .filter(Boolean),
        };
        const glue = new WidgetGlue("discourse-poll", register, attrs);
        glue.appendTo(pollElem);
        _glued.push(glue);
      }
    });
  }

  function cleanUpPolls() {
    if (_interval) {
      clearInterval(_interval);
      _interval = null;
    }

    _glued.forEach((g) => g.cleanUp());
    _glued = [];
  }

  api.includePostAttributes("polls", "polls_votes");
  attachPolls($('.custom-survey-popup'));
  api.cleanupStream(cleanUpPolls);
}

export default {
  name: "techcommunity-survey-popup",

  initialize() {
    debugger;
    withPluginApi("0.8.7", initializePolls);
    this;
    
  },
};
