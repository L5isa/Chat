(() => {
  "use strict";

  const KEY = "__rabbitMessagesGroupsV3";
  const STORE = "rabbit.chatGroups.open.v2";
  let attempts = 0;

  function start() {
    let doc;

    for (const win of [window, window.parent, window.top]) {
      try {
        if (win.document.querySelector("#chat")) {
          doc = win.document;
          break;
        }
      } catch {}
    }

    if (!doc?.body) {
      if (++attempts < 30) setTimeout(start, 1000);
      return;
    }

    const view = doc.defaultView;
    view[KEY]?.destroy();

    const DEFAULT_DOT = "#A0A0A0";
    const colorCache = new Map();
    const pendingAvatarTasks = new Set();
    const CHAT_MARK_STORE = "rabbit.chatGroups.chatBookmarks.v1";
    let chatBookmarks = new Set();

    try {
      const saved = JSON.parse(
        view.localStorage.getItem(CHAT_MARK_STORE) || "[]"
      );

      if (Array.isArray(saved)) {
        chatBookmarks = new Set(
          saved.filter(key => typeof key === "string")
        );
      }
    } catch {}

    let bookmarkSaveWarned = false;

    function saveChatBookmarks() {
      try {
        view.localStorage.setItem(
          CHAT_MARK_STORE,
          JSON.stringify([...chatBookmarks])
        );
        bookmarkSaveWarned = false;
        return true;
      } catch {
        if (!bookmarkSaveWarned) {
          bookmarkSaveWarned = true;
          view.alert("书签已在本次页面生效，但浏览器未能保存，刷新后可能丢失。");
        }
        return false;
      }
    }

    function avatarColor(src) {
      if (stopped || typeof src !== "string" || !src) {
        return Promise.resolve(DEFAULT_DOT);
      }

      if (colorCache.has(src)) {
        const cached = colorCache.get(src);
        colorCache.delete(src);
        colorCache.set(src, cached);
        return cached;
      }

      const task = new Promise(resolve => {
        const img = new view.Image();
        let finished = false;
        let timeout = 0;

        function finish(color) {
          if (finished) return;
          finished = true;
          view.clearTimeout(timeout);
          img.onload = null;
          img.onerror = null;
          pendingAvatarTasks.delete(cancel);
          resolve(color);
        }

        function cancel() {
          finish(DEFAULT_DOT);
          img.removeAttribute("src");
        }

        pendingAvatarTasks.add(cancel);
        timeout = view.setTimeout(cancel, 8000);
        img.crossOrigin = "anonymous";

        img.onload = () => {
          if (stopped) {
            cancel();
            return;
          }

          try {
            const canvas = doc.createElement("canvas");
            canvas.width = 24;
            canvas.height = 24;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
              finish(DEFAULT_DOT);
              return;
            }

            ctx.drawImage(img, 0, 0, 24, 24);

            const pixels = ctx.getImageData(0, 0, 24, 24).data;
            let red = 0;
            let green = 0;
            let blue = 0;
            let weight = 0;

            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              const alpha = pixels[i + 3] / 255;
              const light = (r + g + b) / 3;

              if (alpha < 0.5 || light < 30 || light > 235) continue;

              red += r * alpha;
              green += g * alpha;
              blue += b * alpha;
              weight += alpha;
            }

            if (!weight) {
              finish(DEFAULT_DOT);
              return;
            }

            const soften = value =>
              Math.round((value / weight) * 0.65 + 245 * 0.35);

            finish(
              `rgb(${soften(red)}, ${soften(green)}, ${soften(blue)})`
            );
          } catch {
            finish(DEFAULT_DOT);
          }
        };

        img.onerror = () => finish(DEFAULT_DOT);
        img.src = src;
      });

      colorCache.set(src, task);

      while (colorCache.size > 200) {
        colorCache.delete(colorCache.keys().next().value);
      }

      return task;
    }

const NATIVE_HEADER_STORE = "rabbit.chatGroups.hideNativeHeader.v1";
    let hideNativeHeader = true;

    try {
      const saved = view.localStorage.getItem(NATIVE_HEADER_STORE);

      if (saved === "false") {
        hideNativeHeader = false;
      }
    } catch {}

const PRIVACY_STORE = "rabbit.chatGroups.previewPrivacy.v1";
    let privateRoles = new Set();

    try {
      const saved = JSON.parse(
        view.localStorage.getItem(PRIVACY_STORE) || "[]"
      );

      if (Array.isArray(saved)) {
        privateRoles = new Set(
          saved.filter(name => typeof name === "string")
        );
      }
    } catch {}

    function togglePreviewPrivacy(name) {
      if (privateRoles.has(name)) {
        privateRoles.delete(name);
      } else {
        privateRoles.add(name);
      }

      try {
        view.localStorage.setItem(
          PRIVACY_STORE,
          JSON.stringify([...privateRoles])
        );
      } catch {
        view.alert("预览设置已在本次页面生效，但浏览器未能保存。");
      }

      refreshView();
    }

const HIDDEN_ROLE_STORE = "rabbit.chatGroups.hiddenRoles.v1";
    let hiddenRoles = new Set();

    try {
      const saved = JSON.parse(
        view.localStorage.getItem(HIDDEN_ROLE_STORE) || "[]"
      );

      if (Array.isArray(saved)) {
        hiddenRoles = new Set(
          saved.filter(name => typeof name === "string")
        );
      }
    } catch {}

    function toggleHiddenRole(name) {
      if (hiddenRoles.has(name)) {
        hiddenRoles.delete(name);
      } else {
        hiddenRoles.add(name);

        if (activePin === name) {
          activePin = null;
        }
      }

      try {
        view.localStorage.setItem(
          HIDDEN_ROLE_STORE,
          JSON.stringify([...hiddenRoles])
        );
      } catch {
        view.alert("隐藏设置已在本次页面生效，但浏览器未能保存。");
      }

      refreshView();
    }

const ALIAS_STORE = "rabbit.chatGroups.aliases.v1";
    let aliases = new Map();

    try {
      const saved = JSON.parse(
        view.localStorage.getItem(ALIAS_STORE) || "[]"
      );

      if (Array.isArray(saved)) {
        aliases = new Map(saved.filter(item =>
          Array.isArray(item) &&
          typeof item[0] === "string" &&
          typeof item[1] === "string" &&
          item[1].trim()
        ));
      }
    } catch {}

    function displayName(name) {
      return aliases.get(name) || name;
    }

    function saveAliases() {
      try {
        view.localStorage.setItem(
          ALIAS_STORE,
          JSON.stringify([...aliases])
        );
        return true;
      } catch {
        return false;
      }
    }

const ROLE_INDEX_STORE = "rabbit.chatGroups.roleIndex.v1";
    let roleIndex = new Map();

    try {
      const saved = JSON.parse(
        view.localStorage.getItem(ROLE_INDEX_STORE) || "[]"
      );

      if (Array.isArray(saved)) {
        roleIndex = new Map(
          saved.filter(item =>
            Array.isArray(item) &&
            typeof item[0] === "string" &&
            item[1] &&
            typeof item[1] === "object" &&
            !Array.isArray(item[1])
          ).map(([name, meta]) => [
            name,
            {
              avatar: typeof meta.avatar === "string" ? meta.avatar : "",
              count: Number.isSafeInteger(meta.count) && meta.count >= 0
                ? meta.count
                : 0
            }
          ])
        );
      }
    } catch {}

    function saveRoleIndex() {
      try {
        view.localStorage.setItem(
          ROLE_INDEX_STORE,
          JSON.stringify([...roleIndex])
        );
      } catch {}
    }

    let states = new Map();

    try {
      const saved = JSON.parse(view.localStorage.getItem(STORE) || "[]");
      states = new Map(saved.filter(item =>
        Array.isArray(item) &&
        typeof item[0] === "string" &&
        typeof item[1] === "boolean"
      ));
    } catch {}

    const style = doc.createElement("style");
    style.textContent = `

    #chat .welcomePanel {
  --rb-text: var(--SmartThemeBodyColor, #121212);
  --rb-secondary: var(--rb-text);
  --rb-secondary: color-mix(in srgb, var(--rb-text) 78%, transparent);
  --rb-muted: rgba(127, 127, 127, .88);
  --rb-muted: color-mix(in srgb, var(--rb-text) 58%, transparent);
  --rb-faint: rgba(127, 127, 127, .5);
  --rb-faint: color-mix(in srgb, var(--rb-text) 32%, transparent);
  --rb-line: rgba(127, 127, 127, .2);
  --rb-line: color-mix(in srgb, var(--rb-text) 14%, transparent);
  --rb-surface: rgba(127, 127, 127, .09);
  --rb-surface: color-mix(in srgb, var(--rb-text) 7%, transparent);
  --rb-surface-active: rgba(127, 127, 127, .15);
  --rb-surface-active: color-mix(in srgb, var(--rb-text) 12%, transparent);
  --rb-hover: rgba(127, 127, 127, .06);
  --rb-hover: color-mix(in srgb, var(--rb-text) 4%, transparent);
  --rb-focus: var(--rb-text);
  --rb-focus: color-mix(in srgb, var(--rb-text) 65%, transparent);
  --rb-danger: #c86d6d;
  --rb-danger: color-mix(in srgb, #d67878 72%, var(--rb-text));
  --rb-privacy-shadow: rgba(127, 127, 127, .65);
  --rb-privacy-shadow: color-mix(in srgb, var(--rb-text) 45%, transparent);
}

#chat .welcomePanel[data-rb-hide-native-header] .welcomeHeaderTitle,
#chat .welcomePanel[data-rb-hide-native-header] .welcomeHeader {
  display: none !important;
}

#chat .welcomePanel .rb-nav-button,
#chat .welcomePanel .rb-group-header,
#chat .welcomePanel .rb-bookmark,
#chat .welcomePanel .rb-chat-bookmark,
#chat .welcomePanel .rb-role-pin,
#chat .welcomePanel .rb-pin-tile,
#chat .welcomePanel .rb-content .rb-more,
#chat .welcomePanel .rb-list-more {
  background: transparent !important;
  background-color: transparent !important;
  background-image: none !important;
  border: 0 !important;
  box-shadow: none !important;
  text-shadow: none !important;
  filter: none !important;
}

#chat .welcomePanel .rb-nav-button,
#chat .welcomePanel .rb-group-header,
#chat .welcomePanel .rb-chat-bookmark,
#chat .welcomePanel .rb-role-pin,
#chat .welcomePanel .rb-pin-tile,
#chat .welcomePanel .rb-content .rb-more,
#chat .welcomePanel .rb-list-more {
  font-family: inherit !important;
  font-style: normal !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

#chat .welcomePanel .rb-nav-button,
#chat .welcomePanel .rb-group-header {
  color: var(--rb-text) !important;
}

#chat .welcomePanel .rb-pin-tile,
#chat .welcomePanel .rb-chat-bookmark,
#chat .welcomePanel .rb-role-pin,
#chat .welcomePanel .rb-content .rb-more,
#chat .welcomePanel .rb-list-more {
  color: var(--rb-muted) !important;
}

#chat .welcomePanel .rb-avatar,
#chat .welcomePanel .rb-pin-face,
#chat .welcomePanel .rb-pin-shadow,
#chat .welcomePanel .rb-pin-image,
#chat .welcomePanel .rb-content .recentChat .avatar,
#chat .welcomePanel .rb-content .recentChat .avatar img {
  background-image: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

#chat .welcomePanel .rb-avatar,
#chat .welcomePanel .rb-pin-image,
#chat .welcomePanel .rb-content .recentChat .avatar,
#chat .welcomePanel .rb-content .recentChat .avatar img {
  border-radius: 50% !important;
}

#chat .welcomePanel .rb-pin-face {
  background: transparent !important;
  border: 0 !important;
}

#chat .welcomePanel .rb-pin-tile::before,
#chat .welcomePanel .rb-nav-button::before,
#chat .welcomePanel .rb-nav-button::after,
#chat .welcomePanel .rb-group-header::after,
#chat .welcomePanel .rb-chat-bookmark::after,
#chat .welcomePanel .rb-role-pin::before,
#chat .welcomePanel .rb-role-pin::after,
#chat .welcomePanel .rb-content .rb-more::before,
#chat .welcomePanel .rb-content .rb-more::after {
  content: none !important;
  display: none !important;
}
      #chat .welcomePanel .recentChatList[data-rb-list] {
        display: flex;
        flex-direction: column;
        gap: 0;
        width: 100%;
        min-width: 0;
        margin: 0;
        padding: 0;
      }

#chat .welcomePanel .rb-search-panel {
        width: auto;
        min-width: 0;
        margin: 4px 12px 12px;
        padding: 0;
        box-sizing: border-box;
        font-family: inherit;
      }

      #chat .welcomePanel .rb-search-box {
        display: flex;
        align-items: center;
        gap: 0;
        min-height: 32px;
        box-sizing: border-box;
        padding: 5px 6px 6px;
        border: 0;
        border-radius: 11px;
        background: var(--rb-surface);
        color: var(--rb-muted);
      }

      #chat .welcomePanel .rb-search-icon {
        display: block;
        flex: 0 0 19px;
width: 19px;
height: 19px;
        color: var(--rb-muted);
      }

      #chat .welcomePanel .rb-search-input {
        display: block;
        flex: 1;
        width: 0;
        min-width: 0;
        height: 21px;
        min-height: 0;
        box-sizing: border-box;
        margin: 0 0 0 3px;
        padding: 0;
        border: 0 !important;
        outline: none !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: var(--rb-text) !important;
        -webkit-text-fill-color: var(--rb-text) !important;
        font-family: inherit;
        font-size: 14px;
        font-weight: 500;
        line-height: 21px;
        text-shadow: none !important;
        filter: none !important;
        appearance: none !important;
        -webkit-appearance: none !important;
      }

      #chat .welcomePanel .rb-search-input::placeholder {
        color: var(--rb-muted) !important;
        -webkit-text-fill-color: var(--rb-muted) !important;
        text-shadow: none !important;
        opacity: 1 !important;
      }

      #chat .welcomePanel .rb-search-mic {
        display: block;
        flex: 0 0 19px;
        width: 19px;
        height: 19px;
        margin-left: auto;
        color: var(--rb-muted) !important;
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
        pointer-events: none;
      }

#chat .welcomePanel .rb-search-clear {
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: center;
        flex: 0 0 19px;
        width: 19px;
        height: 21px;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        color: var(--rb-muted);
        font-size: 0;
        line-height: 0;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
      }

      #chat .welcomePanel .rb-search-clear svg {
        display: block;
        flex-shrink: 0;
        width: 16px;
        height: 16px;
        fill: currentColor;
        pointer-events: none;
      }

      #chat .welcomePanel .rb-search-clear:not([hidden]) + .rb-search-mic {
        display: none;
      }

      #chat .welcomePanel .rb-search-status {
        margin: 8px 2px 0;
        color: var(--rb-muted);
        font-size: 11px;
        line-height: 1.5;
      }

#chat .welcomePanel .rb-header-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: auto;
        min-width: 0;
        min-height: 36px;
        box-sizing: border-box;
        margin: 8px 8px 0 0;
        padding: 6px 12px;
        border: 0;
        border-radius: 9px;
        background: var(--rb-surface);
        box-shadow: none;
        color: var(--rb-secondary);
        font: inherit;
        font-size: 11px;
        line-height: 1.4;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -webkit-tap-highlight-color: transparent;
      }

#chat .welcomePanel .rb-header-toggle:active {
        background: var(--rb-surface-active);
      }

#chat .welcomePanel .rb-header-toggle:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: 2px;
      }

#chat .welcomePanel .rb-header-toggle[hidden] {
        display: none !important;
      }

.rb-hide-collapsed-setting {
  display: none !important;
}

#chat .welcomePanel .rb-list-more {
        display: flex;
        align-items: center;
        justify-content: center;
        order: 1;
        flex-shrink: 0;
        align-self: center;
        width: 44px;
        height: 44px;
        min-width: 44px;
        min-height: 44px;
        box-sizing: border-box;
        margin: 8px auto 12px;
        padding: 6px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        box-shadow: none;
        color: var(--rb-secondary);
        font: inherit;
        line-height: 1;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -webkit-tap-highlight-color: transparent;
      }

      #chat .welcomePanel .rb-list-more svg {
        display: block;
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        pointer-events: none;
        transition: transform .2s;
      }

      #chat .welcomePanel .rb-list-more[aria-expanded="true"] svg {
        transform: scaleY(-1);
      }

      #chat .welcomePanel .rb-list-more:active {
        background: transparent;
        opacity: .55;
      }

      #chat .welcomePanel .rb-list-more:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: 2px;
      }

      #chat .welcomePanel .rb-list-more[hidden] {
        display: none !important;
      }

      @media (prefers-reduced-motion: reduce) {
        #chat .welcomePanel .rb-list-more svg {
          transition: none;
        }
      }

      #chat .welcomePanel .rb-group {
        position: relative;
        display: block;
        min-width: 0;
        margin: 0;
        padding: 0;
        border: 0;
        background: transparent;
      }

      #chat .welcomePanel .rb-group[data-rb-unavailable] .rb-group-header {
        opacity: .5;
      }

      #chat .welcomePanel .rb-group[data-rb-unavailable] .rb-avatar {
        filter: grayscale(.35);
      }
#chat .welcomePanel .rb-group[data-rb-unavailable] .rb-arrow {
  display: none !important;
}
      #chat .welcomePanel .rb-group[data-rb-unavailable] .rb-date {
  margin-left: 2px;
  color: var(--rb-muted);
  font-size: 9px;
  font-weight: 500;
  line-height: 1.4;
}

      #chat .welcomePanel .rb-group[data-rb-unavailable] .rb-preview {
        color: var(--rb-faint);
      }

      #chat .welcomePanel .rb-group:not([hidden]) ~ .rb-group:not([hidden]):not([data-rb-top-pinned])::before,
      #chat .welcomePanel .rb-group[data-rb-first-ordinary]::before {
        content: "";
        position: absolute;
        top: 0;
        left: 76px;
        right: -16px;
        height: 1px;
        background: var(--rb-line);
        pointer-events: none;
      }

      #chat .welcomePanel .rb-group-header {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 72px;
        box-sizing: border-box;
        margin: 0;
        padding: 6px 12px 6px 19px;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        color: var(--rb-text);
        font: inherit;
        text-align: left;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
        -webkit-tap-highlight-color: transparent;
      }


      #chat .welcomePanel .rb-group-header:active {
        background: rgba(0, 0, 0, .025);
      }

      #chat .welcomePanel .rb-group-header:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: -2px;
      }

#chat .welcomePanel .rb-header-wrap {
        position: relative;
        min-width: 0;
      }

      #chat .welcomePanel .rb-bookmark {
        position: absolute;
        left: -6px;
        top: 50%;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 44px;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: transparent;
        box-shadow: none;
        transform: translateY(-50%);
        pointer-events: none;
        appearance: none;
        -webkit-appearance: none;
        -webkit-tap-highlight-color: transparent;
      }

      #chat .welcomePanel .rb-bookmark::before {
        content: "";
        display: block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--rb-dot-color, #A0A0A0);
        opacity: 0;
      }

#chat .welcomePanel .rb-bookmark[data-rb-marked]::before {
        opacity: 1;
      }

      #chat .welcomePanel .rb-bookmark:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: -2px;
      }

#chat .welcomePanel .rb-chat-bookmark {
        position: absolute;
        left: 4px;
        top: 28.5px;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 44px;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: transparent;
        box-shadow: none;
        transform: translateY(-50%);
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -webkit-tap-highlight-color: transparent;
      }

      #chat .welcomePanel .rb-chat-bookmark::before {
        content: "";
        display: block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--rb-dot-color, #A0A0A0);
        opacity: 0;
      }

      #chat .welcomePanel .rb-chat-bookmark[aria-pressed="true"]::before {
        opacity: 1;
      }

#chat .welcomePanel .recentChatList[data-rb-editing] .rb-chat-bookmark[aria-pressed="false"]::before {
        background: transparent;
        box-shadow: inset 0 0 0 1px var(--rb-dot-color, #A0A0A0);
        opacity: 1;
      }

      #chat .welcomePanel .rb-chat-bookmark:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: -2px;
      }

      #chat .welcomePanel .rb-avatar {
        position: relative;
        display: block !important;
        flex: 0 0 45px !important;
        width: 45px !important;
        height: 45px !important;
        min-width: 45px !important;
        min-height: 45px !important;
        max-width: 45px !important;
        max-height: 45px !important;
        box-sizing: border-box !important;
        padding: 0 !important;
        border: 0 !important;
        overflow: hidden !important;
        border-radius: 50% !important;
        background: var(--rb-line);
      }

      #chat .welcomePanel .rb-avatar img {
        display: block !important;
        width: 45px !important;
        height: 45px !important;
        min-width: 45px !important;
        min-height: 45px !important;
        max-width: 45px !important;
        max-height: 45px !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 50% !important;
        object-fit: cover !important;
        object-position: center !important;
      }

      #chat .welcomePanel .rb-body {
        flex: 1;
        min-width: 0;
      }

      #chat .welcomePanel .rb-heading {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        line-height: 22px;
      }

      #chat .welcomePanel .rb-name {
        min-width: 0;
        overflow: hidden;
        color: var(--rb-text);
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      #chat .welcomePanel .rb-date {
        flex-shrink: 0;
        margin-left: auto;
        color: var(--rb-muted);
        font-size: 12px;
        font-weight: 550;
        white-space: nowrap;
      }

      #chat .welcomePanel .rb-arrow {
        display: flex;
        flex: 0 0 15px;
        align-items: center;
        justify-content: center;
        color: #C7C7C9;
        transition: transform .2s;
      }

      #chat .welcomePanel .rb-group-header[aria-expanded="true"] .rb-arrow {
        transform: rotate(90deg);
      }

#chat .welcomePanel .rb-preview {
        display: -webkit-box;
        height: calc(2 * 1.32em);
        min-height: 0;
        max-height: calc(2 * 1.32em);
        margin-top: 2px;
        padding: 0;
        overflow: hidden;
        color: var(--rb-muted);
        font-size: 12px;
        font-weight: 500;
        line-height: 1.32;
        text-align: left;
        white-space: normal;
        overflow-wrap: anywhere;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

#chat .welcomePanel .rb-group[data-rb-private] .rb-preview,
      #chat .welcomePanel .rb-group[data-rb-private] .chatMessage {
        position: relative;
        isolation: isolate;
        color: transparent !important;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 6px var(--rb-privacy-shadow);
        user-select: none;
        -webkit-user-select: none;
        -webkit-mask-image:
          linear-gradient(to right,
            transparent,
            rgba(0, 0, 0, .5) 8px,
            #000 22px,
            #000 calc(100% - 22px),
            rgba(0, 0, 0, .5) calc(100% - 8px),
            transparent),
          linear-gradient(to bottom,
            transparent,
            #000 3px,
            #000 calc(100% - 3px),
            transparent);
        mask-image:
          linear-gradient(to right,
            transparent,
            rgba(0, 0, 0, .5) 8px,
            #000 22px,
            #000 calc(100% - 22px),
            rgba(0, 0, 0, .5) calc(100% - 8px),
            transparent),
          linear-gradient(to bottom,
            transparent,
            #000 3px,
            #000 calc(100% - 3px),
            transparent);
        -webkit-mask-composite: source-in;
        mask-composite: intersect;
      }

      #chat .welcomePanel .rb-group[data-rb-private] .chatMessage {
        height: calc(2 * 1.32em);
        min-height: calc(2 * 1.32em);
        max-height: calc(2 * 1.32em);
      }

      #chat .welcomePanel .rb-group[data-rb-private] .rb-preview *,
      #chat .welcomePanel .rb-group[data-rb-private] .chatMessage * {
        color: transparent !important;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 6px var(--rb-privacy-shadow);
      }

      #chat .welcomePanel .rb-group[data-rb-private] .rb-preview::after,
      #chat .welcomePanel .rb-group[data-rb-private] .chatMessage::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 1;
        width: 28px;
        height: 24px;      
        --rb-eye-icon:
url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='%232b2b2b'%3E%3Cpath d='M234.42,162A12,12,0,1,1,213.58,174l-16.86-29.5a127.19,127.19,0,0,1-30.17,13.86L171.84,190a12,12,0,0,1-9.87,13.8,11.22,11.22,0,0,1-2,.17,12,12,0,0,1-11.82-10L143,163.17a136.5,136.5,0,0,1-30.06,0L107.84,194A12,12,0,0,1,96,204a11.22,11.22,0,0,1-2-.17A12,12,0,0,1,84.16,190l5.29-31.72a127.19,127.19,0,0,1-30.17-13.86L42.42,174A12,12,0,1,1,21.58,162L40,129.85a159.73,159.73,0,0,1-17.31-18.31A12,12,0,0,1,41.34,96.46C57.38,116.32,85.44,140,128,140s70.62-23.68,86.66-43.54a12,12,0,0,1,18.67,15.08A159.73,159.73,0,0,1,216,129.85Z'/%3E%3C/svg%3E");
        background: var(--rb-text);
        -webkit-mask: var(--rb-eye-icon) center / 20px 20px no-repeat;
        mask: var(--rb-eye-icon) center / 20px 20px no-repeat;

        transform: translate(-50%, -50%);
        pointer-events: none;
      }

      #chat .welcomePanel .rb-role-actions {
        display: none;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: stretch;
        gap: 3px;
        margin: 0 12px 8px 76px;
        padding: 3px;
        border-radius: 10px;
        background: var(--rb-surface);
      }

      #chat .welcomePanel .recentChatList[data-rb-editing] .rb-role-actions {
        display: grid;
      }

      #chat .welcomePanel .rb-role-actions .rb-role-pin,
      #chat .welcomePanel .rb-role-actions .rb-privacy-toggle,
      #chat .welcomePanel .rb-role-actions .rb-hide-role {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-width: 0;
        min-height: 36px;
        box-sizing: border-box;
        margin: 0;
        padding: 5px 2px;
        border: 0;
        border-radius: 7px;
        background: transparent;
        box-shadow: none;
        color: var(--rb-secondary);
        font: inherit;
        font-size: 11px;
        line-height: 1.4;
        text-align: center;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -webkit-tap-highlight-color: transparent;
      }

#chat .welcomePanel .rb-role-actions .rb-privacy-toggle::before,
      #chat .welcomePanel .rb-role-actions .rb-hide-role::before {
        content: "";
        position: absolute;
        left: -2px;
        top: 50%;
        width: 1px;
        height: 16px;
        background: var(--rb-line);
        transform: translateY(-50%);
        pointer-events: none;
      }

      #chat .welcomePanel .rb-role-actions button:active {
        background: var(--rb-surface-active);
      }

      #chat .welcomePanel .rb-role-actions button:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: -2px;
      }

      #chat .welcomePanel .rb-content {
        display: flex;
        flex-direction: column;
        min-width: 0;
        margin: 0 12px 10px 34px;
        padding: 4px 0 0 10px;
        border-left: 0;
      }

      #chat .welcomePanel .rb-content .recentChat {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        margin: 0;
        position: relative;
        padding: 6px 4px 6px 28px;
        border: 0;
        border-bottom: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }

#chat .welcomePanel .rb-content .recentChat .avatar {
  position: relative !important;
  display: block !important;
  flex: 0 0 39px !important;
  width: 39px !important;
  height: 39px !important;
  min-width: 39px !important;
  min-height: 39px !important;
  max-width: 39px !important;
  max-height: 39px !important;
  box-sizing: border-box !important;
  align-self: flex-start;
  margin-top: 3px;
  padding: 0 !important;
  border: 0 !important;
  overflow: hidden !important;
  border-radius: 50% !important;
  clip-path: circle(50% at 50% 50%) !important;
  -webkit-clip-path: circle(50% at 50% 50%) !important;
  isolation: isolate;
}

#chat .welcomePanel .rb-content .recentChat .avatar img {
  display: block !important;
  width: 39px !important;
  height: 39px !important;
  min-width: 39px !important;
  min-height: 39px !important;
  max-width: 39px !important;
  max-height: 39px !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 50% !important;
  clip-path: circle(50% at 50% 50%) !important;
  -webkit-clip-path: circle(50% at 50% 50%) !important;
  object-fit: cover !important;
  object-position: center !important;
}

      #chat .welcomePanel .rb-content .characterName {
        display: none;
      }

      #chat .welcomePanel .rb-content .recentChatInfo,
      #chat .welcomePanel .rb-content .chatNameContainer,
      #chat .welcomePanel .rb-content .chatMessageContainer {
        min-width: 0;
      }

      #chat .welcomePanel .rb-content .chatDate {
        color: var(--rb-muted);
        font-size: 10px;
      }

      #chat .welcomePanel .rb-content .chatMessage {
        display: -webkit-box;
        overflow: hidden;
        color: var(--rb-muted);
        font-size: 12px;
        font-weight: 500;
        line-height: 1.32;
        white-space: normal;
        overflow-wrap: anywhere;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }

      #chat .welcomePanel .recentChatList[data-rb-list] > .showMoreChats,
#chat .welcomePanel .rb-group[hidden],
#chat .welcomePanel .rb-content[hidden],
#chat .welcomePanel .rb-content .recentChat[hidden],
#chat .welcomePanel .rb-search-clear[hidden],
#chat .welcomePanel .rb-search-status[hidden] {
  display: none !important;
}

#chat .welcomePanel .rb-content .recentChatInfo {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 28px;
        align-items: start;
        gap: 3px 6px;
        flex: 1;
        width: auto;
        min-width: 0;
      }

      #chat .welcomePanel .rb-content .chatNameContainer,
      #chat .welcomePanel .rb-content .chatMessageContainer {
        display: contents;
      }

      #chat .welcomePanel .rb-content .chatName,
      #chat .welcomePanel .rb-content .chatDate {
        display: none;
      }

      #chat .welcomePanel .rb-short-name {
        grid-column: 1;
        grid-row: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-self: center;
        gap: 1px;
        min-width: 0;
        min-height: 28px;
        padding: 2px 0;
        overflow: hidden;
        text-align: left;
      }

      #chat .welcomePanel .rb-chat-custom-name {
        display: block;
        min-width: 0;
        overflow: hidden;
        color: var(--rb-secondary);
        font-size: 13px;
        font-weight: 500;
        line-height: 1.4;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      #chat .welcomePanel .rb-chat-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 2px 5px;
        min-width: 0;
        color: var(--rb-muted);
        font-size: 11px;
        font-weight: 450;
        line-height: 1.5;
        text-align: left;
      }

#chat .welcomePanel .rb-content .recentChat > .recentChatPinned {
        display: none !important;
      }

      #chat .welcomePanel .recentChatList:not([data-rb-inbox]) .rb-content .recentChat[data-rb-pinned] > .recentChatPinned {
        position: absolute;
        inset: auto;
        left: 4px;
        top: 28.5px;
        z-index: 1;
        display: flex !important;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 44px;
        min-width: 0;
        min-height: 0;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        color: var(--rb-secondary);
        line-height: 1;
        transform: translateY(-50%);
        pointer-events: none;
      }

      #chat .welcomePanel .rb-content .recentChat[data-rb-pinned] > .recentChatPinned .fa-thumbtack {
        margin: 0;
        padding: 0;
        color: inherit;
        font-size: 10px;
        line-height: 1;
      }

      #chat .welcomePanel .recentChatList:not([data-rb-inbox]) .rb-content .recentChat[data-rb-pinned] > .rb-chat-bookmark {
        display: none !important;
      }


      #chat .welcomePanel .rb-meta-time {
        white-space: nowrap;
      }

      #chat .welcomePanel .rb-meta-dot {
        flex: 0 0 auto;
        color: #aaa8a2;
      }

      #chat .welcomePanel .rb-chat-meta .rb-meta-stat {
        display: inline-flex;
        align-items: center;
        flex: 0 0 auto;
        gap: 4px;
        width: auto;
        min-width: 0;
        margin: 0;
        padding: 0;
        color: inherit;
        font-size: inherit;
        line-height: inherit;
        white-space: nowrap;
      }

      #chat .welcomePanel .rb-meta-stat small {
        margin: 0;
        padding: 0;
        color: var(--rb-muted) !important;
        font-size: inherit;
        font-weight: inherit;
        line-height: inherit;
      }

      #chat .welcomePanel .rb-meta-stat svg {
        display: block;
        flex-shrink: 0;
        width: 10px;
        height: 10px;
        color: inherit;
      }

      #chat .welcomePanel .rb-meta-stat i,
      #chat .welcomePanel .rb-meta-stat [class*="fa-"] {
        color: inherit;
        font-size: 10px;
      }

      #chat .welcomePanel .rb-content .rb-more {
        grid-column: 2;
        grid-row: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        min-width: 0;
        min-height: 0;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 7px;
        background: transparent;
        box-shadow: none;
        color: var(--rb-muted);
        font: 600 20px/1 Arial, sans-serif;
        letter-spacing: 0;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
      }

      #chat .welcomePanel .rb-content .rb-more[aria-expanded="true"] {
        background: var(--rb-surface);
        color: var(--rb-text);
      }

      #chat .welcomePanel .rb-content .rb-more:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: -2px;
      }

      #chat .welcomePanel .rb-content .chatMessage {
        grid-column: 1 / -1;
        grid-row: 2;
        min-width: 0;
        width: auto;
        margin: 0;
      }

      #chat .welcomePanel .rb-content .chatActions,
      #chat .welcomePanel .rb-content .chatStats {
        display: none !important;
      }

      #chat .welcomePanel .rb-content .recentChat[data-rb-tools] .chatActions {
        grid-column: 1 / -1;
        grid-row: 3;
        display: flex !important;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-start;
        gap: 0;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        margin: 7px 0 2px;
        padding: 3px 5px;
        border: 0;
        border-radius: 10px;
        background: var(--rb-surface);
        box-shadow: none;
      }

      #chat .welcomePanel .rb-content .chatActions > button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 1 1 44px;
        width: auto;
        height: 40px;
        min-width: 44px;
        min-height: 0;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 7px;
        background: transparent;
        box-shadow: none;
        color: var(--rb-secondary);
        font-size: 14px;
        line-height: 1;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        -webkit-tap-highlight-color: transparent;
      }

      #chat .welcomePanel .rb-content .chatActions > button + button::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        width: 1px;
        height: 14px;
        background: var(--rb-line);
        transform: translateY(-50%);
        pointer-events: none;
      }

      #chat .welcomePanel .rb-content .chatActions > button:active {
        background: var(--rb-surface-active);
      }

      #chat .welcomePanel .rb-content .chatActions > button:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: -3px;
      }

      #chat .welcomePanel .rb-content .chatActions > .deleteChat {
        color: var(--rb-danger);
      }

#chat .welcomePanel .rb-topbar {
        display: grid;
        grid-template-columns: 60px minmax(0, 1fr) 60px;
        align-items: center;
        padding: 7px 0 8px;
        color: var(--rb-text);
      }

      #chat .welcomePanel .rb-nav-button {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 60px;
        height: 44px;
        min-width: 0;
        min-height: 0;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        color: var(--rb-text);
        font-family: inherit;
        font-size: 15px;
font-weight: 600;
        line-height: 1;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
      }

      #chat .welcomePanel .rb-nav-title {
        min-width: 0;
        overflow: hidden;
        color: var(--rb-text);
        font-size: 19px;
        font-weight: 650;
        line-height: 1.3;
        text-align: center;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #chat .welcomePanel .rb-inbox-button {
        justify-content: flex-end;
      }

      #chat .welcomePanel .rb-inbox-button > svg {
        display: block;
        width: 26px;
        height: 26px;
        pointer-events: none;
      }

      #chat .welcomePanel .rb-pin-bar {
        display: block;
        width: 100%;
        min-width: 0;
        padding: 13px 0 0;
        box-sizing: border-box;
      }

      #chat .welcomePanel .rb-pin-track {
        display: flex;
        width: 100%;
        min-width: 0;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-snap-type: x mandatory;
        overscroll-behavior-x: contain;
        scrollbar-width: none;
        direction: ltr;
      }

      #chat .welcomePanel .rb-pin-track::-webkit-scrollbar {
        display: none;
      }

#chat .welcomePanel .rb-pin-page {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 32px;
        flex: 0 0 100%;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        padding: 0 0 3px;
        scroll-snap-align: start;
        scroll-snap-stop: always;
      }

      #chat .welcomePanel .rb-pin-editor {
        margin-top: 8px;
        padding: 10px;
        border-radius: 11px;
        background: var(--rb-surface);
      }

      #chat .welcomePanel .rb-pin-editor-title {
        overflow: hidden;
        margin-bottom: 8px;
        color: var(--rb-secondary);
        font-size: 12px;
        line-height: 1.5;
        text-align: center;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      #chat .welcomePanel .rb-pin-editor-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4px;
      }

      #chat .welcomePanel .rb-pin-action {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-width: 0;
        min-height: 40px;
        box-sizing: border-box;
        margin: 0;
        padding: 6px 2px;
        border: 0;
        border-radius: 7px;
        background: var(--rb-surface);
        box-shadow: none;
        color: var(--rb-secondary);
        font: inherit;
        font-size: 11px;
        line-height: 1.4;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
      }

      #chat .welcomePanel .rb-pin-action:disabled {
        opacity: .35;
        cursor: default;
      }

      #chat .welcomePanel .rb-pin-action[data-rb-remove] {
        grid-column: 1 / -1;
        color: var(--rb-danger);
      }

#chat .welcomePanel .rb-pin-action:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: -2px;
      }


      #chat .welcomePanel .rb-pin-tile {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 0 0 calc((100% - 64px) / 3);
        width: calc((100% - 64px) / 3);
        min-width: 0;
        min-height: 0;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
        color: var(--rb-muted);
        font: inherit;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
      }

      #chat .welcomePanel .rb-pin-face {
        position: relative;
        isolation: isolate;
        display: block;
        flex: none;
        width: min(100%, 80px) !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        box-sizing: border-box !important;
        margin: 0 auto 20px;
        padding: 0 !important;
        overflow: visible;
      }

      #chat .welcomePanel .rb-pin-face::before {
        content: "" !important;
        display: block !important;
        position: static !important;
        width: 100%;
        height: 0 !important;
        margin: 0 !important;
        padding: 100% 0 0 !important;
        border: 0 !important;
        box-sizing: content-box !important;
        background: none !important;
      }

      #chat .welcomePanel .rb-pin-face::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        border-radius: 50%;
        background: #000;
        transform: translateY(11px) scale(.78);
        filter: blur(12px);
        opacity: .06;
        pointer-events: none;
      }

      #chat .welcomePanel .rb-pin-shadow {
        position: absolute;
        left: 50%;
        top: 62%;
        z-index: 1;
        display: block;
        width: 86%;
        height: 58%;
        border: 0;
        border-radius: 50%;
        object-fit: cover;
        object-position: center bottom;
        transform: translate(-50%, -50%) translateY(11px) scale(.5);
        filter: blur(12px);
        opacity: .7;
        pointer-events: none;
        -webkit-mask-image: linear-gradient(to bottom, transparent, black 35%);
        mask-image: linear-gradient(to bottom, transparent, black 35%);
      }

      #chat .welcomePanel .rb-pin-image {
        position: absolute !important;
        inset: 0 !important;
        z-index: 2;
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        max-width: none !important;
        max-height: none !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        border: 0 !important;
        border-radius: 50% !important;
        background: var(--rb-line);
        object-fit: cover !important;
        object-position: center !important;
      }

      #chat .welcomePanel .rb-pin-name {
        display: block;
        max-width: 90px;
        margin-top: -13px;
        overflow: hidden;
        color: var(--rb-muted);
        font-size: 11px;
        font-weight: 600;
        line-height: 1.5;
        text-align: center;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

#chat .welcomePanel .rb-pin-tile::after {
        content: "";
        display: block;
        flex-shrink: 0;
        width: 5px;
        height: 5px;
        margin-top: 6px;
        border-radius: 50%;
        background: var(--rb-dot-color, #A0A0A0);
        opacity: 0;
        pointer-events: none;
      }

      #chat .welcomePanel .rb-pin-tile[data-rb-selected]::after {
        opacity: 1;
      }

      #chat .welcomePanel .rb-pin-tile[data-rb-selected] .rb-pin-name {
        color: var(--rb-text);
      }

      #chat .welcomePanel .rb-pin-tile[data-rb-unavailable] .rb-pin-face {
        opacity: .55;
      }

      #chat .welcomePanel .rb-pin-unavailable {
        display: block;
        margin-top: 1px;
        color: var(--rb-faint);
        font-size: 9px;
        font-weight: 500;
        line-height: 1.3;
        text-align: center;
        white-space: nowrap;
      }

     #chat .welcomePanel .recentChatList[data-rb-editing] .rb-bookmark {
        visibility: hidden;
        pointer-events: none;
      }

      #chat .welcomePanel .rb-nav-button:focus-visible,
      #chat .welcomePanel .rb-pin-tile:focus-visible {
        outline: 2px solid var(--rb-focus);
        outline-offset: 2px;
      }

      #chat .welcomePanel .rb-pin-bar[hidden] {
        display: none !important;
      }

      @media (prefers-reduced-motion: reduce) {
        #chat .welcomePanel .rb-arrow {
          transition: none;
        }
      }
    `;
    doc.head.appendChild(style);

    const toolbar = doc.createElement("div");
    toolbar.className = "rb-search-panel";
toolbar.innerHTML = `
      <div class="rb-search-box">
        <svg class="rb-search-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24" aria-hidden="true">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path fill="currentColor" d="M10.5 18q-3.125 0-5.313-2.187T3 10.5t2.188-5.312T10.5 3t5.313 2.188T18 10.5t-2.187 5.313T10.5 18m0-2q2.3 0 3.9-1.6T16 10.5t-1.6-3.9T10.5 5T6.6 6.6T5 10.5t1.6 3.9t3.9 1.6"/>
          <line x1="16" y1="16" x2="19.45" y2="19.45"
            stroke="currentColor" stroke-width="2.8"
            stroke-linecap="round"/>
        </svg>
        <input class="rb-search-input" type="text"
          placeholder="Search" aria-label="搜索已加载的聊天"
          autocomplete="off" enterkeyhint="search">
        <button class="rb-search-clear" type="button"
          aria-label="清空搜索" hidden>
          <svg xmlns="http://www.w3.org/2000/svg"
            width="16" height="16" fill="currentColor"
            viewBox="0 0 256 256" aria-hidden="true">
            <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path>
          </svg>
        </button>
        <svg class="rb-search-mic"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512" aria-hidden="true">
          <path
            style="fill:none !important;stroke:currentColor !important;stroke-width:40px !important;stroke-linecap:round !important;stroke-linejoin:round !important;filter:none !important"
            d="M176 448h160m48-240v32c0 70.4-57.6 128-128 128h0c-70.4 0-128-57.6-128-128v-32m128 160v80"/>
          <rect x="188" y="54" width="136" height="259" rx="68"
            style="fill:currentColor !important;stroke:none !important;filter:none !important"/>
        </svg>
      </div>
      <div class="rb-search-status" role="status" hidden></div>
      <button class="rb-header-toggle" type="button" hidden></button>
      <button class="rb-header-toggle rb-chat-count-settings"
        type="button" hidden>调整最近聊天数量</button>
    `;

    const topbar = make("div", "rb-topbar");
    const maskId = "rb-frame-" + Math.random().toString(36).slice(2);

    topbar.innerHTML = `
      <button class="rb-nav-button rb-edit-button"
        type="button">Edit</button>
      <div class="rb-nav-title">Messages</div>
      <button class="rb-nav-button rb-inbox-button"
        type="button" aria-label="打开书签收件箱"
        aria-pressed="false">
        <svg xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 5120 5120"
          preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <defs>
            <mask id="${maskId}" maskUnits="userSpaceOnUse"
              x="0" y="0" width="5120" height="5120">
              <rect x="0" y="0" width="5120" height="5120" fill="white"/>
              <path d="M2860 2320 L4520 660" stroke="black"
                stroke-width="1080" stroke-linecap="butt" fill="none"/>
            </mask>
          </defs>
          <g mask="url(#${maskId})">
            <rect x="760" y="1420" width="2900" height="2900"
              rx="340" ry="340" fill="none" stroke="currentColor"
              stroke-width="400" stroke-linejoin="round"/>
          </g>
          <g transform="translate(1700, 300) scale(0.6)">
            <g transform="translate(3480,2050) rotate(-45) scale(1.4, 0.5) rotate(45) translate(-3480,-2050)">
              <g transform="translate(0,5120) scale(1,-1)" fill="currentColor" stroke="none">
                <path d="M1968 2873 l-907 -908 904 -907 905 906 904 905 -94 98 c-71 74 -803 813 -805 813 0 0 -408 -408 -907 -907z"/>
              </g>
              <g transform="translate(1513,3608) rotate(-45) scale(0.4, 1) rotate(45) translate(-1513,-3608)">
                <g transform="translate(0,5120) scale(1,-1)" fill="currentColor" stroke="none">
                  <path d="M1061 1965 l-312 -630 c-329 -665 -335 -680 -309 -760 16 -48 63 -101 113 -127 32 -16 53 -19 101 -16 56 5 113 31 686 316 l625 310 -904 907z"/>
                </g>
              </g>
            </g>
            <g transform="translate(90, -90) translate(3480,2050) rotate(-45) scale(0.5, 0.5) rotate(45) translate(-3480,-2050)">
              <g transform="translate(0,5120) scale(1,-1)" fill="currentColor" stroke="none">
                <path d="M3896 4675 c-83 -21 -191 -76 -252 -127 -28 -24 -144 -138 -257 -254 l-206 -210 452 -452 452 -452 232 232 c251 254 297 313 340 442 23 69 27 98 27 196 -1 99 -4 126 -28 195 -69 201 -222 354 -416 416 -86 28 -260 35 -344 14z"/>
              </g>
            </g>
          </g>
        </svg>
      </button>
    `;

    const pinBar = make("div", "rb-pin-bar");
    pinBar.hidden = true;

    toolbar.prepend(topbar);
    toolbar.appendChild(pinBar);

    const editButton = topbar.querySelector(".rb-edit-button");
    const inboxButton = topbar.querySelector(".rb-inbox-button");
    const navTitle = topbar.querySelector(".rb-nav-title");
    const input = toolbar.querySelector("input");
    const clearButton = toolbar.querySelector(".rb-search-clear");
    const status = toolbar.querySelector(".rb-search-status");
    const headerToggle = toolbar.querySelector(".rb-header-toggle");
    const chatCountSettings = toolbar.querySelector(
      ".rb-chat-count-settings"
    );

 let settingsButton = null;
    let settingsTimer = 0;
    let settingsDialog = null;
    let settingsRow = null;

    function clearSettingsRow() {
      if (settingsDialog) {
        settingsDialog.removeEventListener("close", clearSettingsRow);
      }

      settingsRow?.classList.remove("rb-hide-collapsed-setting");
      settingsDialog = null;
      settingsRow = null;
    }

    function handleNativeSettingsClick() {
      view.clearTimeout(settingsTimer);
      settingsTimer = 0;
      clearSettingsRow();

      doc.querySelectorAll(".rb-hide-collapsed-setting")
        .forEach(row => {
          row.classList.remove("rb-hide-collapsed-setting");
        });
    }

    function openRecentChatsSettings() {
      if (stopped) return;

      const nativeButton = doc.querySelector(
        "#chat .welcomePanel .recentChatsSettings"
      );

      if (!nativeButton) {
        view.alert("暂时没有找到最近聊天设置，请刷新页面后再试。");
        return;
      }

      if (settingsButton !== nativeButton) {
        settingsButton?.removeEventListener(
          "click",
          handleNativeSettingsClick
        );

        settingsButton = nativeButton;
        settingsButton.addEventListener(
          "click",
          handleNativeSettingsClick
        );
      }

      nativeButton.click();

      let attempts = 0;

      function simplifySettings() {
        settingsTimer = 0;
        if (stopped) return;

        const dialog = [...doc.querySelectorAll("dialog.popup")]
          .find(item =>
            item.open &&
            item.querySelector("#collapsedRecentChats")
          );

        const row = dialog
          ?.querySelector("#collapsedRecentChats")
          ?.closest("label");

        if (!row) {
          attempts++;

          if (attempts < 20) {
            settingsTimer = view.setTimeout(simplifySettings, 50);
          }

          return;
        }

        clearSettingsRow();
        settingsDialog = dialog;
        settingsRow = row;
        row.classList.add("rb-hide-collapsed-setting");
        dialog.addEventListener("close", clearSettingsRow);
      }

      settingsTimer = view.setTimeout(simplifySettings, 0);
    }

    chatCountSettings.addEventListener(
      "click",
      openRecentChatsSettings
    );

    function applyNativeHeaderVisibility() {
      const panel =
        list?.closest(".welcomePanel") ||
        doc.querySelector("#chat .welcomePanel");

      if (!panel) return;

      panel.toggleAttribute(
        "data-rb-hide-native-header",
        hideNativeHeader
      );

      headerToggle.textContent = hideNativeHeader
        ? "显示原顶栏"
        : "隐藏原顶栏";

      headerToggle.setAttribute(
        "aria-pressed",
        String(!hideNativeHeader)
      );
    }

    headerToggle.addEventListener("click", () => {
      hideNativeHeader = !hideNativeHeader;

      try {
        view.localStorage.setItem(
          NATIVE_HEADER_STORE,
          String(hideNativeHeader)
        );
      } catch {
        view.alert("顶栏设置已在本次页面生效，但浏览器未能保存。");
      }

      applyNativeHeaderVisibility();
    });
    

    let list = null;
    let groups = [];
    let previous = [];
    let timer = 0;
    let stopped = false;
    const originals = new Map();
    const temporaryStates = new Map();
    const PIN_STORE = "rabbit.chatGroups.rolePins.v1";
    const PIN_META_STORE = "rabbit.chatGroups.rolePinMeta.v1";
    let rolePins = [];
    let rolePinMeta = new Map();
    let activePin = null;
    let editing = false;
    let inboxMode = false;
    let homeQuery = "";
    let pinSignature = "";
    let selectedPin = null;
    let pinPage = 0;
    let extraRolesOpen = false;

    const listMoreButton = make("button", "rb-list-more");
    listMoreButton.type = "button";
    listMoreButton.hidden = true;
    listMoreButton.setAttribute("aria-expanded", "false");
    listMoreButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg"
        width="32" height="32" fill="currentColor"
        viewBox="0 0 256 256" aria-hidden="true">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm37.66-85.66a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L120,148.69V88a8,8,0,0,1,16,0v60.69l18.34-18.35A8,8,0,0,1,165.66,130.34Z"></path>
      </svg>
    `;

    listMoreButton.addEventListener("click", () => {
      const collapsing = extraRolesOpen;
      extraRolesOpen = !extraRolesOpen;
      refreshView();

      if (collapsing) {
        view.requestAnimationFrame(() => {
          if (stopped || !listMoreButton.isConnected) return;

          const rect = listMoreButton.getBoundingClientRect();

          if (rect.top < 0 || rect.bottom > view.innerHeight) {
            listMoreButton.scrollIntoView({
              block: "nearest",
              behavior: "auto"
            });
          }
        });
      }
    });

let pinResizeObserver = null;
    let pinLayoutFrame = 0;
    let alignPinTrack = () => {};

    function handlePinResize() {
      alignPinTrack();
    }

    view.addEventListener("resize", handlePinResize);

    try {
      const saved = JSON.parse(
        view.localStorage.getItem(PIN_STORE) || "[]"
      );

      if (Array.isArray(saved)) {
        rolePins = [...new Set(
          saved.filter(name => typeof name === "string")
        )];
      }
    } catch {}

    try {
      const saved = JSON.parse(
        view.localStorage.getItem(PIN_META_STORE) || "[]"
      );

      if (Array.isArray(saved)) {
        rolePinMeta = new Map(
          saved.filter(item =>
            Array.isArray(item) &&
            typeof item[0] === "string" &&
            item[1] &&
            typeof item[1] === "object" &&
            !Array.isArray(item[1])
          ).map(([name, meta]) => [
            name,
            {
              avatar: typeof meta.avatar === "string" ? meta.avatar : "",
              label: typeof meta.label === "string" ? meta.label : name
            }
          ])
        );
      }
    } catch {}

    function saveRolePinMeta() {
      try {
        view.localStorage.setItem(
          PIN_META_STORE,
          JSON.stringify([...rolePinMeta])
        );
      } catch {}
    }

    function saveRolePins() {
      try {
        view.localStorage.setItem(PIN_STORE, JSON.stringify(rolePins));
      } catch {
        view.alert("置顶已在本次页面生效，但浏览器未能保存。");
      }
    }

    function chatBookmarkKey(record) {
      return JSON.stringify([
        record.name,
        record.chatTitle || record.chatName
      ]);
    }

    function refreshView() {
      observer.disconnect();
      shellObserver.disconnect();

      try {
        filterGroups();
      } finally {
        observe();
      }
    }

   function toggleRolePin(name) {
      const index = rolePins.indexOf(name);

      if (index !== -1) {
        rolePins.splice(index, 1);
        rolePinMeta.delete(name);
        saveRolePinMeta();

        if (activePin === name) activePin = null;
        if (selectedPin === name) selectedPin = null;

        pinPage = Math.min(
          pinPage,
          Math.max(0, Math.ceil(rolePins.length / 3) - 1)
        );
      } else {
        rolePins.push(name);
        selectedPin = editing ? name : null;
        pinPage = Math.floor((rolePins.length - 1) / 3);
      }

      saveRolePins();
      refreshView();
    }

function updatePinBar() {
      const searching = Boolean(input.value.trim());
      const visiblePins = editing
        ? [...rolePins]
        : rolePins.filter(name => !hiddenRoles.has(name));

      const hidden =
        inboxMode ||
        searching ||
        !visiblePins.length;

      pinBar.hidden = hidden;

      if (!editing || !visiblePins.includes(selectedPin)) {
        selectedPin = null;
      }

      if (hidden) return;

      let pinMetaChanged = false;

      const items = visiblePins.map(name => {
        const group = groups.find(item => item.name === name);
        const cached = rolePinMeta.get(name) || {};
        const indexed = roleIndex.get(name) || {};
        const available = Boolean(group?.records.length);
        const loadedAvatar = available
          ? group.records.find(record => record.avatar)?.avatar || ""
          : "";
        const label = displayName(name);

        if (
          available &&
          (
            cached.avatar !== loadedAvatar ||
            cached.label !== label
          )
        ) {
          rolePinMeta.set(name, {
            avatar: loadedAvatar,
            label
          });

          pinMetaChanged = true;
        }

        return {
          name,
          label,
          avatar:
            loadedAvatar ||
            cached.avatar ||
            indexed.avatar ||
            "",
          available
        };
      });

      if (pinMetaChanged) {
        saveRolePinMeta();
      }

      const pageCount = Math.ceil(items.length / 3);
      pinPage = Math.max(0, Math.min(pinPage, pageCount - 1));

      const signature = JSON.stringify([
        editing,
        activePin,
        selectedPin,
        items,
        [...privateRoles],
        [...hiddenRoles]
      ]);

      if (signature === pinSignature) {
        alignPinTrack();
        return;
      }

      pinSignature = signature;
      pinResizeObserver?.disconnect();
      view.cancelAnimationFrame(pinLayoutFrame);
      pinBar.replaceChildren();

      const track = make("div", "rb-pin-track");
      track.setAttribute("role", "region");
      track.setAttribute("aria-label", "置顶角色，左右滑动翻页");
      track.tabIndex = 0;

      let trackWidth = 0;

      function goToPage(index) {
        pinPage = Math.max(0, Math.min(index, pageCount - 1));

        const width = track.clientWidth;
        if (!width) return;

        trackWidth = width;

        track.scrollTo({
          left: width * pinPage,
          behavior: "auto"
        });
      }

      alignPinTrack = () => {
        view.cancelAnimationFrame(pinLayoutFrame);

        pinLayoutFrame = view.requestAnimationFrame(() => {
          pinLayoutFrame = 0;

          if (
            stopped ||
            !track.isConnected ||
            pinBar.hidden ||
            !track.clientWidth
          ) return;

          goToPage(pinPage);
        });
      };

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        const page = make("div", "rb-pin-page");
        page.setAttribute("role", "group");
        page.setAttribute(
          "aria-label",
          `第 ${pageIndex + 1} 页，共 ${pageCount} 页`
        );

        const pageItems = items.slice(pageIndex * 3, pageIndex * 3 + 3);

        for (const item of pageItems) {
          const button = make("button", "rb-pin-tile");
          button.type = "button";

          avatarColor(item.avatar).then(color => {
            if (stopped) return;
            button.style.setProperty("--rb-dot-color", color);
          });
          button.toggleAttribute(
            "data-rb-selected",
            editing
              ? selectedPin === item.name
              : activePin === item.name
          );

          button.toggleAttribute(
            "data-rb-unavailable",
            !item.available
          );

          button.setAttribute(
            "aria-label",
            editing
              ? `选择并调整顺序：${item.label}`
              : item.available
                ? `展开聊天：${item.label}`
                : `${item.label}暂未载入`
          );

          if (editing) {
            button.setAttribute(
              "aria-pressed",
              String(selectedPin === item.name)
            );
          } else {
            button.setAttribute(
              "aria-expanded",
              String(activePin === item.name)
            );
          }

          const face = make("span", "rb-pin-face");

          if (item.avatar) {
            const shadow = make("img", "rb-pin-shadow");
            shadow.src = item.avatar;
            shadow.alt = "";
            shadow.setAttribute("aria-hidden", "true");

            const image = make("img", "rb-pin-image");
            image.src = item.avatar;
            image.alt = "";

            image.addEventListener("error", () => {
              shadow.remove();
              image.replaceWith(make("span", "rb-pin-image"));
            }, { once: true });

            face.append(shadow, image);
          } else {
            face.appendChild(make("span", "rb-pin-image"));
          }

          const label = make("span", "rb-pin-name", item.label);
          label.title = item.label;
          button.append(face, label);

          if (!item.available) {
            button.appendChild(
              make("span", "rb-pin-unavailable", "未载入")
            );
          }

          button.addEventListener("click", () => {
            pinPage = pageIndex;

            if (editing) {
              selectedPin = selectedPin === item.name ? null : item.name;
              refreshView();
              return;
            }

            if (!item.available) {
              const loadedChats = groups.reduce(
                (count, group) => count + group.records.length,
                0
              );

              const openSettings = view.confirm(
                `${item.label}不在当前载入范围内。\n\n` +
                `当前页面载入了 ${loadedChats} 条聊天，` +
                `共 ${groups.length} 个角色。\n\n` +
                "是否调整最近聊天数量？"
              );

              if (openSettings) {
                openRecentChatsSettings();
              }

              return;
            }

            activePin = activePin === item.name ? null : item.name;
            refreshView();
          });

          page.appendChild(button);
        }

        track.appendChild(page);

     
      }

      track.addEventListener("scroll", () => {
        if (
          stopped ||
          !track.isConnected ||
          pinBar.hidden ||
          !track.clientWidth
        ) return;

        if (track.clientWidth !== trackWidth) {
          alignPinTrack();
          return;
        }

        pinPage = Math.max(
          0,
          Math.min(
            Math.round(track.scrollLeft / track.clientWidth),
            pageCount - 1
          )
        );
      }, { passive: true });

      track.addEventListener("keydown", event => {
        if (event.target !== track) return;

        if (event.key === "ArrowRight") {
          event.preventDefault();
          goToPage(pinPage + 1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          goToPage(pinPage - 1);
        }
      });

      pinBar.appendChild(track);

      if (editing && selectedPin !== null) {
        const selectedName = selectedPin;
        const index = rolePins.indexOf(selectedName);
        const editor = make("div", "rb-pin-editor");
        const title = make(
          "div",
          "rb-pin-editor-title",
          `${displayName(selectedName)} · 第 ${index + 1} 位`
        );
        const actions = make("div", "rb-pin-editor-actions");

        title.title = displayName(selectedName);

        function moveSelected(target) {
          const from = rolePins.indexOf(selectedName);
          if (from < 0) return;

          const to = Math.max(0, Math.min(target, rolePins.length - 1));
          if (from === to) return;

          rolePins.splice(from, 1);
          rolePins.splice(to, 0, selectedName);
          pinPage = Math.floor(to / 3);

          saveRolePins();
          refreshView();
        }

        function addAction(text, disabled, action, remove = false) {
          const button = make("button", "rb-pin-action", text);
          button.type = "button";
          button.disabled = disabled;
          button.toggleAttribute("data-rb-remove", remove);
          button.addEventListener("click", action);
          actions.appendChild(button);
        }

        addAction("前移", index === 0, () => moveSelected(index - 1));
        addAction(
          "后移",
          index === rolePins.length - 1,
          () => moveSelected(index + 1)
        );
        addAction("移到首位", index === 0, () => moveSelected(0));
        addAction("改名", false, () => renameGroup(selectedName));

addAction(
          privateRoles.has(selectedName)
            ? "显示预览"
            : "模糊预览",
          false,
          () => togglePreviewPrivacy(selectedName)
        );
        addAction(
          hiddenRoles.has(selectedName)
            ? "显示角色"
            : "隐藏角色",
          false,
          () => toggleHiddenRole(selectedName)
        );
        addAction(
          "取消置顶",
          false,
          () => toggleRolePin(selectedName),
          true
        );

        editor.append(title, actions);
        pinBar.appendChild(editor);
      }

      if (typeof view.ResizeObserver === "function") {
        pinResizeObserver = new view.ResizeObserver(() => {
          if (track.clientWidth && track.clientWidth !== trackWidth) {
            alignPinTrack();
          }
        });

        pinResizeObserver.observe(track);
      }

      alignPinTrack();
    }

    function setInbox(open) {
      if (open === inboxMode) return;

      if (open) {
        homeQuery = input.value;
        input.value = "";
      } else {
        input.value = homeQuery;
      }

      inboxMode = open;
      editing = false;
      temporaryStates.clear();
      input.blur();
      refreshView();
    }

    editButton.addEventListener("click", () => {
      if (inboxMode) {
        setInbox(false);
        return;
      }

      editing = !editing;
      refreshView();
    });

    inboxButton.addEventListener("click", () => {
      setInbox(!inboxMode);
    });

    function normalize(text) {
      return String(text || "").normalize("NFKC").toLocaleLowerCase();
    }

    function saveStates() {
      try {
        view.localStorage.setItem(STORE, JSON.stringify([...states]));
      } catch {}
    }

    function make(tag, className, text) {
      const el = doc.createElement(tag);
      el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    }

const chatDecorations = new Map();
    const chatBookmarkUIs = new Map();

    function chatHeading(record) {
      const filename = (record.chatTitle || record.chatName)
        .replace(/\.jsonl$/i, "")
        .trim();

      let candidate = filename;
      const prefix = record.name + " - ";

      if (candidate.startsWith(prefix)) {
        candidate = candidate.slice(prefix.length);
      }

      const match = candidate.match(
        /^(\d{4})-(\d{2})-(\d{2})@(\d{2})h(\d{2})m(\d{2})s(?:\d+ms)?(?:\s*-\s*Branch\s*#\d+)*$/i
      );

      let timeText = "";
      const stamp = record.dateTitle
        ? Date.parse(record.dateTitle)
        : NaN;

      if (Number.isFinite(stamp)) {
        const date = new Date(stamp);
        const year = date.getFullYear();
        const yearText = year === new Date().getFullYear()
          ? ""
          : `${year}年`;
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const hasTime = /\d{1,2}:\d{2}|\b(?:AM|PM)\b/i.test(
          record.dateTitle
        );

        timeText =
          `${yearText}${date.getMonth() + 1}月${date.getDate()}日` +
          (hasTime ? ` · ${hours}:${minutes}` : "");
      } else if (record.date) {
        timeText = record.date;
      } else if (match) {
        const [, year, month, day, hours, minutes] = match;
        const yearText = Number(year) === new Date().getFullYear()
          ? ""
          : `${year}年`;

        timeText =
          `${yearText}${Number(month)}月${Number(day)}日 · ${hours}:${minutes}`;
      }

      const stats = record.el.querySelector(".chatStats");
      const blocks = stats
        ? [...stats.querySelectorAll(".counterBlock")]
        : [];

      const isSize = text =>
        /\b(?:bytes?|[kmgt]?i?b)\b|字节/i.test(text);

      const countBlock = blocks.find(block => {
        const text = block.textContent.trim();
        return /\d/.test(text) && !isSize(text);
      });

      let sizeBlock = blocks.find(block =>
        isSize(block.textContent.trim())
      );

      if (!sizeBlock && stats) {
        const sizePattern =
          /\d+(?:[.,]\d+)*\s*(?:[kmgt]i?b|bytes?|b|字节)(?![a-z])/i;

        const candidates = [
          ...stats.querySelectorAll("small")
        ].map(el => el.textContent.trim());

        const walker = doc.createTreeWalker(stats, 4);
        let node;

        while ((node = walker.nextNode())) {
          const text = node.textContent.trim();
          if (text) candidates.push(text);
        }

        candidates.push(stats.textContent.trim());

        for (const text of candidates) {
          const match = text.match(sizePattern);
          if (!match) continue;

          sizeBlock = make("span", "counterBlock", match[0]);
          break;
        }
      }


      return {
        name: match ? "" : filename || "未命名聊天",
        time: timeText,
        countBlock,
        sizeBlock
      };
    }

function closeChatTools(except = null) {
      for (const [el, ui] of chatDecorations) {
        if (el === except) continue;

        el.removeAttribute("data-rb-tools");
        ui.button.setAttribute("aria-expanded", "false");
        ui.button.setAttribute("aria-label", "展开聊天操作");
      }
    }

    function handleToolsOutside(event) {
      const target = event.target;

      if (
        target instanceof view.Element &&
        target.closest(
          "#chat .welcomePanel .rb-more, #chat .welcomePanel .chatActions"
        )
      ) return;

      closeChatTools();
    }

    doc.addEventListener("click", handleToolsOutside, true);

    function decorateChat(record) {
      const info = record.el.querySelector(".recentChatInfo");
      if (!info) return;

      let ui = chatDecorations.get(record.el);

      if (
        !ui ||
        ui.title.parentElement !== info ||
        ui.button.parentElement !== info
      ) {
        if (ui) {
          ui.title.remove();
          ui.button.remove();
        }

        record.el.removeAttribute("data-rb-tools");

        const title = make("span", "rb-short-name");
        const button = make("button", "rb-more");
        button.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24"
            fill="currentColor" aria-hidden="true"
            style="display:block;flex-shrink:0;pointer-events:none">
            <circle cx="6" cy="12" r="1.8"/>
            <circle cx="12" cy="12" r="1.8"/>
            <circle cx="18" cy="12" r="1.8"/>
          </svg>
        `;
        button.type = "button";
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "展开聊天操作");

        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();

          const open = !record.el.hasAttribute("data-rb-tools");
          closeChatTools(record.el);
          record.el.toggleAttribute("data-rb-tools", open);

          button.setAttribute("aria-expanded", String(open));
          button.setAttribute(
            "aria-label",
            open ? "收起聊天操作" : "展开聊天操作"
          );
        });

        for (const type of ["pointerdown", "pointerup", "dblclick"]) {
          button.addEventListener(type, event => {
            event.stopPropagation();
          });
        }

        info.append(title, button);
        ui = { title, button };
        chatDecorations.set(record.el, ui);
      }

