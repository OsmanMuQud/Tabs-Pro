let groupDisplayProp = {};
let searchObject = {};

const handleBodyDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  let tab_id = e.dataTransfer.getData("tabid");
  if (!e.dataTransfer.getData("groupDrop")) {
    console.log("window requested");
    moveTabToNewWindow(tab_id);
  } else {
    let groupid = e.dataTransfer.getData("groupid");
    moveGroupToNewWindow(groupid);
  }
};
const removeNewTabs = () => {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "removeNewTabs" });
};
const handleEnterInput = (e) => {
  if (e.key === "Enter") {
    searchTabs();
  }
};
const handlePreventDefaultForDragOver = (e) => {
  e.preventDefault();
};
const handleThemeSwitching = () => {
  console.log("switching");
  chrome.storage.local.get(["dark"]).then((dark) => {
    console.log;
    if (chrome.runtime.lastError) return false;
    if (dark.dark === undefined) {
      chrome.storage.local
        .set({
          dark:
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches,
        })
        .then(() => {
          if (chrome.runtime.lastError) return false;
          console.log("Value is set");
        });
    } else {
      chrome.storage.local
        .set({
          dark: !dark.dark,
        })
        .then(() => {
          if (chrome.runtime.lastError) return false;
          document.querySelector(":root").classList.toggle("dark");
          document.getElementById("theme_img").classList.add("set_animation");
          document.getElementById("theme_img").classList.toggle("dark");
          if (dark.dark)
            document.getElementById("theme_img").src = "./assets/sun.png";
          else document.getElementById("theme_img").src = "./assets/moon.png";
        });
      document.getElementById("theme_img").classList.remove("set_animation");
    }
  });
};
window.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("group_button")
    .addEventListener("click", makeNewGroups);
  document
    .getElementById("ungroup_button")
    .addEventListener("click", unGroupAll);
  document
    .getElementById("merge_button")
    .addEventListener("click", mergeSameGroup);
  document
    .getElementById("remove_duplicate_button")
    .addEventListener("click", removeDuplicateTabs);
  document
    .getElementById("remove_newtab_button")
    .addEventListener("click", removeNewTabs);

  document
    .getElementById("search_button")
    .addEventListener("click", searchTabs);
  document.getElementById("clear_search").addEventListener("click", reloadAll);
  document
    .getElementById("search_input")
    .addEventListener("keydown", handleEnterInput);
  document
    .getElementsByTagName("body")[0]
    .addEventListener("dragover", handlePreventDefaultForDragOver);
  document
    .getElementsByTagName("body")[0]
    .addEventListener("drop", handleBodyDrop);
  console.log("Hello", document.getElementById("theme_handler"));
  document
    .getElementById("theme_handler")
    .addEventListener("click", handleThemeSwitching);
  refreshData();
  chrome.storage.local.get(["dark"]).then((dark) => {
    console.log(dark);
    if (chrome.runtime.lastError) return false;
    if (dark.dark === undefined) {
      dark.dark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      chrome.storage.local
        .set({
          dark:
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches,
        })
        .then(() => {
          if (chrome.runtime.lastError) return false;
          console.log("Value is set");
        });
    }
    if (dark.dark === true) {
      document.querySelector(":root").classList.add("dark");
      document.getElementById("theme_img").classList.add("dark");
      document.getElementById("theme_img").src = "./assets/moon.png";
    } else {
      document.getElementById("theme_img").src = "./assets/sun.png";
    }
  });
});

