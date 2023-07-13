chrome.runtime.onMessage.addListener((req, sender, sendResp) => {
  console.log(req);
  if (chrome.runtime.lastError) return false;
  switch (req.type) {
    case "makeGroups":
      createNewGroups();
      requestRefresh();
      sendResp("Grouping finished.");
      break;
    case "getData":
      sendData().then((tabs) => {
        sendResp(tabs);
      });
      break;
    case "ungroupAll":
      unGroupAll();
      sendResp("Ungrouped");
      break;
    case "groupSameName":
      mergeGroupsWithSameName();
      requestRefresh();
      break;
    case "activateWindow":
      activateWindow(req);
      sendResp("done");
      break;
    case "removeWindow":
      removeWindow(req);
      sendResp("removed window");
      break;
    case "removeTab":
      removeTab(req);
      sendResp("removed tab");
      break;
    case "removeGroup":
      removeGroup(req);
      sendResp("removed group");
      break;
    case "removeNewTabs":
      removeHostName("newtab");
      sendResp("removed all new tabs");
      break;
    case "activateTab":
      activateTab(req);
      sendResp("activate tab");
      break;
    case "moveTabToGroup":
      moveTabToGroup(req);
      break;
    case "moveTabToWindow":
      moveTabToWindow(req);
      break;
    case "moveGroupToWindow":
      moveGroupToWindow(req);
      break;
    case "moveTabToNewWindow":
      moveTabToNewWindow(req);
      break;
    case "moveGroupToNewWindow":
      moveGroupToNewWindow(req);
      break;
    case "mergeGroups":
      mergeGroups(req);
      break;
    case "addNewGroup":
      addNewGroup(req);
      requestRefresh();
      sendResp("New Unamed group created");
      break;
    case "searchTabs":
      searchData(req, sendResp);
      break;
    case "changeGroupName":
      changeGroupName(req);
      sendResp("Name Changed");
      break;
    case "removeDuplicateTabs":
      removeDuplicateTabs(sendResp);
      break;
    case "unGroup":
      unGroup(req);
      sendResp("Ungrouped");
      break;
    case "addNewTabToWindow":
      addNewTabToWindow(req);
      break;
    case "toggleAudio":
      toggleAudio(req);
      break;
    case "addNewTabToGroup":
      addNewTabToGroup(req);
      break;
    default:
      break;
  }
  return true;
});

function activateWindow(req) {
  try {
    chrome.windows.update(parseInt(req.payload), {
      focused: true,
      state: "maximized",
    });
  } catch (e) {
    console.log(e);
  }
}

function removeWindow(req) {
  console.log("removing window");
  try {
    chrome.windows.remove(parseInt(req.payload), () => {});
  } catch (e) {
    console.log(e);
  }
}

function removeTab(req) {
  console.log("removing tab");
  try {
    chrome.tabs.remove(parseInt(req.payload), () => {});
  } catch {
    console.log(e);
  }
}

function removeGroup(req) {
  try {
    console.log("removing group", req);
    chrome.tabs.remove(req.payload, () => {});
  } catch (e) {
    console.log(e);
  }
}

function activateTab(req) {
  try {
    console.log("tab opening", req.payload);
    chrome.tabs.update(parseInt(req.payload), { active: true }, () => {});
  } catch (e) {
    console.log(e);
  }
}

function moveTabToGroup(req) {
  chrome.tabs.group(
    {
      tabIds: parseInt(req.tabid),
      groupId: parseInt(req.groupid),
    },
    () => {
      requestRefresh();
    }
  );
}

function moveTabToWindow(req) {
  try {
    chrome.tabs.ungroup(parseInt(req.tabid));
    chrome.tabs.move(
      parseInt(req.tabid),
      {
        index: -1,
        windowId: parseInt(req.windowid),
      },
      () => {
        requestRefresh();
      }
    );
  } catch (e) {
    console.log(e);
  }
}

function moveGroupToWindow(req) {
  try {
    chrome.tabGroups.move(
      parseInt(req.groupid),
      {
        index: -1,
        windowId: parseInt(req.windowid),
      },
      () => {
        requestRefresh();
      }
    );
  } catch (e) {
    console.log(e);
  }
}

function moveTabToNewWindow(req) {
  try {
    chrome.tabs.ungroup(parseInt(req.tabid), () => {
      chrome.windows.create(
        {
          state: "minimized",
          tabId: parseInt(req.tabid),
        },
        () => {
          requestRefresh();
        }
      );
    });
  } catch (e) {
    console.log(e);
  }
}