const heading = chatHeading(record);
      const fullTitle = record.chatTitle || record.chatName;
      const pinned = record.el.querySelector(
        ":scope > .recentChatPinned"
      );
      const pinIcon = pinned &&
        !pinned.hidden &&
        !pinned.classList.contains("hidden")
          ? pinned.querySelector(".fa-thumbtack")
          : null;

const isPinned = Boolean(pinIcon);
      record.el.toggleAttribute("data-rb-pinned", isPinned);

      const bookmarkButton = record.el.querySelector(".rb-chat-bookmark");
      if (bookmarkButton) {
        bookmarkButton.disabled = isPinned && !inboxMode;
      }

      const signature = JSON.stringify([
        heading.name,
        heading.time,
        heading.countBlock?.outerHTML || "",
        heading.sizeBlock?.outerHTML || "",
        pinIcon?.outerHTML || ""
      ]);

      if (
        ui.headingSignature !== signature ||
        !ui.title.querySelector(".rb-chat-meta, .rb-chat-custom-name")
      ) {
        ui.title.replaceChildren();

        if (heading.name) {
          ui.title.appendChild(
            make("span", "rb-chat-custom-name", heading.name)
          );
        }

        const meta = make("span", "rb-chat-meta");

        function appendPart(part) {
          if (meta.childElementCount) {
            const dot = make("span", "rb-meta-dot", "·");
            dot.setAttribute("aria-hidden", "true");
            meta.appendChild(dot);
          }

          meta.appendChild(part);
        }

        if (heading.time) {
          appendPart(make("span", "rb-meta-time", heading.time));
        }

        for (const block of [heading.countBlock, heading.sizeBlock]) {
          if (!block) continue;

          const copy = block.cloneNode(true);
          copy.removeAttribute("id");

          copy.querySelectorAll("[id]").forEach(el => {
            if (!el.closest("svg")) el.removeAttribute("id");
          });

          copy.classList.add("rb-meta-stat");
          appendPart(copy);
        }

        if (meta.childElementCount) {
          ui.title.appendChild(meta);
        }

        ui.headingSignature = signature;
      }

      if (ui.title.title !== fullTitle) {
        ui.title.title = fullTitle;
      }
    }

    function read(el) {
     
      const nameElement = el.querySelector(".characterName");
      let name = "未命名角色";

      if (nameElement) {
        const text = nameElement.textContent.trim();
        if (text) name = text;
      }
      const chatName = el.querySelector(".chatName");
      const preview = el.querySelector(".chatMessage");
      const date = el.querySelector(".chatDate");
      const avatarElement = el.querySelector(".avatar img");
      const avatar = avatarElement ? avatarElement.src : "";

      const data = {
        el,
        name,
        avatar,
        chatName: chatName?.textContent?.trim() || "",
        chatTitle: chatName?.getAttribute("title") || "",
        preview: preview?.textContent?.trim() || "",
        previewTitle: preview?.getAttribute("title") || "",
        date: date?.textContent?.trim() || "",
        dateTitle: date?.getAttribute("title") || ""
      };

data.timestamp = Date.parse(data.dateTitle || "");

      data.search = normalize([
        data.name,
        data.chatName,
        data.chatTitle,
        data.preview,
        data.previewTitle
      ].join("\n"));

      data.signature = JSON.stringify([
        data.name, data.avatar, data.chatName, data.chatTitle,
        data.preview, data.previewTitle, data.date, data.dateTitle
      ]);

      return data;
    }

