(function rabbitToolboxStart() {
  "use strict";

  var host = null;
  var candidate = window;

  for (var level = 0; level < 10; level += 1) {
    try {
      if (candidate.document.querySelector("#chat")) {
        host = candidate;
        break;
      }
      if (candidate.parent === candidate) break;
      candidate = candidate.parent;
    } catch (error) {
      break;
    }
  }

  if (!host || !host.document.body) {
    window.setTimeout(rabbitToolboxStart, 300);
    return;
  }

  var doc = host.document;
  var appKey = "__RABBIT_TOOLBOX__";

  if (host[appKey] && typeof host[appKey].destroy === "function") {
    host[appKey].destroy();
  }
  if (typeof host.__rabbitAvatarPadding === "function") host.__rabbitAvatarPadding();
  if (typeof host.__rabbitAvatarOriginal === "function") host.__rabbitAvatarOriginal();
  if (typeof host.__rabbitAvatarCombined === "function") host.__rabbitAvatarCombined();

  var stopped = false;

  /* ==========================================
   * 模块 0：开关配置存储与扩展菜单弹窗
   * ========================================== */
  var storageKey = "rabbit-toolbox-toggles-v1";
  var toggles = {
    deleteScrollLock: true,
    deleteEasySelect: true,
    doubleClickEdit: true,
    avatarHdOriginal: true,
    avatarSquareUpload: true
  };

  try {
    var saved = JSON.parse(host.localStorage.getItem(storageKey) || "{}");
    if (saved && typeof saved === "object") {
      Object.keys(toggles).forEach(function (k) {
        if (typeof saved[k] === "boolean") toggles[k] = saved[k];
      });
    }
  } catch (e) {}

  function saveToggles() {
    try {
      host.localStorage.setItem(storageKey, JSON.stringify(toggles));
    } catch (e) {}
  }

  function make(tag, className, text, id) {
    var el = doc.createElement(tag);
    if (className) el.className = className;
    if (id) el.id = id;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function getChat() {
    return doc.getElementById("chat");
  }

  /* ==========================================
   * 模块 1：删除消息防跳回第一楼（锁定滚动位置）
   * ========================================== */
  var lockUntil = 0;
  var savedScrollTop = 0;
  var anchorMesId = null;
  var anchorOffset = 0;
  var lockTimer = null;

  function findVisibleAnchor(chat) {
    var chatRect = chat.getBoundingClientRect();
    var messages = chat.querySelectorAll(".mes");
    for (var i = messages.length - 1; i >= 0; i -= 1) {
      var mes = messages[i];
      var rect = mes.getBoundingClientRect();
      if (rect.bottom > chatRect.top + 10 && rect.top < chatRect.bottom - 10) {
        return {
          mesid: mes.getAttribute("mesid"),
          offset: rect.top - chatRect.top
        };
      }
    }
    return null;
  }

  function captureScrollLock(duration) {
    if (!toggles.deleteScrollLock) return;
    var chat = getChat();
    if (!chat) return;

    savedScrollTop = chat.scrollTop;
    var anchor = findVisibleAnchor(chat);
    if (anchor && anchor.mesid !== null) {
      anchorMesId = anchor.mesid;
      anchorOffset = anchor.offset;
    } else {
      anchorMesId = null;
      anchorOffset = 0;
    }

    lockUntil = Date.now() + (duration || 900);

    if (lockTimer !== null) host.clearTimeout(lockTimer);
    lockTimer = host.setTimeout(function () {
      restoreScrollPosition();
      lockTimer = null;
    }, 30);

    host.requestAnimationFrame(restoreScrollPosition);
  }

  function restoreScrollPosition() {
    if (!toggles.deleteScrollLock || Date.now() > lockUntil) return;
    var chat = getChat();
    if (!chat) return;

    if (anchorMesId !== null) {
      var target = chat.querySelector('.mes[mesid="' + anchorMesId + '"]');
      if (target) {
        var chatRect = chat.getBoundingClientRect();
        var targetRect = target.getBoundingClientRect();
        var delta = (targetRect.top - chatRect.top) - anchorOffset;
        if (Math.abs(delta) > 2) {
          chat.scrollTop += delta;
        }
        savedScrollTop = chat.scrollTop;
        return;
      }
    }

    if (Math.abs(chat.scrollTop - savedScrollTop) > 2) {
      chat.scrollTop = savedScrollTop;
    }
  }

  function isDeleteRelatedTarget(target) {
    if (!target || target.nodeType !== 1) return false;
    return Boolean(
      target.closest(
        "#option_delete_mes, " +
        ".del_checkbox, " +
        "#dialogue_del_mes_ok, " +
        "#dialogue_del_mes_cancel, " +
        ".mes_edit_delete"
      )
    );
  }

  function cancelAllScrollLocks(event) {
    if (event && isDeleteRelatedTarget(event.target)) return;
    if (event && event.target && event.target.closest && event.target.closest(".mes_edit_done, .mes_edit_cancel, #rabbit-quick-edit-bar, .mes_edit")) return;
    lockUntil = 0;
    editScrollLockUntil = 0;
    if (lockTimer !== null) {
      host.clearTimeout(lockTimer);
      lockTimer = null;
    }
  }

  function onPreInteraction(event) {
    if (!toggles.deleteScrollLock) return;
    if (isDeleteRelatedTarget(event.target)) {
      captureScrollLock(400);
    }
  }

  function onChatScroll() {
    if (toggles.deleteScrollLock && Date.now() <= lockUntil) {
      restoreScrollPosition();
    }
  }

  function onFocusIn(event) {
    if (!toggles.deleteScrollLock) return;
    var target = event.target;
    if (target && target.nodeType === 1 && target.matches(".del_checkbox")) {
      restoreScrollPosition();
    }
  }

  /* ==========================================
   * 模块 2：去除选中边框 & 点击楼层任意处选中/取消
   * ========================================== */
  var styleId = "rabbit-toolbox-del-style";
  var styleEl = null;

  function syncDeleteStyle() {
    styleEl = doc.getElementById(styleId);
    if (!toggles.deleteEasySelect) {
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      styleEl = null;
      return;
    }
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = styleId;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent =
      "#chat .mes.selected {\n" +
      "  outline: none !important;\n" +
      "  border-color: transparent !important;\n" +
      "  box-shadow: none !important;\n" +
      "}\n" +
      "#chat .del_checkbox:focus,\n" +
      "#chat .del_checkbox:focus-visible {\n" +
      "  outline: none !important;\n" +
      "  box-shadow: none !important;\n" +
      "}";
  }

  syncDeleteStyle();

  function isDeletingMode() {
    var chat = getChat();
    if (!chat) return false;
    var dlg = doc.getElementById("dialogue_del_mes");
    if (dlg) {
      var dlgStyle = host.getComputedStyle(dlg);
      if (dlgStyle.display !== "none" && dlgStyle.visibility !== "hidden") {
        return true;
      }
    }
    var cb = chat.querySelector(".del_checkbox");
    if (!cb) return false;
    var cbStyle = host.getComputedStyle(cb);
    return cbStyle.display !== "none" && cbStyle.visibility !== "hidden";
  }

  function clearAllDeleteSelection() {
    var chat = getChat();
    if (!chat) return;
    var allMes = chat.querySelectorAll(".mes");
    for (var i = 0; i < allMes.length; i += 1) {
      allMes[i].classList.remove("selected");
      var cb = allMes[i].querySelector(".del_checkbox");
      if (cb) {
        cb.checked = false;
        if (host.jQuery) {
          host.jQuery(cb).prop("checked", false);
        }
      }
    }
  }

  var internalTrigger = false;

  function setSingleMesSelected(mes, selected) {
    var cb = mes.querySelector(".del_checkbox");
    if (selected) {
      mes.classList.add("selected");
      if (cb) {
        cb.checked = true;
        if (host.jQuery) host.jQuery(cb).prop("checked", true);
      }
    } else {
      mes.classList.remove("selected");
      if (cb) {
        cb.checked = false;
        if (host.jQuery) host.jQuery(cb).prop("checked", false);
      }
    }
  }

  function applySelectionList(selectedList) {
    var chat = getChat();
    if (!chat) return;
    var allMes = chat.querySelectorAll(".mes");
    for (var i = 0; i < allMes.length; i += 1) {
      var shouldSelect = selectedList.indexOf(allMes[i]) !== -1;
      setSingleMesSelected(allMes[i], shouldSelect);
    }
  }

  function getCurrentlySelectedMesList() {
    var chat = getChat();
    if (!chat) return [];
    var allMes = chat.querySelectorAll(".mes");
    var list = [];
    for (var i = 0; i < allMes.length; i += 1) {
      if (allMes[i].classList.contains("selected")) {
        list.push(allMes[i]);
      }
    }
    return list;
  }

  function isRangeAllSelectedFrom(startMes) {
    var chat = getChat();
    if (!chat) return false;
    var allMes = chat.querySelectorAll(".mes");
    var reached = false;
    for (var i = 0; i < allMes.length; i += 1) {
      if (allMes[i] === startMes) reached = true;
      if (reached) {
        if (!allMes[i].classList.contains("selected")) {
          return false;
        }
      }
    }
    return reached;
  }

  function syncStInternalStateAndApply(targetList) {
    if (targetList.length === 0) {
      clearAllDeleteSelection();
      host.requestAnimationFrame(clearAllDeleteSelection);
      return;
    }
    var firstMes = targetList[0];
    var firstCb = firstMes.querySelector(".del_checkbox");
    if (firstCb) {
      internalTrigger = true;
      try {
        firstCb.checked = false;
        if (host.jQuery) {
          host.jQuery(firstCb).trigger("click");
        } else {
          firstCb.click();
        }
      } finally {
        internalTrigger = false;
      }
    }
    applySelectionList(targetList);
    host.requestAnimationFrame(function () {
      applySelectionList(targetList);
    });
  }

  function onMesDeleteClick(event) {
    if (!toggles.deleteEasySelect || internalTrigger) return;
    var target = event.target;
    if (!target || target.nodeType !== 1) return;
    if (!isDeletingMode()) return;

    var mes = target.closest("#chat .mes");
    if (!mes) return;

    if (
      target.closest(
        "a, button, .mes_buttons, .mes_edit_buttons, textarea, input:not(.del_checkbox)"
      )
    ) {
      return;
    }

    var cb = mes.querySelector(".del_checkbox");
    if (!cb) return;

    var isCheckbox = Boolean(target.closest(".del_checkbox"));
    var prevSelected = getCurrentlySelectedMesList();
    var wasThisMesSelected = prevSelected.indexOf(mes) !== -1;

    captureScrollLock(1000);

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }

    if (isCheckbox) {
      if (isRangeAllSelectedFrom(mes)) {
        syncStInternalStateAndApply([]);
      } else {
        var chat = getChat();
        var allMes = chat ? chat.querySelectorAll(".mes") : [];
        var rangeList = [];
        var reached = false;
        for (var i = 0; i < allMes.length; i += 1) {
          if (allMes[i] === mes) reached = true;
          if (reached) rangeList.push(allMes[i]);
        }
        syncStInternalStateAndApply(rangeList);
      }
    } else {
      var nextList = [];
      for (var j = 0; j < prevSelected.length; j += 1) {
        if (prevSelected[j] !== mes) {
          nextList.push(prevSelected[j]);
        }
      }
      if (!wasThisMesSelected) {
        nextList.push(mes);
      }
      var chatEl = getChat();
      var allNodes = chatEl ? Array.prototype.slice.call(chatEl.querySelectorAll(".mes")) : [];
      nextList.sort(function (a, b) {
        return allNodes.indexOf(a) - allNodes.indexOf(b);
      });
      syncStInternalStateAndApply(nextList);
    }
  }

  /* ==========================================
   * 模块 3：双击正文精准定位编辑与悬浮保存栏
   * ========================================== */
  var quickEditStyleId = "rabbit-toolbox-quick-edit-style";
  var lastTapTime = 0;
  var lastTapX = 0;
  var lastTapY = 0;
  var lastTapTarget = null;
  var quickEditBar = null;
  var editPollTimer = null;

  var editScrollLockUntil = 0;
  var editSavedChatScrollTop = 0;
  var editTargetMesId = null;
  var editSnippetText = "";
  var editCaretRatio = 0;
  var editViewportFocusY = 0;

  function ensureQuickEditStyle() {
    if (doc.getElementById(quickEditStyleId)) return;
    var style = doc.createElement("style");
    style.id = quickEditStyleId;
    style.textContent =
      "#rabbit-quick-edit-bar {" +
      "  position: fixed;" +
      "  right: 12px;" +
      "  bottom: var(--rabbit-kb-offset, 54px);" +
      "  display: none;" +
      "  align-items: center;" +
      "  gap: 6px;" +
      "  margin: 0;" +
      "  padding: 0;" +
      "  background: transparent;" +
      "  z-index: 9999;" +
      "  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Microsoft YaHei', sans-serif;" +
      "  -webkit-font-smoothing: antialiased;" +
      "}" +
      "#rabbit-quick-edit-bar.is-visible {" +
      "  display: inline-flex;" +
      "}" +
      "#rabbit-quick-edit-bar > button {" +
      "  appearance: none;" +
      "  -webkit-appearance: none;" +
      "  display: inline-flex;" +
      "  align-items: center;" +
      "  justify-content: center;" +
      "  height: 30px;" +
      "  margin: 0;" +
      "  padding: 0 12px;" +
      "  box-sizing: border-box;" +
      "  border: none !important;" +
      "  border-radius: 0 !important;" +
      "  outline: none !important;" +
      "  box-shadow: none !important;" +
      "  text-shadow: none !important;" +
      "  font-family: inherit;" +
      "  font-size: 12px;" +
      "  font-weight: 600;" +
      "  line-height: 1;" +
      "  letter-spacing: 0.02em;" +
      "  cursor: pointer;" +
      "}" +
      "#rabbit-quick-edit-save {" +
      "  color: #faf9f6 !important;" +
      "  background: #161615 !important;" +
      "}" +
      "#rabbit-quick-edit-cancel {" +
      "  color: #0f0f0f !important;" +
      "  background: #E4E3DF !important;" +
      "}";
    (doc.head || doc.documentElement).appendChild(style);
  }

  function ensureQuickEditBar() {
    ensureQuickEditStyle();
    var existing = doc.getElementById("rabbit-quick-edit-bar");
    if (existing) {
      quickEditBar = existing;
      return existing;
    }

    var bar = doc.createElement("div");
    bar.id = "rabbit-quick-edit-bar";

    var saveBtn = doc.createElement("button");
    saveBtn.type = "button";
    saveBtn.id = "rabbit-quick-edit-save";
    saveBtn.textContent = "保存";

    var cancelBtn = doc.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.id = "rabbit-quick-edit-cancel";
    cancelBtn.textContent = "取消";

    saveBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      triggerActiveEditAction(".mes_edit_done");
    });

    cancelBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      triggerActiveEditAction(".mes_edit_cancel");
    });

    bar.appendChild(cancelBtn);
    bar.appendChild(saveBtn);
    doc.body.appendChild(bar);
    quickEditBar = bar;
    return bar;
  }

  function getActiveEditTextarea() {
    return doc.querySelector("#chat #curEditTextarea, #chat .mes .edit_textarea");
  }

  function measureCaretOffsetInTextarea(textarea, caretIndex) {
    var textBefore = (textarea.value || "").slice(0, caretIndex);
    var mirror = doc.createElement("div");
    var style = host.getComputedStyle(textarea);

    mirror.style.position = "absolute";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";
    mirror.style.overflowWrap = "break-word";
    mirror.style.boxSizing = style.boxSizing;
    mirror.style.width = textarea.clientWidth + "px";
    mirror.style.padding = style.padding;
    mirror.style.font = style.font;
    mirror.style.lineHeight = style.lineHeight;
    mirror.style.letterSpacing = style.letterSpacing;

    mirror.textContent = textBefore;
    var span = doc.createElement("span");
    span.textContent = "|";
    mirror.appendChild(span);

    doc.body.appendChild(mirror);
    var caretTop = span.offsetTop;
    doc.body.removeChild(mirror);
    return caretTop;
  }

  function captureEditAreaLock(textarea) {
    var chat = getChat();
    if (!chat || !textarea) return;

    var mes = textarea.closest(".mes");
    editTargetMesId = mes ? mes.getAttribute("mesid") : null;

    var val = textarea.value || "";
    var caret = typeof textarea.selectionStart === "number" ? textarea.selectionStart : 0;
    editCaretRatio = val.length > 0 ? Math.max(0, Math.min(1, caret / val.length)) : 0;

    var start = Math.max(0, caret - 12);
    var end = Math.min(val.length, caret + 12);
    editSnippetText = val.slice(start, end).replace(/[\r\n]+/g, " ").trim();

    var chatRect = chat.getBoundingClientRect();
    var taRect = textarea.getBoundingClientRect();
    var caretTopInTa = measureCaretOffsetInTextarea(textarea, caret);
    var caretVisualY = taRect.top + (caretTopInTa - textarea.scrollTop);
    editViewportFocusY = Math.max(
      chatRect.top + 80,
      Math.min(chatRect.bottom - 80, caretVisualY)
    );

    editSavedChatScrollTop = chat.scrollTop;
    lockUntil = 0;
    editScrollLockUntil = Date.now() + 220;
  }

  function findRenderedBlockY(mesText, snippet, ratio) {
    var rect = mesText.getBoundingClientRect();
    if (snippet && snippet.length >= 2) {
      var blocks = mesText.querySelectorAll("p, li, blockquote, div, span");
      var probe = snippet.slice(0, 8).trim();
      for (var i = 0; i < blocks.length; i += 1) {
        var b = blocks[i];
        var txt = (b.innerText || b.textContent || "").replace(/[\r\n]+/g, " ");
        if (probe && txt.indexOf(probe) !== -1) {
          var bRect = b.getBoundingClientRect();
          if (bRect.height > 0 && bRect.height < rect.height * 0.85) {
            return bRect.top + Math.min(24, bRect.height * 0.5);
          }
        }
      }
    }
    return rect.top + rect.height * ratio;
  }

  function restoreEditScrollPosition() {
    if (Date.now() > editScrollLockUntil) return;
    var chat = getChat();
    if (!chat) return;

    if (editTargetMesId !== null) {
      var mes = chat.querySelector('.mes[mesid="' + editTargetMesId + '"]');
      if (mes && !mes.querySelector("#curEditTextarea, .edit_textarea")) {
        var mesText = mes.querySelector(".mes_text");
        if (mesText) {
          var targetVisualY = findRenderedBlockY(mesText, editSnippetText, editCaretRatio);
          var chatRect = chat.getBoundingClientRect();
          var desiredY = editViewportFocusY || (chatRect.top + chatRect.height * 0.42);
          var delta = targetVisualY - desiredY;
          if (Math.abs(delta) > 4) {
            chat.scrollTop += delta;
          }
          editSavedChatScrollTop = chat.scrollTop;
          editScrollLockUntil = 0;
          return;
        }
      }
    }

    if (Math.abs(chat.scrollTop - editSavedChatScrollTop) > 2) {
      chat.scrollTop = editSavedChatScrollTop;
    }
  }

  function scheduleEditScrollRestore() {
    host.requestAnimationFrame(restoreEditScrollPosition);
    var delays = [16, 50, 120];
    for (var i = 0; i < delays.length; i += 1) {
      host.setTimeout(restoreEditScrollPosition, delays[i]);
    }
  }

  function triggerActiveEditAction(selector) {
    var textarea = getActiveEditTextarea();
    if (!textarea) {
      updateQuickEditBarVisibility();
      return;
    }
    var mes = textarea.closest(".mes");
    if (!mes) return;
    var btn = mes.querySelector(selector);
    if (btn) {
      captureEditAreaLock(textarea);
      btn.click();
      scheduleEditScrollRestore();
    }
    host.setTimeout(updateQuickEditBarVisibility, 60);
  }

  function onNativeEditFinishPreDown(event) {
    if (!toggles.doubleClickEdit) return;
    var target = event.target;
    if (!target || target.nodeType !== 1) return;
    var finishBtn = target.closest(".mes_edit_done, .mes_edit_cancel");
    if (!finishBtn) return;

    var textarea = getActiveEditTextarea();
    if (textarea) {
      captureEditAreaLock(textarea);
      scheduleEditScrollRestore();
    }
  }

  function updateQuickEditBarPosition() {
    if (!quickEditBar) return;
    var offset = 54;
    if (host.visualViewport) {
      var kbHeight = host.innerHeight - host.visualViewport.height - host.visualViewport.offsetTop;
      if (kbHeight > 80) {
        offset = Math.round(kbHeight + 12);
      }
    }
    quickEditBar.style.setProperty("--rabbit-kb-offset", offset + "px");
  }

  function updateQuickEditBarVisibility() {
    var bar = ensureQuickEditBar();
    if (!toggles.doubleClickEdit) {
      bar.classList.remove("is-visible");
      return;
    }
    var textarea = getActiveEditTextarea();
    if (textarea) {
      bar.classList.add("is-visible");
      updateQuickEditBarPosition();
    } else {
      bar.classList.remove("is-visible");
    }
  }

  function getCaretSnippetsFromPoint(x, y, fallbackElement) {
    var node = null;
    var offset = 0;

    if (typeof doc.caretPositionFromPoint === "function") {
      var pos = doc.caretPositionFromPoint(x, y);
      if (pos) {
        node = pos.offsetNode;
        offset = pos.offset;
      }
    } else if (typeof doc.caretRangeFromPoint === "function") {
      var range = doc.caretRangeFromPoint(x, y);
      if (range) {
        node = range.startContainer;
        offset = range.startOffset;
      }
    }

    var block = fallbackElement ? fallbackElement.closest("p, li, blockquote, div.mes_text") : null;
    var blockText = block ? (block.innerText || block.textContent || "").trim() : "";

    if (node && node.nodeType === 3) {
      var text = node.nodeValue || "";
      var exact = text.slice(Math.max(0, offset - 6), Math.min(text.length, offset + 6)).trim();
      var before = text.slice(Math.max(0, offset - 10), offset).trim();
      var after = text.slice(offset, Math.min(text.length, offset + 10)).trim();
      return {
        exact: exact,
        before: before,
        after: after,
        localOffset: before.length,
        blockText: blockText
      };
    }

    return {
      exact: "",
      before: "",
      after: "",
      localOffset: 0,
      blockText: blockText
    };
  }

  function findBestCaretIndex(rawText, info, clickRatio) {
    if (!rawText) return 0;

    if (info.exact && info.exact.length >= 2) {
      var idx = rawText.indexOf(info.exact);
      if (idx !== -1) {
        return Math.min(rawText.length, idx + (info.localOffset || 0));
      }
    }

    if (info.before && info.before.length >= 2) {
      var bIdx = rawText.indexOf(info.before);
      if (bIdx !== -1) {
        return Math.min(rawText.length, bIdx + info.before.length);
      }
    }

    if (info.after && info.after.length >= 2) {
      var aIdx = rawText.indexOf(info.after);
      if (aIdx !== -1) {
        return aIdx;
      }
    }

    if (info.blockText) {
      var probe = info.blockText.slice(0, 12).trim();
      if (probe.length >= 2) {
        var pIdx = rawText.indexOf(probe);
        if (pIdx !== -1) {
          return pIdx;
        }
      }
    }

    return Math.floor(rawText.length * Math.max(0, Math.min(1, clickRatio || 0)));
  }

  function scrollTextareaToCaret(textarea, caretIndex) {
    var caretTop = measureCaretOffsetInTextarea(textarea, caretIndex);

    if (textarea.scrollHeight > textarea.clientHeight) {
      textarea.scrollTop = Math.max(0, caretTop - textarea.clientHeight * 0.4);
    }

    var chat = getChat();
    if (chat) {
      var taRect = textarea.getBoundingClientRect();
      var chatRect = chat.getBoundingClientRect();
      var caretViewportY = taRect.top + Math.min(caretTop - textarea.scrollTop, textarea.clientHeight);
      var idealY = chatRect.top + chatRect.height * 0.38;
      var delta = caretViewportY - idealY;
      if (Math.abs(delta) > 24) {
        chat.scrollTop += delta;
      }
    }
  }

  function openMesEditAndLocate(mes, clientX, clientY, targetEl) {
    if (!toggles.doubleClickEdit) return;
    if (isDeletingMode()) return;
    if (!mes || mes.classList.contains("yt-home-message")) return;
    if (mes.querySelector("#curEditTextarea, .edit_textarea")) return;

    var mesText = mes.querySelector(".mes_text");
    if (!mesText) return;

    var rect = mesText.getBoundingClientRect();
    var clickRatio = rect.height > 0 ? (clientY - rect.top) / rect.height : 0;
    var snippets = getCaretSnippetsFromPoint(clientX, clientY, targetEl);

    var editBtn = mes.querySelector(".mes_edit");
    if (!editBtn) return;

    captureScrollLock(200);
    editBtn.click();

    var attempts = 0;
    function waitForTextarea() {
      attempts += 1;
      var textarea = mes.querySelector("#curEditTextarea, .edit_textarea");
      if (!textarea) {
        if (attempts < 20) {
          host.setTimeout(waitForTextarea, 25);
        }
        return;
      }

      var caretIdx = findBestCaretIndex(textarea.value || "", snippets, clickRatio);
      try {
        textarea.focus({ preventScroll: true });
      } catch (err) {
        textarea.focus();
      }
      textarea.setSelectionRange(caretIdx, caretIdx);
      scrollTextareaToCaret(textarea, caretIdx);
      updateQuickEditBarVisibility();
    }

    host.requestAnimationFrame(waitForTextarea);
  }

  function isInteractiveInMesText(target) {
    if (!target || target.nodeType !== 1) return true;
    return Boolean(
      target.closest(
        "a, button, input, textarea, select, summary, details, audio, video, " +
        ".mes_buttons, .mes_edit_buttons"
      )
    );
  }

  function onMesTextDblClick(event) {
    if (!toggles.doubleClickEdit) return;
    var target = event.target;
    if (!target || target.nodeType !== 1) return;
    var mesText = target.closest("#chat .mes .mes_text");
    if (!mesText || isInteractiveInMesText(target)) return;

    var mes = mesText.closest(".mes");
    openMesEditAndLocate(mes, event.clientX, event.clientY, target);
  }

  var touchDownX = 0;
  var touchDownY = 0;
  var touchDownTime = 0;
  var touchMoved = false;

  function onMesTextTouchStart(event) {
    cancelAllScrollLocks(event);
    if (!toggles.doubleClickEdit) return;
    var touch = event.touches && event.touches[0];
    if (!touch || event.touches.length > 1) {
      touchMoved = true;
      lastTapTime = 0;
      return;
    }
    touchDownX = touch.clientX;
    touchDownY = touch.clientY;
    touchDownTime = Date.now();
    touchMoved = false;
  }

  function onMesTextTouchMove(event) {
    cancelAllScrollLocks(event);
    if (!toggles.doubleClickEdit || touchMoved) return;
    var touch = event.touches && event.touches[0];
    if (!touch) return;
    if (Math.abs(touch.clientX - touchDownX) > 8 || Math.abs(touch.clientY - touchDownY) > 8) {
      touchMoved = true;
      lastTapTime = 0;
    }
  }

  function onMesTextTouchEnd(event) {
    if (!toggles.doubleClickEdit) return;
    if (touchMoved || (Date.now() - touchDownTime) > 220) {
      lastTapTime = 0;
      return;
    }
    var target = event.target;
    if (!target || target.nodeType !== 1) return;
    var mesText = target.closest("#chat .mes .mes_text");
    if (!mesText || isInteractiveInMesText(target)) {
      lastTapTime = 0;
      return;
    }

    var touch = event.changedTouches && event.changedTouches[0];
    if (!touch) return;

    var now = Date.now();
    var dt = now - lastTapTime;
    var dx = Math.abs(touch.clientX - lastTapX);
    var dy = Math.abs(touch.clientY - lastTapY);

    if (dt > 50 && dt < 260 && dx < 14 && dy < 14 && lastTapTarget && mesText.contains(lastTapTarget)) {
      lastTapTime = 0;
      event.preventDefault();
      var mes = mesText.closest(".mes");
      openMesEditAndLocate(mes, touch.clientX, touch.clientY, target);
      return;
    }

    lastTapTime = now;
    lastTapX = touch.clientX;
    lastTapY = touch.clientY;
    lastTapTarget = target;
  }

  function onDocumentCheckEditState() {
    host.setTimeout(updateQuickEditBarVisibility, 40);
  }

  function onCombinedChatScroll(event) {
    if (event.target && event.target.id === "chat") {
      onChatScroll();
      if (toggles.doubleClickEdit && Date.now() <= editScrollLockUntil) {
        restoreEditScrollPosition();
      }
    }
  }

  /* ==========================================
   * 模块 4：头像高清原图显示 & 正方形裁剪补白上传
   * ========================================== */
  var originalFetch = host.fetch;
  var failedAvatars = new WeakMap();
  var loadingAvatars = new WeakMap();
  var avatarFrame = 0;
  var cropperTimer = null;

  function loadImageFromBlob(blob) {
    return new Promise(function (resolve, reject) {
      var url = host.URL.createObjectURL(blob);
      var img = new host.Image();
      img.onload = function () {
        host.URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = function () {
        host.URL.revokeObjectURL(url);
        reject(new Error("无法读取选中的图片"));
      };
      img.src = url;
    });
  }

  function preparePaddedAvatar(file, crop) {
    var x = Number(crop.x);
    var y = Number(crop.y);
    var width = Number(crop.width);
    var height = Number(crop.height);

    if (
      ![x, y, width, height].every(Number.isFinite) ||
      width <= 0 ||
      height <= 0 ||
      Math.abs(width / height - 1) > 0.02
    ) {
      return Promise.reject(new Error("请等待裁剪框变成正方形后再确认"));
    }

    var scaleX = crop.scaleX !== undefined && crop.scaleX !== null ? crop.scaleX : 1;
    var scaleY = crop.scaleY !== undefined && crop.scaleY !== null ? crop.scaleY : 1;

    if (
      Number(crop.rotate || 0) !== 0 ||
      Number(scaleX) !== 1 ||
      Number(scaleY) !== 1
    ) {
      return Promise.reject(new Error("暂不支持旋转或翻转，请保持原方向裁剪"));
    }

    return loadImageFromBlob(file).then(function (img) {
      var canvas = doc.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1200;

      var ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("无法创建图片画布");

      ctx.fillStyle = "#F3F2EE";
      ctx.fillRect(0, 0, 800, 1200);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, x, y, width, height, 0, 200, 800, 800);

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error("图片生成失败"));
        }, "image/png");
      });
    });
  }

  function wrappedFetch(input, init) {
    if (!toggles.avatarSquareUpload) {
      return originalFetch.apply(this, arguments);
    }

    var isRequest = input instanceof host.Request;
    var url = new URL(
      isRequest ? input.url : String(input),
      host.location.href
    );

    var method = (init && init.method) || (isRequest ? input.method : "GET");
    var validPaths = [
      "/api/avatars/upload",
      "/api/characters/create",
      "/api/characters/edit"
    ];

    if (
      url.origin !== host.location.origin ||
      validPaths.indexOf(url.pathname) === -1 ||
      method.toUpperCase() !== "POST" ||
      !url.searchParams.has("crop")
    ) {
      return originalFetch.apply(this, arguments);
    }

    var selfArgs = arguments;
    return Promise.resolve().then(function () {
      var bodyPromise = (init && init.body)
        ? Promise.resolve(init.body)
        : (isRequest ? input.clone().formData() : Promise.resolve(null));

      return bodyPromise.then(function (body) {
        if (!(body instanceof host.FormData)) {
          throw new Error("上传格式与预期不同，已停止本次上传");
        }

        var file = body.get("avatar");
        if (!(file instanceof host.Blob) || !file.size) {
          throw new Error("没有读取到头像文件，已停止本次上传");
        }

        var crop = JSON.parse(url.searchParams.get("crop"));
        if (!crop || typeof crop !== "object") {
          throw new Error("没有读取到有效的裁剪参数");
        }

        return preparePaddedAvatar(file, crop).then(function (padded) {
          var nextBody = new host.FormData();
          var entries = body.entries();
          var step;
          while (!(step = entries.next()).done) {
            var key = step.value[0];
            var value = step.value[1];
            if (key !== "avatar" && key !== "crop") {
              nextBody.append(key, value);
            }
          }

          nextBody.append("avatar", padded, "avatar.png");
          url.searchParams.delete("crop");

          var headers = new host.Headers(
            (init && init.headers) || (isRequest ? input.headers : undefined)
          );
          headers.delete("content-type");
          headers.delete("content-length");

          var nextInit = Object.assign({}, init || {}, {
            method: method,
            headers: headers,
            body: nextBody
          });

          if (isRequest) {
            if (nextInit.credentials === undefined) nextInit.credentials = input.credentials;
            if (nextInit.mode === undefined) nextInit.mode = input.mode;
            if (nextInit.signal === undefined) nextInit.signal = input.signal;
          }

          return originalFetch.call(host, url.href, nextInit);
        });
      });
    }).catch(function (error) {
      host.alert("头像未上传：" + error.message);
      throw error;
    });
  }

  function updateCropper() {
    if (stopped || !toggles.avatarSquareUpload) return;

    var imgs = doc.querySelectorAll("img.popup-crop-image");
    for (var i = 0; i < imgs.length; i += 1) {
      var img = imgs[i];
      try {
        var cropper = img.cropper || (host.jQuery && host.jQuery(img).data("cropper"));
        if (
          cropper &&
          typeof cropper.setAspectRatio === "function" &&
          Number(cropper.options && cropper.options.aspectRatio) !== 1
        ) {
          cropper.setAspectRatio(1);
        }
      } catch (e) {}
    }
  }

  function updateAvatars() {
    avatarFrame = 0;
    if (stopped || !toggles.avatarHdOriginal) return;

    var selector = "#chat .avatar img, #avatar_load_preview, #rm_print_characters_block .avatar img, #user_avatar_block .avatar img, #quickPersonaImg, .quickPersonaMenuImg";
    var imgs = doc.querySelectorAll(selector);

    imgs.forEach(function (img) {
      try {
        var source = img.getAttribute("src");
        if (
          !source ||
          failedAvatars.get(img) === source ||
          loadingAvatars.get(img) === source
        ) {
          return;
        }

        var url = new URL(source, host.location.href);
        var type = url.searchParams.get("type");

        if (
          url.origin !== host.location.origin ||
          !/thumbnail/i.test(url.pathname) ||
          (type !== "persona" && type !== "avatar") ||
          !url.searchParams.has("file")
        ) {
          return;
        }

        var folder = type === "persona" ? "/User%20Avatars/" : "/characters/";
        var original = new URL(
          folder + encodeURIComponent(url.searchParams.get("file")),
          host.location.origin
        );

        url.searchParams.forEach(function (value, key) {
          if (key !== "type" && key !== "file") {
            original.searchParams.append(key, value);
          }
        });

        loadingAvatars.set(img, source);
        var probe = new host.Image();

        probe.onload = function () {
          if (loadingAvatars.get(img) === source) {
            loadingAvatars.delete(img);
          }
          if (
            !stopped &&
            toggles.avatarHdOriginal &&
            img.isConnected &&
            img.getAttribute("src") === source
          ) {
            img.src = original.href;
          }
        };

        probe.onerror = function () {
          if (loadingAvatars.get(img) === source) {
            loadingAvatars.delete(img);
          }
          failedAvatars.set(img, source);
        };

        probe.src = original.href;
      } catch (e) {}
    });
  }

  /* ==========================================
   * 模块 5：扩展菜单入口与开关设置弹窗
   * ========================================== */
  var activeModalClose = null;

  function openToolboxModal() {
    if (stopped) return;
    if (activeModalClose) activeModalClose();

    var extMenu = doc.getElementById("extensionsMenu");
    if (extMenu) extMenu.style.display = "none";

    var overlay = make("div");
    overlay.style.cssText =
      "position:fixed;top:0;left:0;width:100vw;height:100dvh;" +
      "z-index:2147483646;display:flex;align-items:center;justify-content:center;" +
      "padding:max(24px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom));" +
      "box-sizing:border-box;overflow-y:auto;-webkit-overflow-scrolling:touch;" +
      "background:rgba(15,15,15,0.35);touch-action:pan-y;";

    var box = make("div");
    box.style.cssText =
      "width:min(92vw,340px);max-height:calc(100dvh - 64px);margin:auto;" +
      "overflow-y:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box;" +
      "padding:18px;border:0;border-radius:0;background:#f5f5f3;" +
      "color:#0f0f0f;box-shadow:none;" +
      "font-family:var(--tt-channel-font, -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif);" +
      "text-shadow:none;";

    var title = make("div", "", "工具箱功能开关");
    title.style.cssText = "font-size:15px;font-weight:650;margin:0 0 14px;color:#0f0f0f;";
    box.appendChild(title);

    var items = [
      {
        key: "deleteScrollLock",
        title: "删除消息防跳回顶部",
        desc: "删除楼层或勾选删除框时锁定当前画面位置"
      },
      {
        key: "deleteEasySelect",
        keyAfter: syncDeleteStyle,
        title: "多选/单选删除",
        desc: "点击勾选框为经典多选删除，点击正文为单选删除"
      },
      {
        key: "doubleClickEdit",
        keyAfter: updateQuickEditBarVisibility,
        title: "双击正文精准定位编辑",
        desc: "双击楼层文字直接打开编辑框并定位光标，底部悬浮保存栏"
      },
      {
        key: "avatarHdOriginal",
        keyAfter: function () { if (toggles.avatarHdOriginal) updateAvatars(); },
        title: "高清原图头像显示",
        desc: "将聊天与列表中的压缩缩略图替换为清晰原图"
      },
      {
        key: "avatarSquareUpload",
        keyAfter: function () { if (toggles.avatarSquareUpload) updateCropper(); },
        title: "头像正方形裁剪与补白上传",
        desc: "上传头像时强制正方形裁剪"
      }
    ];

    items.forEach(function (item, idx) {
      var row = make("div");
      row.style.cssText =
        "display:flex;align-items:center;justify-content:space-between;gap:12px;" +
        "padding:10px 0;" +
        (idx < items.length - 1 ? "border-bottom:1px solid #e2e2df;" : "");

      var textWrap = make("div");
      textWrap.style.cssText = "flex:1 1 auto;min-width:0;";

      var itemTitle = make("div", "", item.title);
      itemTitle.style.cssText = "font-size:13px;font-weight:600;color:#0f0f0f;margin:0 0 3px;";

      var itemDesc = make("div", "", item.desc);
      itemDesc.style.cssText = "font-size:11px;line-height:1.4;color:#6f6f6f;";

      textWrap.append(itemTitle, itemDesc);

      var toggleBtn = make("button");
      toggleBtn.type = "button";

      function renderBtnState() {
        var on = Boolean(toggles[item.key]);
        toggleBtn.textContent = on ? "已开启" : "已关闭";
        toggleBtn.style.cssText =
          "flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;" +
          "min-width:58px;height:28px !important;min-height:28px !important;padding:0 10px !important;" +
          "margin:0 !important;border:0 !important;border-radius:0 !important;" +
          "font-size:11px;font-family:inherit;font-weight:600;cursor:pointer;" +
          "box-shadow:none;text-shadow:none;" +
          (on ? "background:#161615;color:#f5f4f0;" : "background:#e0e0dc;color:#6f6f6f;");
      }

      renderBtnState();

      toggleBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggles[item.key] = !toggles[item.key];
        saveToggles();
        renderBtnState();
        if (item.keyAfter) item.keyAfter();
      });

      row.append(textWrap, toggleBtn);
      box.appendChild(row);
    });

    var actions = make("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;margin-top:16px;";

    var closeBtn = make("button", "", "完成");
    closeBtn.type = "button";
    closeBtn.style.cssText =
      "display:inline-flex;align-items:center;justify-content:center;" +
      "height:32px !important;min-height:32px !important;padding:0 18px !important;" +
      "margin:0 !important;border:0 !important;border-radius:0 !important;" +
      "background:#161615;color:#f5f4f0;font-size:12px;font-family:inherit;font-weight:550;" +
      "cursor:pointer;box-shadow:none;text-shadow:none;";

    actions.appendChild(closeBtn);
    box.appendChild(actions);
    overlay.appendChild(box);
    doc.documentElement.appendChild(overlay);

    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      overlay.remove();
      if (activeModalClose === close) activeModalClose = null;
    }

    activeModalClose = close;

    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      close();
    });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
  }

  function ensureExtensionMenuItem() {
    var menu = doc.getElementById("extensionsMenu");
    if (!menu || doc.getElementById("rabbit-toolbox-menu-item")) return;

    var item = make("div", "list-group-item flex-container flexGap5 interactable", undefined, "rabbit-toolbox-menu-item");
    item.tabIndex = 0;
    item.style.cssText = "display:flex;align-items:center;cursor:pointer;";

    var icon = make("div", "extensionsMenuExtensionButton");
    icon.textContent = "✦";
    icon.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:18px;font-size:13px;line-height:1;";

    var text = make("span", "", "兔兔工具箱");
    item.append(icon, text);
    menu.appendChild(item);

    item.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      openToolboxModal();
    });
  }

  /* ==========================================
   * 事件绑定与销毁清理
   * ========================================== */
  host.fetch = wrappedFetch;
  cropperTimer = host.setInterval(function () {
    updateCropper();
    ensureExtensionMenuItem();
  }, 400);

  var domObserver = new host.MutationObserver(function () {
    ensureExtensionMenuItem();
    if (!avatarFrame && !stopped && toggles.avatarHdOriginal) {
      avatarFrame = host.requestAnimationFrame(updateAvatars);
    }
  });

  domObserver.observe(doc.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["src"]
  });

  doc.addEventListener("click", onMesDeleteClick, true);

  doc.addEventListener("pointerdown", onNativeEditFinishPreDown, true);
  doc.addEventListener("touchstart", onNativeEditFinishPreDown, { capture: true, passive: true });
  doc.addEventListener("mousedown", onNativeEditFinishPreDown, true);

  doc.addEventListener("pointerdown", onPreInteraction, true);
  doc.addEventListener("touchstart", onPreInteraction, { capture: true, passive: true });
  doc.addEventListener("mousedown", onPreInteraction, true);
  doc.addEventListener("click", onPreInteraction, true);
  doc.addEventListener("wheel", cancelAllScrollLocks, { capture: true, passive: true });
  doc.addEventListener("focusin", onFocusIn, true);
  doc.addEventListener("scroll", onCombinedChatScroll, true);

  doc.addEventListener("dblclick", onMesTextDblClick, true);
  doc.addEventListener("touchstart", onMesTextTouchStart, { capture: true, passive: true });
  doc.addEventListener("touchmove", onMesTextTouchMove, { capture: true, passive: true });
  doc.addEventListener("touchend", onMesTextTouchEnd, { capture: true, passive: false });
  doc.addEventListener("click", onDocumentCheckEditState, true);
  doc.addEventListener("focusin", onDocumentCheckEditState, true);
  doc.addEventListener("focusout", onDocumentCheckEditState, true);

  if (host.visualViewport) {
    host.visualViewport.addEventListener("resize", updateQuickEditBarPosition);
    host.visualViewport.addEventListener("scroll", updateQuickEditBarPosition);
  }

  editPollTimer = host.setInterval(updateQuickEditBarVisibility, 400);

  ensureExtensionMenuItem();
  updateCropper();
  updateAvatars();

  function destroy() {
    if (stopped) return;
    stopped = true;

    if (activeModalClose) activeModalClose();
    if (lockTimer !== null) host.clearTimeout(lockTimer);
    if (editPollTimer !== null) host.clearInterval(editPollTimer);
    if (cropperTimer !== null) host.clearInterval(cropperTimer);
    if (avatarFrame) host.cancelAnimationFrame(avatarFrame);

    domObserver.disconnect();

    if (host.fetch === wrappedFetch) {
      host.fetch = originalFetch;
    }

    var delStyle = doc.getElementById(styleId);
    if (delStyle && delStyle.parentNode) delStyle.parentNode.removeChild(delStyle);

    var quickStyleEl = doc.getElementById(quickEditStyleId);
    if (quickStyleEl && quickStyleEl.parentNode) quickStyleEl.parentNode.removeChild(quickStyleEl);

    var bar = doc.getElementById("rabbit-quick-edit-bar");
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);

    var menuItem = doc.getElementById("rabbit-toolbox-menu-item");
    if (menuItem && menuItem.parentNode) menuItem.parentNode.removeChild(menuItem);

    doc.removeEventListener("click", onMesDeleteClick, true);
    doc.removeEventListener("pointerdown", onNativeEditFinishPreDown, true);
    doc.removeEventListener("touchstart", onNativeEditFinishPreDown, true);
    doc.removeEventListener("mousedown", onNativeEditFinishPreDown, true);
    doc.removeEventListener("pointerdown", onPreInteraction, true);
    doc.removeEventListener("touchstart", onPreInteraction, true);
    doc.removeEventListener("mousedown", onPreInteraction, true);
    doc.removeEventListener("click", onPreInteraction, true);
    doc.removeEventListener("wheel", cancelAllScrollLocks, true);
    doc.removeEventListener("focusin", onFocusIn, true);
    doc.removeEventListener("scroll", onCombinedChatScroll, true);
    doc.removeEventListener("dblclick", onMesTextDblClick, true);
    doc.removeEventListener("touchstart", onMesTextTouchStart, true);
    doc.removeEventListener("touchmove", onMesTextTouchMove, true);
    doc.removeEventListener("touchend", onMesTextTouchEnd, true);
    doc.removeEventListener("click", onDocumentCheckEditState, true);
    doc.removeEventListener("focusin", onDocumentCheckEditState, true);
    doc.removeEventListener("focusout", onDocumentCheckEditState, true);

    if (host.visualViewport) {
      host.visualViewport.removeEventListener("resize", updateQuickEditBarPosition);
      host.visualViewport.removeEventListener("scroll", updateQuickEditBarPosition);
    }

    if (host[appKey] && host[appKey].destroy === destroy) {
      delete host[appKey];
    }
    if (host.__rabbitAvatarCombined === destroy) {
      delete host.__rabbitAvatarCombined;
    }
  }

  host.__rabbitAvatarCombined = destroy;
  host[appKey] = {
    destroy: destroy,
    openSettings: openToolboxModal
  };
})();