function moveGroupToNewWindow(req) {
  try {
    chrome.windows.create({ state: "minimized" }, (window) => {
      console.log(req, window);
      chrome.tabGroups.move(
        parseInt(req.groupid),
        {
          index: -1,
          windowId: window.id,
        },
        () => {
          chrome.tabs.query(
            { title: "New Tab", windowId: window.id },
            (tabs) => {
              console.log(tabs);
              chrome.tabs.remove(
                tabs.map((tab) => tab.id),
                () => {
                  requestRefresh();
                }
              );
            }
          );
        }
      );
    });
  } catch (e) {
    console.log(e);
  }
}

function addNewTabToGroup(req) {
  try {
    chrome.tabs.create(
      { active: false, windowId: parseInt(req.windowId) },
      (tab) => {
        chrome.tabs.group(
          {
            tabIds: tab.id,
            groupId: parseInt(req.groupId),
          },
          () => {
            requestRefresh();
          }
        );
      }
    );
  } catch (e) {}
}

function toggleAudio(req) {
  try {
    chrome.tabs.update(parseInt(req.tabid), { muted: !req.state }, () =>
      requestRefresh()
    );
  } catch (e) {}
}

function addNewTabToWindow(req) {
  try {
    chrome.tabs.create(
      { active: false, windowId: parseInt(req.windowId) },
      () => requestRefresh()
    );
  } catch (e) {}
}

function unGroup(req) {
  try {
    chrome.tabs.ungroup(req.tabs);
  } catch (e) {
    console.log(e);
  }
}

function changeGroupName(req) {
  try {
    chrome.tabs.query({ groupId: parseInt(req.groupId) }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabGroups.update(parseInt(req.groupId), {
          title: req.title,
        });
      }
    });
  } catch (e) {
    console.log(e);
  }
}

function searchData(req, sendResp) {
  let resp = {};
  try {
    chrome.tabs.query({}, (tabs) => {
      for (let tab of tabs) {
        resp[tab.id] = {
          value:
            tab.title.toLowerCase().includes(req.value.toLowerCase()) ||
            tab.url.toLowerCase().includes(req.value.toLowerCase()),
          groupId: tab.groupId,
          windowId: tab.windowId,
        };
      }
      sendResp(resp);
    });
  } catch (e) {
    console.log(e);
  }
}

function addNewGroup(req) {
  try {
    chrome.tabs.create(
      { active: false, windowId: parseInt(req.windowId) },
      (tab) => {
        chrome.tabs.group({ tabIds: tab.id }, (group) => {
          chrome.tabGroups.update(group, { title: req.groupName }, () => {
            chrome.tabGroups.move(
              group,
              {
                index: -1,
                windowId: parseInt(req.windowId),
              },
              requestRefresh
            );
          });
        });
      }
    );
  } catch (e) {
    console.log(e);
  }
}

function mergeGroups(req) {
  try {
    chrome.tabs.ungroup(req.tabs.map((tab) => tab.id));
    chrome.tabs.group(
      {
        tabIds: req.tabs.map((tab) => tab.id),
        groupId: parseInt(req.groupid),
      },
      () => {
        requestRefresh();
      }
    );
  } catch (e) {
    console.log(e);
  }
}

async function createNewGroups() {
  try {
    const tabs = await chrome.tabs.query({});
    const tabsWithoutGroups = tabs.filter((tab) => tab.groupId < 0);
    const groupedTabs = {};

    tabsWithoutGroups.forEach((tab) => {
      const parsedUrl = new URL(tab.url);
      if (groupedTabs[parsedUrl.hostname])
        groupedTabs[parsedUrl.hostname].push(tab.id);
      else groupedTabs[parsedUrl.hostname] = [tab.id];
    });
    let otherGroups = [];
    for (const key of Object.keys(groupedTabs)) {
      if (groupedTabs[key].length > 1) {
        const groupId = await chrome.tabs.group({
          tabIds: groupedTabs[key],
        });

        groupedTabs[key] = { tabs: groupedTabs[key], id: groupId };
        try {
          await chrome.tabGroups.update(groupId, {
            title: `${key}`,
            collapsed: true,
          }); //(${groupedTabs[key].tabs.length})
        } catch (e) {
          console.log(e);
        }
      } else {
        otherGroups = [...otherGroups, ...groupedTabs[key]];
      }
    }
    let groupId = await chrome.tabs.group({
      tabIds: otherGroups,
    });
    try {
      await chrome.tabGroups.update(groupId, {
        title: `Others`,
        collapsed: true,
      }); //(${groupedTabs[key].tabs.length})
    } catch (e) {
      console.log(e);
    }
    if (groupedTabs["newtab"]) {
      await chrome.tabs.remove(groupedTabs["newtab"].tabs);
      delete groupedTabs["newtab"];
    }

    let tabsPerWindow = 0;
    let groupsPerWindow = [];
    for (const key of Object.keys(groupedTabs)) {
      tabsPerWindow += groupedTabs[key].tabs.length;
      if (tabsPerWindow > 15) {
        const tabsToSeparate = [...groupsPerWindow];
        groupsPerWindow = [];
        tabsPerWindow = groupedTabs[key].tabs.length;
        const newWindow = await chrome.windows.create();
        await chrome.windows.update(newWindow.id, { state: "minimized" });
        for (const groupIdToSeparate of tabsToSeparate) {
          await chrome.tabGroups.move(groupIdToSeparate, {
            index: -1,
            windowId: newWindow.id,
          });
        }
      }
      groupsPerWindow = [...groupsPerWindow, groupedTabs[key].id];
    }

    await removeHostName("newtab");
  } catch (e) {
    console.log(e);
  }
}