function buildUi({ groups, window, current }) {
  // document.getElementById("active_link").href = `#${current[0]?.windowId}`;
  let dashboard = document.getElementById("dashboard");
  let length = 0;
  for (let gid of Object.keys(groups)) {
    length += groups[gid].tabs.length;
  }

  const main_container = document.getElementById("data_content");

  let arrayOfChildren = [];
  let winCount = 1;
  for (let key of Object.keys(window)) {
    if (key === "nogroup") continue;
    let window_container = document.createElement("fieldset");
    if (parseInt(current[0]?.windowId) === parseInt(key)) {
      window_container.classList.add("active_window");
      window_container.id;
    }
    window_container.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      let tab_id = e.dataTransfer.getData("tabid");
      let from_window = e.dataTransfer.getData("windowid");
      if (
        !e.dataTransfer.getData("groupDrop") &&
        (parseInt(from_window) !== parseInt(key) ||
          parseInt(e.dataTransfer.getData("groupid")) !== -1)
      ) {
        console.log("window requested");
        moveTabToWindow(tab_id, parseInt(key));
      } else if (e.dataTransfer.getData("groupDrop")) {
        let groupid = e.dataTransfer.getData("groupid");
        moveGroupToWindow(groupid, key);
      }
    });
    window_container.addEventListener(
      "dragover",
      handlePreventDefaultForDragOver
    );
    let window_header = document.createElement("div");
    window_header.className = "window_header";
    let ledg = document.createElement("legend");

    let close_button = document.createElement("img");
    close_button.src = "./assets/closeicon.png";
    close_button.title = "Remove this window";
    close_button.className = "window_button";
    close_button.addEventListener("click", () => {
      removeWindow(key);
    });

    let activate_button = document.createElement("img");
    activate_button.src = "./assets/activateicon.png";
    activate_button.title = "Goto this window";
    activate_button.className = "window_button";
    activate_button.addEventListener("click", () => {
      activateWindow(key);
    });

    let add_group_button = document.createElement("img");
    add_group_button.src = "./assets/addgroupicon.png";
    add_group_button.title = "Add a new group";
    add_group_button.className = "window_button add_button";
    add_group_button.addEventListener("click", () => {
      addNewGroup(key);
    });
    let add_tab_button = document.createElement("img");
    add_tab_button.src = "./assets/add.png";
    add_tab_button.title = "Add a new tab";
    add_tab_button.className = "window_button add_button";
    add_tab_button.addEventListener("click", () => {
      addNewTabToWindow(key);
    });
    let window_button_holder = document.createElement("div");
    window_button_holder.className = "window_button_holder";
    ledg.innerText = `Window No. ${winCount++}`;
    window_header.appendChild(ledg);
    window_button_holder.appendChild(add_tab_button);
    window_button_holder.appendChild(add_group_button);
    window_button_holder.appendChild(activate_button);
    window_button_holder.appendChild(close_button);
    window_header.appendChild(window_button_holder);
    window_container.classList.add("window_container");
    window_container.id = key;
    window_container.appendChild(window_header);
    for (let groupid of window[key]) {
      let group_container = document.createElement("div");
      let circle = document.createElement("div");
      circle.style = { "background-color": groups[groupid].color };
      circle.className = `circle_bullet ${groups[groupid].color}`;
      let group_heading = document.createElement("input");
      group_heading.value = groups[groupid].name;
      group_heading.type = "text";
      group_heading.readOnly = true;
      group_heading.className = "group_heading";
      group_heading.addEventListener("dblclick", (e) => {
        e.target.readOnly = false;
        e.target.className = "group_heading typing";
      });
      group_heading.addEventListener("blur", (e) => {
        e.target.readOnly = true;
        e.target.className = "group_heading";
        changeGroupName(groupid, e.target.value);
      });
      group_heading.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.target.readOnly = true;
          e.target.className = "group_heading";
          changeGroupName(groupid, e.target.value);
        }
      });
      let tab_count = document.createElement("p");
      tab_count.innerText = `${groups[groupid].tabs.length} ${
        groups[groupid].tabs.length > 1 ? " tabs" : " tab"
      }`;
      group_container.className = "group_container";
      group_container.id = `group${groupid}`;
      let group_name = document.createElement("div");
      let audible_group = document.createElement("img");
      let audible_group_count = document.createElement("p");
      audible_group_count.innerText = 0;
      audible_group.src = "./assets/audible.png";
      audible_group.className = "audible";
      audible_group.id = `audible${groupid}`;
      audible_group.style.display = "none";
      audible_group_count.classname = "audible_group_count";
      audible_group_count.style.display = "none";
      group_name.className = "groupname";
      group_name.appendChild(circle);
      group_name.appendChild(group_heading);
      group_name.appendChild(audible_group_count);
      group_name.appendChild(audible_group);
      group_name.appendChild(tab_count);
      group_name.addEventListener("click", () => {
        let listcont = document.getElementById(groupid);
        listcont.style.display =
          listcont.style.display === "none" ? "block" : "none";
        groupDisplayProp[groupid] = listcont.style.display;
        //groupDisplay[groupid];
      });
      let group_body = document.createElement("div");
      let group_remove_button = document.createElement("img");
      group_remove_button.src = "./assets/closeicon.png";
      group_remove_button.title = "Remove this group";
      group_remove_button.className = "group_remove_button";
      group_remove_button.addEventListener("click", () => {
        removeGroup(groups[groupid].tabs, groups[groupid].name);
      });
      let group_open_button = document.createElement("img");
      group_open_button.src = "./assets/activateicon.png";
      group_open_button.title = "Goto this group";
      group_open_button.className = "group_open_button";
      group_open_button.addEventListener("click", () => {
        console.log(groups[groupid].tabs[0]);
        activateWindow(groups[groupid].tabs[0].windowId);
        activateTab(groups[groupid].tabs[0].id);
      });

      let ungroup_button = document.createElement("img");
      ungroup_button.src = "./assets/ungroupicon.png";
      ungroup_button.title = "Ungroup all tabs from this group";
      ungroup_button.className = "ungroup_button";
      ungroup_button.addEventListener("click", () => {
        unGroup(groups[groupid].tabs, groups[groupid].name);
      });
      let add_new_tab_button = document.createElement("img");
      add_new_tab_button.src = "./assets/add.png";
      add_new_tab_button.title = "Add a new tab";
      add_new_tab_button.className = "window_button add_button";
      add_new_tab_button.addEventListener("click", () => {
        addNewTabToGroup(groupid, key);
      });
      group_body.appendChild(group_name);
      group_body.appendChild(add_new_tab_button);
      group_body.appendChild(ungroup_button);
      group_body.appendChild(group_open_button);
      group_body.appendChild(group_remove_button);
      group_body.className = "group_body";
      group_container.appendChild(group_body);
      group_body.draggable = true;
      group_body.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("tabs", JSON.stringify(groups[groupid].tabs));
        e.dataTransfer.setData("groupid", groupid); //groups[groupid].tabs);
        e.dataTransfer.setData("groupDrop", true);
      });
      group_container.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        let tab_id = e.dataTransfer.getData("tabid");
        let from_group = e.dataTransfer.getData("groupid");
        if (!e.dataTransfer.getData("groupDrop")) {
          if (parseInt(from_group) !== parseInt(groupid)) {
            console.log("group requested");
            moveTabToGroup(tab_id, groupid);
          }
        } else if (
          parseInt(from_group) !== parseInt(groupid) &&
          e.dataTransfer.getData("groupDrop")
        ) {
          mergeGroups(JSON.parse(e.dataTransfer.getData("tabs")), groupid);
        }
      });
      group_container.addEventListener(
        "dragover",
        handlePreventDefaultForDragOver
      );
      let list_container = document.createElement("div");
      list_container.className = "list_container";
      list_container.id = groupid;
      list_container.style.display = groupDisplayProp[groupid]
        ? groupDisplayProp[groupid]
        : "none";
      for (let tab of groups[groupid].tabs) {
        let tab_list_item = document.createElement("div");
        tab_list_item.draggable = true;
        tab_list_item.addEventListener("dragstart", (e) => {
          console.log(tab);
          e.dataTransfer.setData("tabid", tab.id);
          e.dataTransfer.setData("groupid", tab.groupId);
          e.dataTransfer.setData("windowid", tab.windowId);
        });
        tab_list_item.className = `tab_list_item`;
        tab_list_item.id = tab.id;
        if (tab.active) {
          tab_list_item.className += " active_tab";
          group_container.className += " active_group";
        }
        let imageTag = document.createElement("img");
        let tabName = document.createElement("h3");
        tabName.innerText = tab.title;
        let tabDes = document.createElement("p");
        tabDes.title = tab.url;
        tabName.title = tab.title;
        tabDes.innerText = tab.url;
        imageTag.src =
          tab.favIconUrl &&
          tab.favIconUrl !== "" &&
          tab.favIconUrl.startsWith("http")
            ? tab.favIconUrl
            : "./assets/placeholder.png";
        imageTag.className = "tabfavicon";
        let tab_name = document.createElement("div");
        tab_name.appendChild(tabName);
        tab_name.appendChild(tabDes);
        tab_name.addEventListener("click", () => {
          activateWindow(tab.windowId);
          activateTab(tab.id);
        });
        let tab_remove_button = document.createElement("img");
        tab_remove_button.src = "./assets/closeicon.png";
        tab_remove_button.title = "Remove this tab";
        tab_remove_button.className = "tab_remove_button";
        tab_remove_button.addEventListener("click", () => {
          removeTab(tab.id);
        });
        tab_name.className = "tab_name";
        let audible;
        audible = document.createElement("div");
        if (tab.audible) {
          audible_group.style.display = "block";
          audible_group_count.style.display = "block";
          audible_group_count.innerText =
            parseInt(audible_group_count.innerText) + 1;
          audible = document.createElement("img");
          if (tab.mutedInfo.muted) audible.src = "./assets/notaudible.png";
          else audible.src = "./assets/audible.png";
          audible.addEventListener("click", () => {
            console.log(tab.groupId);
            toggleAudio(tab.id, tab.mutedInfo.muted);
          });
        }
        audible.className = "audible";
        list_container.appendChild(tab_list_item);
        tab_list_item.appendChild(imageTag);
        tab_list_item.appendChild(tab_name);
        tab_list_item.appendChild(audible);
        tab_list_item.appendChild(tab_remove_button);
      }
      group_container.appendChild(list_container);
      window_container.appendChild(group_container);
    }
    arrayOfChildren.push(window_container);
  }
  main_container.replaceChildren(...arrayOfChildren);
  //ungrouped after grouping
  for (let tab of groups[-1].tabs) {
    // console.log(tab);
    let window_container = document.getElementById(tab.windowId);
    if (!window_container) {
      window_container = document.createElement("fieldset");
      if (parseInt(current[0]?.windowId) === parseInt(tab.windowId))
        window_container.classList.add("active_window");
      window_container.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        let tab_id = e.dataTransfer.getData("tabid");
        let from_window = e.dataTransfer.getData("windowid");
        if (
          !e.dataTransfer.getData("groupDrop") &&
          (parseInt(from_window) !== parseInt(tab.windowId) ||
            parseInt(e.dataTransfer.getData("groupid")) !== -1)
        ) {
          console.log("window requested");
          moveTabToWindow(tab_id, parseInt(tab.windowId));
        } else if (e.dataTransfer.getData("groupDrop")) {
          let groupid = e.dataTransfer.getData("groupid");
          moveGroupToWindow(groupid, tab.windowId);
        }
      });
      window_container.addEventListener(
        "dragover",
        handlePreventDefaultForDragOver
      );
      let window_header = document.createElement("div");
      window_header.className = "window_header";
      let ledg = document.createElement("legend");

      let close_button = document.createElement("img");
      close_button.src = "./assets/closeicon.png";
      close_button.title = "Close this window";
      close_button.className = "window_button";
      close_button.addEventListener("click", () => {
        removeWindow(tab.windowId);
      });

      let activate_button = document.createElement("img");
      activate_button.src = "./assets/activateicon.png";
      activate_button.title = "Goto this window";
      activate_button.className = "window_button";
      activate_button.addEventListener("click", () => {
        activateWindow(tab.windowId);
      });
      let add_group_button = document.createElement("img");
      add_group_button.src = "./assets/addgroupicon.png";
      add_group_button.title = "Create a new group";
      add_group_button.className = "window_button add_button";
      add_group_button.addEventListener("click", () => {
        addNewGroup(tab.windowId);
      });
      let add_tab_button = document.createElement("img");
      add_tab_button.src = "./assets/add.png";
      add_tab_button.title = "Add a new tab";
      add_tab_button.className = "window_button add_button";
      add_tab_button.addEventListener("click", () => {
        addNewTabToWindow(tab.windowId);
      });
      let window_button_holder = document.createElement("div");
      window_button_holder.className = "window_button_holder";
      ledg.innerText = `Window No. ${winCount++}`;
      window_header.appendChild(ledg);
      window_button_holder.appendChild(add_tab_button);
      window_button_holder.appendChild(add_group_button);
      window_button_holder.appendChild(activate_button);
      window_button_holder.appendChild(close_button);
      window_header.appendChild(window_button_holder);
      window_container.classList.add("window_container_nogroup");
      window_container.id = tab.windowId;
      window_container.appendChild(window_header);
      main_container.appendChild(window_container);
    }
    let tab_list_item = document.createElement("div");
    tab_list_item.draggable = true;
    tab_list_item.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("tabid", tab.id);
      e.dataTransfer.setData("groupid", tab.groupId);
      e.dataTransfer.setData("windowid", tab.windowId);
    });
    tab_list_item.className = "tab_list_item nogroup";
    tab_list_item.id = tab.id;
    if (tab.active) {
      tab_list_item.className += " active_tab";
    }
    let imageTag = document.createElement("img");
    let tabName = document.createElement("h3");
    tabName.innerText = tab.title;
    let tabDes = document.createElement("p");
    tabDes.title = tab.url;
    tabName.title = tab.title;
    tabDes.innerText = tab.url;
    imageTag.src =
      tab.favIconUrl &&
      tab.favIconUrl !== "" &&
      tab.favIconUrl.startsWith("http")
        ? tab.favIconUrl
        : "./assets/placeholder.png";
    imageTag.className = "tabfavicon";
    tab_list_item.appendChild(imageTag);
    let tab_name = document.createElement("div");
    tab_name.appendChild(tabName);
    tab_name.appendChild(tabDes);
    tab_name.className = "tab_name";
    tab_name.addEventListener("click", () => {
      activateWindow(tab.windowId);
      activateTab(tab.id);
    });
    let tab_remove_button = document.createElement("img");
    tab_remove_button.src = "./assets/closeicon.png";
    tab_remove_button.title = "Remove this tab";
    tab_remove_button.className = "tab_remove_button";
    tab_remove_button.addEventListener("click", () => {
      removeTab(tab.id);
    });

    let audible;
    audible = document.createElement("div");
    if (tab.audible) {
      audible = document.createElement("img");
      if (tab.mutedInfo.muted) audible.src = "./assets/notaudible.png";
      else audible.src = "./assets/audible.png";
      audible.addEventListener("click", () => {
        console.log(tab.groupId);
        toggleAudio(tab.id, tab.mutedInfo.muted);
      });
    }
    audible.className = "audible";

    tab_list_item.appendChild(tab_name);
    tab_list_item.appendChild(audible);
    tab_list_item.appendChild(tab_remove_button);
    window_container.appendChild(tab_list_item);
  }
  dashboard.innerText = `There are ${length} tabs divided into ${
    Object.keys(groups).length - 1
  } groups, across ${winCount - 1} windows.`;
}
function makeNewGroups() {
  showMessage("The screen may flash a little. Please dont panic.");
  setTimeout(() => {
    if (chrome.runtime.lastError) return false;
    chrome.runtime.sendMessage({ type: "makeGroups" });
  }, 1000);
}
function refreshData() {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "getData" }, (resp) => {
    buildUi(resp);
  });
}
function unGroupAll() {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "ungroupAll" });
}
function mergeSameGroup() {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "groupSameName" });
}
function activateTab(tabId) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "activateTab", payload: tabId });
}
function activateWindow(windowId) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "activateWindow", payload: windowId });
}
function removeGroup(tabs, name) {
  //   console.log(tabs);
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage(
    { type: "removeGroup", payload: tabs.map((tab) => tab.id) },
    () => {
      showMessage(`${name} removed`);
    }
  );
}
function removeTab(tabId) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "removeTab", payload: tabId });
}
function removeWindow(windowId) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "removeWindow", payload: windowId });
}
function moveTabToGroup(tabid, groupid) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "moveTabToGroup", tabid, groupid });
}
function moveTabToWindow(tabid, windowid) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "moveTabToWindow", tabid, windowid });
}
function moveGroupToWindow(groupid, windowid) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "moveGroupToWindow", groupid, windowid });
}
function moveTabToNewWindow(tabid) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "moveTabToNewWindow", tabid }, (resp) => {
    //
  });
}
function moveGroupToNewWindow(groupid) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "moveGroupToNewWindow", groupid });
}
function toggleAudio(tabid, state) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "toggleAudio", tabid, state });
}
function mergeGroups(tabs, groupid) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "mergeGroups", tabs, groupid });
}
function removeDuplicateTabs() {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({ type: "removeDuplicateTabs" });
}
function showMessage(resp) {
  document.getElementById("output").innerText = resp;
  setTimeout(() => {
    document.getElementById("output").innerText = "";
  }, 2000);
}
function searchTabs() {
  let input = document.getElementById("search_input");
  console.log(input.value);

  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage(
    { type: "searchTabs", value: input.value },
    (resp) => {
      if (chrome.runtime.lastError) return false;
      let respList = Object.keys(resp);
      let length = 0;

      let ele = document.getElementsByClassName("group_container");
      for (let i = 0; i < ele.length; i++) {
        ele[i].style.display = "none";
      }
      ele = document.getElementsByClassName("window_container");
      for (let i = 0; i < ele.length; i++) {
        ele[i].style.display = "none";
      }
      ele = document.getElementsByClassName("window_container_nogroup");
      for (let i = 0; i < ele.length; i++) {
        ele[i].style.display = "none";
      }
      console.log(resp);
      for (let tabid of respList) {
        // console.log(tabid);
        let tablistitem = document.getElementById(tabid);
        let group = document.getElementById(`group${resp[tabid].groupId}`);
        let list = document.getElementById(resp[tabid].groupId);
        let window = document.getElementById(resp[tabid].windowId);
        if (tablistitem) {
          if (!resp[tabid].value) {
            tablistitem.style.display = "none";
          } else {
            length++;
            tablistitem.style.display = "flex";
            if (list) list.style.display = "block";
            if (group) group.style.display = "flex";
            window.style.display = "";
          }
        }
      }
      showMessage(`${length} result${length > 1 ? "s" : ""} found.`);
    }
  );
}
function reloadAll() {
  location.reload();
}
function addNewGroup(windowid) {
  try {
    if (chrome.runtime.lastError) return false;
    chrome.runtime.sendMessage(
      {
        type: "addNewGroup",
        windowId: windowid,
        groupName: "New Group",
      },
      (resp) => {
        if (chrome.runtime.lastError) return false;
        showMessage(resp);
      }
    );
  } catch (e) {
    console.log(e);
  }
}
function changeGroupName(groupId, title) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage({
    type: "changeGroupName",
    groupId,
    title,
  });
}
function unGroup(tabs, group) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage(
    {
      type: "unGroup",
      tabs: tabs.map((tab) => tab.id),
    },
    () => {
      if (chrome.runtime.lastError) return false;
      showMessage(
        `Freed ${tabs.length} tab${tabs.length > 1 ? "s" : ""} from ${group}`
      );
    }
  );
}
function addNewTabToWindow(windowid) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage(
    {
      type: "addNewTabToWindow",
      windowId: windowid,
    },
    () => {
      if (chrome.runtime.lastError) return false;
      showMessage(
        `Freed ${tabs.length} tab${tabs.length > 1 ? "s" : ""} from ${group}`
      );
    }
  );
}
function addNewTabToGroup(groupid, windowid) {
  if (chrome.runtime.lastError) return false;
  chrome.runtime.sendMessage(
    {
      type: "addNewTabToGroup",
      groupId: groupid,
      windowId: windowid,
    },
    () => {
      if (chrome.runtime.lastError) return false;
      showMessage(
        `Freed ${tabs.length} tab${tabs.length > 1 ? "s" : ""} from ${group}`
      );
    }
  );
}
chrome.runtime.onMessage.addListener((req, sender, sendResp) => {
  switch (req.type) {
    case "refreshData":
      try {
        console.log("data loading");
        refreshData();
        sendResp("refreshed");
      } catch (e) {
        console.log(e);
      }
      break;
    default:
      break;
  }
});