function addChatBookmark(record, fallbackAvatar) {
      const filename = record.chatTitle || record.chatName;
      let ui = chatBookmarkUIs.get(record.el);

      if (!filename) {
        ui?.button.remove();
        chatBookmarkUIs.delete(record.el);
        return;
      }

      const key = chatBookmarkKey(record);

      if (!ui) {
        record.el.querySelectorAll(".rb-chat-bookmark").forEach(button => {
          button.remove();
        });

        const button = make("button", "rb-chat-bookmark");
        button.type = "button";

        ui = {
          button,
          record,
          key,
          filename,
          avatar: null
        };

        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();

          if (
            ui.record.el.hasAttribute("data-rb-pinned") &&
            !inboxMode
          ) return;

          if (chatBookmarks.has(ui.key)) {
            chatBookmarks.delete(ui.key);
          } else {
            chatBookmarks.add(ui.key);
          }

          saveChatBookmarks();
          refreshView();
        });

        for (const type of ["pointerdown", "pointerup", "dblclick"]) {
          button.addEventListener(type, event => {
            event.stopPropagation();
          });
        }

        chatBookmarkUIs.set(record.el, ui);
      } else if (
        ui.key !== key &&
        ui.record.name === record.name &&
        chatBookmarks.has(ui.key)
      ) {
        const transfer = view.confirm(
          `这个聊天位置的名称发生了变化：\n\n原名称：${ui.filename}\n\n当前名称：${filename}\n\n如果你刚刚重命名了这条聊天，点“确定”转移原书签；否则点“取消”，保留原书签。`
        );

        if (transfer) {
          chatBookmarks.delete(ui.key);
          chatBookmarks.add(key);
          saveChatBookmarks();
        }
      }

      ui.record = record;
      ui.key = key;
      ui.filename = filename;

      if (ui.button.parentElement !== record.el) {
        record.el.appendChild(ui.button);
      }

      const marked = chatBookmarks.has(key);
      const label = marked
        ? `取消聊天书签：${record.chatName || filename}`
        : `标记聊天书签：${record.chatName || filename}`;

      ui.button.disabled =
        record.el.hasAttribute("data-rb-pinned") && !inboxMode;
      ui.button.setAttribute("aria-pressed", String(marked));
      ui.button.setAttribute("aria-label", label);

      if (ui.button.title !== label) {
        ui.button.title = label;
      }

      const source = record.avatar || fallbackAvatar || "";

      if (ui.avatar !== source) {
        ui.avatar = source;

        avatarColor(source).then(color => {
          if (
            stopped ||
            chatBookmarkUIs.get(record.el) !== ui ||
            ui.avatar !== source
          ) return;

          ui.button.style.setProperty("--rb-dot-color", color);
        });
      }
    }