async function removeHostName(hostname) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      console.log(tab.url);
      if (tab.url !== "") {
        const parsedUrl = new URL(tab.url);
        if (parsedUrl.hostname === hostname) await chrome.tabs.remove(tab.id);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

async function unGroupAll() {
  try {
    const tabs = await chrome.tabs.query({});
    chrome.tabs.ungroup(
      tabs.map((tab) => tab.id),
      () => {
        requestRefresh();
      }
    );
  } catch (e) {
    console.log(e);
  }
}
function sendData() {
  return new Promise(async (resolve) => {
    let current = await chrome.tabs.query({
      currentWindow: true,
      active: true,
    });
    const tabs = await chrome.tabs.query({});
    const window = { nogroup: [] };
    const groups = { "-1": { tabs: [], name: "ungrouped", color: "#000000" } };
    for (const tab of tabs) {
      if (tab.groupId >= 0) {
        if (!window[tab.windowId]) window[tab.windowId] = [tab.groupId];
        else if (!window[tab.windowId].includes(tab.groupId))
          window[tab.windowId].push(tab.groupId);
        if (!groups[tab.groupId]) {
          let group = await chrome.tabGroups.get(tab.groupId);
          groups[tab.groupId] = {
            tabs: [tab],
            name: group.title === "" ? "un-named" : group.title,
            color: group.color,
          };
        } else groups[tab.groupId].tabs.push(tab);
      } else groups["-1"].tabs.push(tab);
    }
    console.log(current);
    resolve({ groups, window, current });
  });
}
async function mergeGroupsWithSameName() {
  try {
    const tabs = await chrome.tabs.query({});
    const groups = { nogroup: { tabs: [], id: -1 } };
    for (const tab of tabs) {
      if (tab.groupId >= 0) {
        let group = await chrome.tabGroups.get(tab.groupId);
        // console.log(groups[group.title], group.title);
        if (!groups[group.title]) {
          groups[group.title] = {
            tabs: [tab],
            id: group.id,
          };
        } else groups[group.title].tabs.push(tab);
      } else groups["nogroup"].tabs.push(tab);
    }
    for (let key of Object.keys(groups)) {
      if (key === "nogroup") continue;
      let tabs_to_move = [];
      for (let tab of groups[key].tabs) {
        if (tab.groupId !== groups[key].id) tabs_to_move.push(tab.id);
      }
      console.log("Tabs: ", tabs_to_move);
      if (tabs_to_move.length > 0)
        await chrome.tabs.group({
          tabIds: tabs_to_move,
          groupId: groups[key].id,
        });
    }
  } catch (e) {
    console.log(e);
  }
}

chrome.tabs.onRemoved.addListener(requestRefresh);
chrome.windows.onRemoved.addListener(requestRefresh);
chrome.tabGroups.onRemoved.addListener(requestRefresh);

function requestRefresh() {
  try {
    if (chrome.runtime.lastError) return false;
    chrome.runtime.sendMessage({ type: "refreshData" }, (resp) => {
      if (chrome.runtime.lastError) {
        console.log("Error occured reloading", chrome.runtime.lastError);
        return false;
      }
      console.log(resp);
    });
    console.log("refresh requested");
  } catch (e) {
    console.log(e);
  }
}

async function removeDuplicateTabs(sendResp) {
  let tabs = await chrome.tabs.query({});
  let deleteList = [];
  let exists = {};
  for (let tab of tabs) {
    if (exists[tab.url]) deleteList.push(tab.id);
    exists[tab.url] = true;
  }
  await chrome.tabs.remove(deleteList, () => {
    sendResp(
      `${deleteList.length} ${deleteList.length > 1 ? "tabs" : "tab"} removed`
    );
    requestRefresh();
  });
}