function renameGroup(name) {
      const value = view.prompt(
        `修改分组显示名称\n原名：${name}\n留空可恢复原名`,
        displayName(name)
      );

      if (value === null) return;

      const nextName = value.trim();

      if (!nextName || nextName === name) {
        aliases.delete(name);
      } else {
        aliases.set(name, nextName);
      }

      const saved = saveAliases();

      for (const group of groups) {
        if (group.name !== name) continue;

        const title = group.header.querySelector(".rb-name");
        if (title) title.textContent = displayName(name);
      }

      updateSearch();

      if (!saved) {
        view.alert("名字已在本次页面中修改，但浏览器未能保存，刷新后可能恢复。");
      }
    }

    function createGroup(name, records, cached = null) {
      const section = make("div", "rb-group");
      const unavailable = records.length === 0;

      section.toggleAttribute(
        "data-rb-unavailable",
        unavailable
      );

      const headerWrap = make("div", "rb-header-wrap");
      const header = make("button", "rb-group-header");
      header.type = "button";

      const bookmark = make("span", "rb-bookmark");
      bookmark.setAttribute("aria-hidden", "true");

      const avatar = make("span", "rb-avatar");
      avatar.setAttribute("aria-hidden", "true");

      const source =
        records.find(record => record.avatar)?.avatar ||
        cached?.avatar ||
        "";
      avatarColor(source).then(color => {
        if (stopped) return;
        bookmark.style.setProperty("--rb-dot-color", color);
      });

      if (source) {
        const img = doc.createElement("img");
        img.alt = "";
        img.loading = "eager";
        img.width = 45;
        img.height = 45;
        img.src = source;
        avatar.appendChild(img);
      }

      const body = make("span", "rb-body");
      const heading = make("span", "rb-heading");
      const title = make("span", "rb-name", displayName(name));
      const date = make("span", "rb-date");
      const arrow = make("span", "rb-arrow");
      arrow.setAttribute("aria-hidden", "true");
      arrow.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="m9 5 7 7-7 7" stroke="currentColor"
            stroke-width="3.5" stroke-linecap="round"
            stroke-linejoin="round"/>
        </svg>
      `;
      const preview = make("span", "rb-preview");
      const content = make("div", "rb-content");

      title.title = `原名：${name}`;

      title.addEventListener("click", event => {
        if (!editing) return;

        event.preventDefault();
        event.stopPropagation();
        renameGroup(name);
      });

      heading.append(title, date, arrow);
      body.append(heading, preview);
      header.append(avatar, body);
      const rolePinButton = make(
        "button",
        "rb-role-pin",
        "置顶角色"
      );
      rolePinButton.type = "button";
      rolePinButton.setAttribute(
        "aria-label",
        `置顶角色：${displayName(name)}`
      );
      rolePinButton.setAttribute("aria-pressed", "false");

      rolePinButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleRolePin(name);
      });

      const privacyButton = make(
        "button",
        "rb-privacy-toggle"
      );
      privacyButton.type = "button";

      privacyButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        togglePreviewPrivacy(name);
      });

      const hideRoleButton = make(
        "button",
        "rb-hide-role"
      );
      hideRoleButton.type = "button";

      hideRoleButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        toggleHiddenRole(name);
      });

      const roleActions = make("div", "rb-role-actions");
      roleActions.append(
        rolePinButton,
        privacyButton,
        hideRoleButton
      );

      headerWrap.append(header, bookmark);
      section.append(
        headerWrap,
        roleActions,
        content
      );

      const chatFragment = doc.createDocumentFragment();

      records.forEach(record => {
        chatFragment.append(record.el);
      });

      content.append(chatFragment);

      const group = {
        name,
        records,
        section,
        header,
        content,
        date,
        preview,
        bookmark,
        cached,
        unavailable
      };

      return group;
    }

function handleGroupToggle(event) {
      const target = event.target;

      if (!(target instanceof view.Element)) return;

      const header = target.closest(".rb-group-header");

      if (!header || !list?.contains(header)) return;

      const group = groups.find(item => item.header === header);

      if (!group) return;

      if (!group.records.length) {
        const openSettings = view.confirm(
          `${displayName(group.name)}暂未载入。\n\n` +
          "当前首页的最近聊天范围中没有这个角色，" +
          "是否调整最近聊天数量？"
        );

        if (openSettings) {
          openRecentChatsSettings();
        }

        return;
      }

      const nextOpen =
        header.getAttribute("aria-expanded") !== "true";

      const filtered = inboxMode || Boolean(input.value.trim());
      const pinnedHome =
        !editing &&
        !filtered &&
        rolePins.includes(group.name);

      if (pinnedHome) {
        activePin = nextOpen ? group.name : null;
      } else if (filtered) {
        temporaryStates.set(group.name, nextOpen);
      } else {
        states.set(group.name, nextOpen);
        saveStates();
      }

      refreshView();
    }

    doc.addEventListener("click", handleGroupToggle);

    function updateRoleFold() {
      groups.forEach(group => {
        group.section.removeAttribute("data-rb-first-ordinary");
      });

      if (!list) {
        listMoreButton.hidden = true;
        return;
      }

      if (listMoreButton.parentElement !== list) {
        list.appendChild(listMoreButton);
      }

      const enabled =
        !editing &&
        !inboxMode &&
        !input.value.trim();

      if (!enabled) {
        listMoreButton.hidden = true;
        return;
      }

      const limit = rolePins.some(
        name => !hiddenRoles.has(name)
      ) ? 5 : 7;

      const ordinaryGroups = groups.filter(group =>
        !group.section.hidden &&
        !rolePins.includes(group.name)
      );

      const hasVisibleTopPinned = groups.some(group =>
        !group.section.hidden &&
        group.section.hasAttribute("data-rb-top-pinned")
      );

      if (hasVisibleTopPinned && ordinaryGroups.length) {
        ordinaryGroups[0].section.setAttribute(
          "data-rb-first-ordinary",
          ""
        );
      }

      const remaining = Math.max(0, ordinaryGroups.length - limit);

      if (!extraRolesOpen) {
        ordinaryGroups.slice(limit).forEach(group => {
          group.section.hidden = true;
        });
      }

      listMoreButton.hidden = remaining === 0;
      listMoreButton.setAttribute(
        "aria-expanded",
        String(extraRolesOpen)
      );

      listMoreButton.setAttribute(
        "aria-label",
        extraRolesOpen
          ? `收起更多角色，保留前 ${limit} 个`
          : `展开其余 ${remaining} 个角色`
      );
    }

    function filterGroups() {
      const tokens = normalize(input.value.trim())
        .split(/\s+/)
        .filter(Boolean);

      const searching = tokens.length > 0;
      let total = 0;
      let groupCount = 0;
      let unloadedMatchCount = 0;

      clearButton.hidden = !input.value;

      headerToggle.hidden = inboxMode || !editing;
      chatCountSettings.hidden = inboxMode || !editing;
      applyNativeHeaderVisibility();

      navTitle.textContent = inboxMode ? "Bookmarks" : "Messages";
      editButton.textContent = inboxMode
        ? "Back"
        : editing ? "Done" : "Edit";

      editButton.setAttribute(
        "aria-label",
        inboxMode
          ? "返回首页"
          : editing ? "完成角色置顶编辑" : "编辑角色置顶"
      );

      inboxButton.setAttribute("aria-pressed", String(inboxMode));
      inboxButton.setAttribute(
        "aria-label",
        inboxMode ? "返回消息首页" : "打开书签收件箱"
      );

      input.placeholder = inboxMode ? "Search bookmarks" : "Search";
      input.setAttribute(
        "aria-label",
        inboxMode ? "搜索已加载的书签" : "搜索已加载的聊天"
      );

      if (list) {
        list.toggleAttribute("data-rb-editing", editing && !inboxMode);
        list.toggleAttribute("data-rb-inbox", inboxMode);
      }

      for (const group of groups) {
        const aliasText = normalize(displayName(group.name));
        const hasBookmarks = group.records.some(record =>
          chatBookmarks.has(chatBookmarkKey(record))
        );

        group.bookmark.toggleAttribute("data-rb-marked", hasBookmarks);

const previewPrivate = privateRoles.has(group.name);
        const roleHidden = hiddenRoles.has(group.name);

        group.section.toggleAttribute(
          "data-rb-private",
          previewPrivate
        );

        const privacyButton = group.section.querySelector(
          ".rb-privacy-toggle"
        );

        if (privacyButton) {
          privacyButton.textContent = previewPrivate
            ? "显示预览"
            : "模糊预览";

          privacyButton.setAttribute(
            "aria-pressed",
            String(previewPrivate)
          );

          privacyButton.setAttribute(
            "aria-label",
            `${previewPrivate ? "显示" : "隐藏"}${displayName(group.name)}的聊天预览`
          );
        }

group.section.toggleAttribute(
          "data-rb-role-hidden",
          roleHidden
        );

        const hideRoleButton = group.section.querySelector(
          ".rb-hide-role"
        );

        if (hideRoleButton) {
          hideRoleButton.textContent = roleHidden
            ? "显示角色"
            : "隐藏角色";

          hideRoleButton.setAttribute(
            "aria-pressed",
            String(roleHidden)
          );

          hideRoleButton.setAttribute(
            "aria-label",
            `${roleHidden ? "显示" : "隐藏"}角色：${displayName(group.name)}`
          );
        }
    const nameLabel = group.header.querySelector(".rb-name");

        if (nameLabel) {
          const hint = editing
            ? `点击修改显示名称；原名：${group.name}`
            : `原名：${group.name}`;

          if (nameLabel.title !== hint) {
            nameLabel.title = hint;
          }
        }
        const isRolePinned = rolePins.includes(group.name);
        const rolePinButton = group.section.querySelector(
          ".rb-role-pin"
        );

        if (rolePinButton) {
          rolePinButton.textContent = isRolePinned
            ? "取消置顶"
            : "置顶角色";

          rolePinButton.setAttribute(
            "aria-pressed",
            String(isRolePinned)
          );

          rolePinButton.setAttribute(
            "aria-label",
            `${isRolePinned ? "取消置顶" : "置顶角色"}：${displayName(group.name)}`
          );
        }

        const matches = group.records.filter(record => {
          const allowed = !inboxMode ||
            chatBookmarks.has(chatBookmarkKey(record));

          const searchText = record.search + "\n" + aliasText;

          return allowed &&
            tokens.every(token => searchText.includes(token));
        });

        const visible = new Set(matches.map(record => record.el));

        for (const record of group.records) {
          record.el.hidden = !visible.has(record.el);
          record.el.style.order =
            record.el.hasAttribute("data-rb-pinned") ? "-1" : "0";

          const ui = chatBookmarkUIs.get(record.el);

          if (ui) {
            const marked = chatBookmarks.has(ui.key);
            const label = marked
              ? `取消聊天书签：${record.chatName || ui.filename}`
              : `标记聊天书签：${record.chatName || ui.filename}`;

            ui.button.setAttribute("aria-pressed", String(marked));
            ui.button.setAttribute("aria-label", label);
            ui.button.disabled =
        record.el.hasAttribute("data-rb-pinned") && !inboxMode;

            if (ui.button.title !== label) {
              ui.button.title = label;
            }
          }
        }

        const unavailable = group.records.length === 0;
        const cachedSearch = normalize([
          group.name,
          displayName(group.name)
        ].join("\n"));

        let shown = unavailable
          ? (
              !inboxMode &&
              (
                !searching ||
                tokens.every(token => cachedSearch.includes(token))
              )
            )
          : matches.length > 0;

        let open = false;

        if (unavailable) {
          if (isRolePinned && !searching) {
            shown = false;
          }

          open = false;
        } else if (editing) {
          if (!searching && isRolePinned) shown = false;

          open = searching
            ? temporaryStates.get(group.name) !== false
            : states.get(group.name) === true;
        } else if (inboxMode || searching) {
          open = temporaryStates.get(group.name) !== false;
        } else if (isRolePinned) {
          shown = shown && activePin === group.name;
          open = shown;
        } else {
          open = states.get(group.name) === true;
        }

        if (roleHidden && !editing && !inboxMode && !searching) {
          shown = false;
          open = false;
        }

        group.section.hidden = !shown;
        const topPinned =
          !roleHidden &&
          !inboxMode &&
          !searching &&
          !editing &&
          isRolePinned;

        group.section.toggleAttribute("data-rb-top-pinned", topPinned);
        group.section.style.order = topPinned ? "-1" : "0";

        const pool = matches.length ? matches : group.records;

        let first = pool[0];
        let latestStamp = -Infinity;

        for (const record of pool) {
          const stamp = record.timestamp;

          if (Number.isFinite(stamp) && stamp > latestStamp) {
            latestStamp = stamp;
            first = record;
          }
        }

        let nextPreview;
        let nextDate;
        let nextDateTitle;

        if (unavailable) {
          const cachedCount = Number(group.cached?.count) || 0;

          nextPreview = cachedCount
            ? `当前载入范围内没有聊天记录 · 上次显示 ${cachedCount} 条`
            : "当前载入范围内没有聊天记录";

          nextDate = "[未载入]";
          nextDateTitle = "";
        } else {
          nextPreview = first?.preview || "暂无内容预览";
          nextDate = first?.date || "";
          nextDateTitle = first?.dateTitle || "";
        }

        if (group.preview.textContent !== nextPreview) {
          group.preview.textContent = nextPreview;
        }

        if (group.date.textContent !== nextDate) {
          group.date.textContent = nextDate;
        }

        if (group.date.title !== nextDateTitle) {
          group.date.title = nextDateTitle;
        }

        group.content.hidden = unavailable || !open;
        group.header.setAttribute("aria-expanded", String(open));

        total += matches.length;
        if (matches.length) groupCount++;

        if (searching && shown && unavailable) {
          unloadedMatchCount++;
        }
      }

updateRoleFold();

for (const [el, ui] of chatDecorations) {
        if (!el.hasAttribute("data-rb-tools")) continue;

        const group = el.closest(".rb-group");
        const content = el.closest(".rb-content");

        if (
          !el.isConnected ||
          el.hidden ||
          group?.hidden ||
          content?.hidden
        ) {
          el.removeAttribute("data-rb-tools");
          ui.button.setAttribute("aria-expanded", "false");
          ui.button.setAttribute("aria-label", "展开聊天操作");
        }
      }

      updatePinBar();

      if (inboxMode) {
        status.hidden = false;
        status.textContent = total
          ? `${groupCount} 个角色 · ${total} 条聊天 · 仅显示首页已加载的书签`
          : searching
            ? "没有匹配的书签 · 仅搜索首页已加载内容"
            : "当前已加载的聊天中没有书签，展开角色后，点某条聊天左侧的圆点区域即可标记。";
      } else if (searching) {
        status.hidden = false;

        if (total) {
          status.textContent =
            `匹配 ${groupCount} 个已载入角色、${total} 条聊天` +
            (
              unloadedMatchCount
                ? ` · 另有 ${unloadedMatchCount} 个未载入角色匹配名称`
                : ""
            ) +
            " · 聊天内容仅搜索首页已加载范围";
        } else if (unloadedMatchCount) {
          status.textContent =
            `找到 ${unloadedMatchCount} 个未载入角色` +
            " · 点击角色可调整最近聊天数量";
        } else {
          status.textContent =
            "没有找到匹配的角色或聊天 · 聊天内容仅搜索首页已加载范围";
        }
      } else if (editing) {
        const loadedChats = groups.reduce(
          (count, group) => count + group.records.length,
          0
        );

        const loadedGroups = groups.filter(
          group => group.records.length
        );

        const unloadedPins = rolePins.filter(name =>
          !groups.some(
            group =>
              group.name === name &&
              group.records.length
          )
        ).length;

        status.hidden = false;
        status.textContent =
          `当前载入 ${loadedChats} 条聊天，共 ${loadedGroups.length} 个角色` +
          (
            unloadedPins
              ? `，${unloadedPins} 个置顶角色暂未载入。`
              : "。"
          ) +
          " 可置顶角色、模糊预览或隐藏角色；点角色名字可以改名。";
     
      } else {
        status.hidden = true;
        status.textContent = "";
      }
    }

    function observe() {
      if (stopped) return;

      shellObserver.observe(doc.body, {
        childList: true,
        subtree: true
      });

      if (!list?.isConnected) return;

      observer.observe(list, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class", "src", "title", "hidden"]
      });
    }

    function restoreList(target) {
      if (!target) return;

      for (const section of [...target.children]) {
        if (!section.classList.contains("rb-group")) continue;
        for (const chat of section.querySelectorAll(".recentChat")) {
          section.before(chat);
        }
        section.remove();
      }

      target.removeAttribute("data-rb-list");
      target.removeAttribute("data-rb-editing");
      target.removeAttribute("data-rb-inbox");
    }

    function render() {
      timer = 0;
      if (stopped) return;

      observer.disconnect();
      shellObserver.disconnect();

      try {
        const current = doc.querySelector(
          "#chat .welcomePanel .recentChatList"
        );

        if (current !== list) {
          restoreList(list);
          list = current;
          groups = [];
          previous = [];
          toolbar.remove();
        }

        if (!list) return;

        list.setAttribute("data-rb-list", "");
        if (toolbar.nextElementSibling !== list) list.before(toolbar);

        const chats = [...list.querySelectorAll(".recentChat")];
        const records = chats.map(read);

        records.forEach(decorateChat);

        const fallbackAvatars = new Map();

        for (const record of records) {
          if (record.avatar && !fallbackAvatars.has(record.name)) {
            fallbackAvatars.set(record.name, record.avatar);
          }
        }

        for (const record of records) {
          addChatBookmark(record, fallbackAvatars.get(record.name));
        }

        for (const [el, ui] of chatBookmarkUIs) {
          if (!el.isConnected) {
            ui.button.remove();
            chatBookmarkUIs.delete(el);
          }
        }

        for (const [el, ui] of chatDecorations) {
          if (!el.isConnected) {
            ui.title.remove();
            ui.button.remove();
            el.removeAttribute("data-rb-tools");
            el.removeAttribute("data-rb-pinned");
            chatDecorations.delete(el);
          }
        }

        for (const chat of chats) {
          if (!originals.has(chat)) {
            originals.set(chat, {
              hidden: chat.hidden,
              hiddenClass: chat.classList.contains("hidden"),
              order: chat.style.getPropertyValue("order"),
              orderPriority: chat.style.getPropertyPriority("order")
            });
          }
          chat.classList.toggle("hidden", false);
        }

        const same = records.length === previous.length &&
          records.every((record, index) =>
            record.el === previous[index].el &&
            record.signature === previous[index].signature
          );

        const intact = groups.every(group =>
          group.section.parentElement === list &&
          group.records.every(record =>
            record.el.parentElement === group.content
          )
        );

        if (same && intact && groups.length) {
          filterGroups();
          return;
        }

        const buckets = Object.create(null);
        const batches = [];

        records.forEach(record => {
          let batch = buckets[record.name];

          if (batch === undefined) {
            batch = {
              name: record.name,
              records: []
            };

            buckets[record.name] = batch;
            batches.push(batch);
          }

          batch.records.push(record);
        });

        let roleIndexChanged = false;

        for (const batch of batches) {
          const avatar =
            batch.records.find(record => record.avatar)?.avatar ||
            roleIndex.get(batch.name)?.avatar ||
            "";

          const nextMeta = {
            avatar,
            count: batch.records.length
          };

          const oldMeta = roleIndex.get(batch.name);

          if (
            !oldMeta ||
            oldMeta.avatar !== nextMeta.avatar ||
            oldMeta.count !== nextMeta.count
          ) {
            roleIndex.set(batch.name, nextMeta);
            roleIndexChanged = true;
          }
        }

        if (roleIndexChanged) {
          saveRoleIndex();
        }

        for (const [name, cached] of roleIndex) {
  if (buckets[name] !== undefined) continue;

  const customized =
    rolePins.includes(name) ||
    aliases.has(name) ||
    privateRoles.has(name) ||
    hiddenRoles.has(name);

  if (!customized) continue;

  batches.push({
    name,
    records: [],
    cached
  });
}

        const oldSections = Array.from(list.children).filter(
          element => element.classList.contains("rb-group")
        );

        const oldGroups = new Map(
          groups.map(group => [group.name, group])
        );

        const nextGroups = batches.map(batch => {
          const cached =
            batch.cached ||
            roleIndex.get(batch.name) ||
            null;

          const existing = oldGroups.get(batch.name);

          const reusable =
            existing &&
            existing.section.parentElement === list &&
            existing.records.length === batch.records.length &&
            existing.records.every((record, index) => {
              const next = batch.records[index];

              return (
                record.el === next.el &&
                record.signature === next.signature &&
                record.el.parentElement === existing.content
              );
            }) &&
            (
              batch.records.length > 0 ||
              (
                (existing.cached?.avatar || "") ===
                  (cached?.avatar || "") &&
                (existing.cached?.count || 0) ===
                  (cached?.count || 0)
              )
            );

          if (reusable) {
            existing.records = batch.records;
            existing.cached = cached;
            return existing;
          }

          return createGroup(
            batch.name,
            batch.records,
            cached
          );
        });

        const retainedSections = new Set(
          nextGroups.map(group => group.section)
        );

        for (const section of oldSections) {
          if (!retainedSections.has(section)) {
            section.remove();
          }
        }

        groups = nextGroups;

        let position = list.firstElementChild;

        for (const group of groups) {
          if (group.section !== position) {
            list.insertBefore(group.section, position);
          }

          position = group.section.nextElementSibling;
        }

        previous = groups.flatMap(group => group.records);
        filterGroups();

        for (const el of originals.keys()) {
          if (!el.isConnected) originals.delete(el);
        }
      } finally {
        observe();
      }
    }

    function schedule() {
      if (stopped || timer) return;
      timer = view.requestAnimationFrame(render);
    }

    const observer = new view.MutationObserver(() => {
      schedule();
    });

    const shellObserver = new view.MutationObserver(records => {
      if (stopped) return;

      if (list) {
        if (!list.isConnected || !toolbar.isConnected) {
          schedule();
        }

        return;
      }

      const selector = "#chat .welcomePanel .recentChatList";

      for (const record of records) {
        for (const node of record.addedNodes) {
          if (
            !(node instanceof view.Element) ||
            !node.isConnected
          ) continue;

          if (
            node.matches(selector) ||
            node.querySelector(selector)
          ) {
            schedule();
            return;
          }
        }
      }
    });

    function updateSearch() {
      temporaryStates.clear();
      refreshView();
    }

    input.addEventListener("input", updateSearch);
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
      if (event.key === "Escape") {
        input.value = "";
        updateSearch();
      }
    });

    clearButton.addEventListener("click", () => {
      input.value = "";
      updateSearch();
      input.focus();
    });

    function destroy() {
      stopped = true;
      observer.disconnect();
      shellObserver.disconnect();
      view.cancelAnimationFrame(timer);
      view.clearTimeout(settingsTimer);
      settingsTimer = 0;

      settingsButton?.removeEventListener(
        "click",
        handleNativeSettingsClick
      );
      settingsButton = null;
      clearSettingsRow();

      for (const cancel of [...pendingAvatarTasks]) {
        cancel();
      }

      pendingAvatarTasks.clear();
      colorCache.clear();
      doc.removeEventListener("click", handleToolsOutside, true);
      doc.removeEventListener("click", handleGroupToggle);
      view.removeEventListener("resize", handlePinResize);
      pinResizeObserver?.disconnect();
      view.cancelAnimationFrame(pinLayoutFrame);
      alignPinTrack = () => {};

      for (const ui of chatBookmarkUIs.values()) {
        ui.button.remove();
      }

      chatBookmarkUIs.clear();

      for (const [el, ui] of chatDecorations) {
        ui.title.remove();
        ui.button.remove();
        el.removeAttribute("data-rb-tools");
        el.removeAttribute("data-rb-pinned");
      }

      chatDecorations.clear();
      listMoreButton.remove();
      restoreList(list);

      for (const [el, original] of originals) {
        el.querySelectorAll(".rb-chat-bookmark").forEach(button => {
          button.remove();
        });
        el.hidden = original.hidden;
        el.classList.toggle("hidden", original.hiddenClass);

        if (original.order) {
          el.style.setProperty(
            "order",
            original.order,
            original.orderPriority
          );
        } else {
          el.style.removeProperty("order");
        }
      }

      doc.querySelectorAll(
        "#chat .welcomePanel[data-rb-hide-native-header]"
      ).forEach(panel => {
        panel.removeAttribute("data-rb-hide-native-header");
      });

      toolbar.remove();
      style.remove();
      if (view[KEY]?.destroy === destroy) delete view[KEY];
    }

    view[KEY] = { destroy };
    schedule();
  }

  start();
})();
