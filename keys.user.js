// ==UserScript==
// @id             iitc-plugin-keys@xelio
// @name           IITC plugin: Keys
// @category       Keys
// @version        0.3.0.20161003.4740
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      https://static.iitc.me/build/release/plugins/keys.meta.js
// @downloadURL    https://static.iitc.me/build/release/plugins/keys.user.js
// @description    [iitc-2016-10-03-004740] Allow manual entry of key counts for each portal. Use the 'keys-on-map' plugin to show the numbers on the map, and 'sync' to share between multiple browsers or desktop/mobile.
// @include        https://*.ingress.com/intel*
// @include        http://*.ingress.com/intel*
// @match          https://*.ingress.com/intel*
// @match          http://*.ingress.com/intel*
// @include        https://*.ingress.com/mission/*
// @include        http://*.ingress.com/mission/*
// @match          https://*.ingress.com/mission/*
// @match          http://*.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'iitc';
plugin_info.dateTimeVersion = '20161003.4740';
plugin_info.pluginId = 'keys';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////

// use own namespace for plugin
window.plugin.keys = function() {};

// delay in ms
window.plugin.keys.SYNC_DELAY = 5000;

window.plugin.keys.LOCAL_STORAGE_KEY = 'plugin-keys-data';

window.plugin.keys.KEY = {key: 'plugin-keys-data', field: 'keys'};
window.plugin.keys.UPDATE_QUEUE = {key: 'plugin-keys-data-queue', field: 'updateQueue'};
window.plugin.keys.UPDATING_QUEUE = {key: 'plugin-keys-data-updating-queue', field: 'updatingQueue'};

window.plugin.keys.CapsuleID=0
window.plugin.keys.keys = [];
window.plugin.keys.updateQueue = [];
window.plugin.keys.updatingQueue = [];

window.plugin.keys.NCapsules=11;
for (i = 0; i < plugin.keys.NCapsules; i++) {
  window.plugin.keys.keys[i] = {"TOTAL":0};
  window.plugin.keys.updateQueue[i] = {"TOTAL":0};
  window.plugin.keys.updatingQueue[i] = {"TOTAL":0};
}

window.plugin.keys.enableSync = false;

window.plugin.keys.disabledMessage = null;
window.plugin.keys.contentHTML = null;

window.plugin.keys.addToSidebar = function() {
  if(typeof(Storage) === "undefined") {
    $('#portaldetails > .imgpreview').after(plugin.keys.disabledMessage);
    return;
  }

  $('#portaldetails > .imgpreview').after(plugin.keys.contentHTML);
  plugin.keys.updateDisplayCount();
}

window.plugin.keys.updateDisplayCount = function() {
  var guid = window.selectedPortal;
  var count = plugin.keys.keys[plugin.keys.CapsuleID][guid] || 0;
  $('#keys-count').html(count);
  switch (plugin.keys.CapsuleID) {
    case 0:
        $('#Capsule-count').html("All");
        break;
    case 1:
        $('#Capsule-count').html("G");
        break;
    case 2:
        $('#Capsule-count').html("B");
        break;
    case 3:
        $('#Capsule-count').html("W");
        break;
    case 4:
        $('#Capsule-count').html("R");
        break;
    case 5:
        $('#Capsule-count').html("Y");
        break;
    default:
        $('#Capsule-count').html(plugin.keys.CapsuleID);
        break;
  }
  $('#Total-count').html(plugin.keys.keys[plugin.keys.CapsuleID]['TOTAL'] ||0 );
}

window.plugin.keys.changeCapsuleID = function(addCount) {
  plugin.keys.CapsuleID=Math.min(Math.max(plugin.keys.CapsuleID + addCount, 0),plugin.keys.NCapsules-1);
  plugin.keys.updateDisplayCount();
  window.runHooks('pluginKeysRefreshAll');
}

window.plugin.keys.addKey = function(addCount, guid) {
  if (plugin.keys.CapsuleID==0) return;
  if(guid == undefined) guid = window.selectedPortal;

  // if (plugin.keys.keys[plugin.keys.CapsuleID]==undefined)
  //   var oldCount = 0;
  // else
  //   var oldCount = (plugin.keys.keys[plugin.keys.CapsuleID][guid]|| 0);

  var oldCount = (plugin.keys.keys[plugin.keys.CapsuleID][guid]|| 0);
  var newCount = Math.max(oldCount + addCount, 0);

  if(oldCount !== newCount) {
    if(newCount === 0) {
      delete plugin.keys.keys[plugin.keys.CapsuleID][guid];
      plugin.keys.updateQueue[plugin.keys.CapsuleID][guid] = null;
    } else {
      // if (plugin.keys.keys[plugin.keys.CapsuleID]==undefined) plugin.keys.keys[plugin.keys.CapsuleID] = {};
      // if (plugin.keys.updateQueue[plugin.keys.CapsuleID]==undefined) plugin.keys.updateQueue[plugin.keys.CapsuleID] = {};
      // if (plugin.keys.Total[plugin.keys.CapsuleID]==undefined) plugin.keys.Total[plugin.keys.CapsuleID] = 0;
      plugin.keys.keys[plugin.keys.CapsuleID][guid] = newCount
      plugin.keys.updateQueue[plugin.keys.CapsuleID][guid] = newCount;
    }
    plugin.keys.keys[0][guid] = (plugin.keys.keys[0][guid] || 0) +newCount-oldCount;
    plugin.keys.updateQueue[0][guid] = plugin.keys.keys[0][guid];

    if (plugin.keys.keys[0][guid]==0){
      delete plugin.keys.keys[0][guid];
      plugin.keys.updateQueue[0][guid] = null;
    }
    plugin.keys.keys[plugin.keys.CapsuleID]['TOTAL']=plugin.keys.keys[plugin.keys.CapsuleID]['TOTAL']+newCount-oldCount;
    plugin.keys.keys[0]['TOTAL']=plugin.keys.keys[0]['TOTAL']+newCount-oldCount;

    plugin.keys.updateQueue[plugin.keys.CapsuleID]['TOTAL']=plugin.keys.updateQueue[plugin.keys.CapsuleID]['TOTAL']+newCount-oldCount;
    plugin.keys.updateQueue[0]['TOTAL']=plugin.keys.updateQueue[0]['TOTAL']+newCount-oldCount;

    // if ((plugin.keys.CapsuleID==plugin.keys.keys.length-1)&&(plugin.keys.Total[plugin.keys.CapsuleID]==0)) {
    //   // console.log("Passed by here");
    //   plugin.keys.keys.splice(plugin.keys.CapsuleID,1);
    //   plugin.keys.Total.splice(plugin.keys.CapsuleID,1);
    //   for (Index=1; Index<plugin.keys.CapsuleID;Index++){
    //     if (plugin.keys.Total[plugin.keys.CapsuleID-Index]!=0)
    //       break;
    //     plugin.keys.keys.splice(plugin.keys.CapsuleID-Index,1);
    //     plugin.keys.Total.splice(plugin.keys.CapsuleID-Index,1);
    //   }
    //   plugin.keys.CapsuleID=plugin.keys.CapsuleID-Index;
    // }


    plugin.keys.storeLocal(plugin.keys.KEY);
    plugin.keys.storeLocal(plugin.keys.UPDATE_QUEUE);
    plugin.keys.updateDisplayCount();
    window.runHooks('pluginKeysUpdateKey', {guid: guid, count: newCount});
    plugin.keys.delaySync();
  }
}

// Delay the syncing to group a few updates in a single request
window.plugin.keys.delaySync = function() {
  if(!plugin.keys.enableSync) return;
  clearTimeout(plugin.keys.delaySync.timer);
  plugin.keys.delaySync.timer = setTimeout(function() {
      plugin.keys.delaySync.timer = null;
      window.plugin.keys.syncNow();
    }, plugin.keys.SYNC_DELAY);
}

// Store the updateQueue in updatingQueue and upload
window.plugin.keys.syncNow = function() {
  if(!plugin.keys.enableSync) return;
  $.extend(plugin.keys.updatingQueue, plugin.keys.updateQueue);
  window.plugin.keys.updateQueue = [];
  for (i = 0; i < plugin.keys.NCapsules; i++) {
    window.plugin.keys.updateQueue[i] = {"TOTAL":0};
  }
  plugin.keys.storeLocal(plugin.keys.UPDATING_QUEUE);
  plugin.keys.storeLocal(plugin.keys.UPDATE_QUEUE);

  // plugin.sync.updateMap('keys', 'keys', Object.keys(plugin.keys.updatingQueue));
  plugin.sync.updateMap('keys', 'keys', plugin.keys.updatingQueue);
}

// Call after IITC and all plugin loaded
window.plugin.keys.registerFieldForSyncing = function() {
  if(!window.plugin.sync) return;
  window.plugin.sync.registerMapForSync('keys', 'keys', window.plugin.keys.syncCallback, window.plugin.keys.syncInitialed);
}

// Call after local or remote change uploaded
window.plugin.keys.syncCallback = function(pluginName, fieldName, e, vv,fullUpdated) {
  console.warn("Keys: I am in syncCallback");
  if(fieldName === 'keys') {
    plugin.keys.storeLocal(plugin.keys.KEY);
    // All data is replaced if other client update the data during this client offline,
    // fire 'pluginKeysRefreshAll' to notify a full update
    if(fullUpdated) {
      plugin.keys.updateDisplayCount();
      window.runHooks('pluginKeysRefreshAll');
      return;
    }

    if(!e) return;
    if(e.isLocal) {
      console.warn("Keys: e.isLocal: True");
      // Update pushed successfully, remove it from updatingQueue
      delete plugin.keys.updatingQueue[vv][e.property];
    } else {
      console.warn("Keys: e.isLocal: False");
      // Remote update
      delete plugin.keys.updateQueue[vv][e.property];
      plugin.keys.storeLocal(plugin.keys.UPDATE_QUEUE);
      plugin.keys.updateDisplayCount();
      console.warn("Keys:pluginKeysUpdateKey guid="+JSON.stringify(e.property)+ ", count="+plugin.keys.keys[vv][e.property]);
      window.runHooks('pluginKeysUpdateKey', {guid: e.property, count: plugin.keys.keys[vv][e.property]});
    }
  }
}
// SyncCode
// syncing of the field is initialed, upload all queued update
window.plugin.keys.syncInitialed = function(pluginName, fieldName) {
  if(fieldName === 'keys') {
    plugin.keys.enableSync = true;
    if(Object.keys(plugin.keys.updateQueue[0]).length > 0) {
      console.warn("Keys: I just initiated sync");
      plugin.keys.delaySync();
    }
  }
}

window.plugin.keys.storeLocal = function(mapping) {
  if(typeof(plugin.keys[mapping.field]) !== 'undefined' && plugin.keys[mapping.field] !== null) {
    var len=plugin.keys[mapping.field].length
    localStorage[mapping.key] = JSON.stringify(plugin.keys[mapping.field].slice(1,len));
  } else {
    localStorage.removeItem(mapping.key);
  }
}

window.plugin.keys.loadLocal = function(mapping) {
  var objectJSON = localStorage[mapping.key];
  if (!objectJSON) return;
  plugin.keys[mapping.field] = mapping.convertFunc
                          ? mapping.convertFunc(JSON.parse(objectJSON))
                          : JSON.parse(objectJSON);

  if (plugin.keys[mapping.field].length==0) {
    plugin.keys[mapping.field][0]={"TOTAL":0};
  }else{
    plugin.keys[mapping.field].splice(0 , 0, {});
    plugin.keys[mapping.field][0]=Object.assign({}, plugin.keys[mapping.field][1]);
    for (i = 2; i < plugin.keys[mapping.field].length; i++) {
      plugin.keys[mapping.field][0] = window.plugin.keys.mergeKeys(plugin.keys[mapping.field][0] , plugin.keys[mapping.field][i]);
    }
  }
}

// For backward compatibility, will change to use loadLocal after a few version
// window.plugin.keys.loadKeys = function() {
//   var keysObjectJSON = localStorage[plugin.keys.KEY.key];
//   if(!keysObjectJSON) return;
//   var keysObject = JSON.parse(keysObjectJSON);
//   // Move keys data up one level, it was {keys: keys_data} in localstorage in previous version
//   plugin.keys.keys = keysObject.keys ? keysObject.keys : keysObject;
//   if(keysObject.keys) plugin.keys.storeLocal(plugin.keys.KEY);
// }

window.plugin.keys.setupCSS = function() {
  $("<style>")
    .prop("type", "text/css")
    .html("#keys-content-outer {\n  display: table;\n  width: 100%;\n  height: 26px;\n  text-align: center;\n}\n\n\
          #keys-content-outer > div{\n  display: inline-block;\n  vertical-align: middle;\n  margin: 6px 3px 1px 3px;\n}\n\n\
          \
          #Capsule-add {\n}\n\n\
          #Capsule-count {\n  width: 26px;\n  height: 18px !important;\n  border: 1px solid;\n  text-align: center;\n}\n\n\
          #Capsule-subtract {\n}\n\n\
          .Capsule-button {\n  position:relative;\n  width: 16px;\n  height: 16px !important;\n}\n\n\
          .Capsule-button > div {\n  background-color: rgb(32, 168, 177);\n  position: absolute;\n}\n\n\
          .Capsule-button-minus {\n  width: 100%;\n  height: 4px;\n  top: 6px;\n}\n\n\
          .Capsule-button-plus-h {\n  width: 100%;\n  height: 4px;\n  top: 6px;\n}\n\n\
          .Capsule-button-plus-v {\n  width: 4px;\n  height: 100%;\n  left: 6px;\n}\n\n\
          \
          #keys-add {\n}\n\n\
          #keys-count {\n  width: 26px;\n  height: 18px !important;\n  border: 1px solid;\n  text-align: center;\n}\n\n\
          #keys-subtract {\n}\n\n\
          .keys-button {\n  position:relative;\n  width: 16px;\n  height: 16px !important;\n}\n\n\
          .keys-button > div {\n  background-color: rgb(32, 168, 177);\n  position: absolute;\n}\n\n\
          .keys-button-minus {\n  width: 100%;\n  height: 4px;\n  top: 6px;\n}\n\n\
          .keys-button-plus-h {\n  width: 100%;\n  height: 4px;\n  top: 6px;\n}\n\n\
          .keys-button-plus-v {\n  width: 4px;\n  height: 100%;\n  left: 6px;\n}\n\n\
          #Total-count {\n  width: 26px;\n  height: 18px !important;\n  border: 1px solid;\n  text-align: center;\n}\n\n\
          \
          .portal-list-keys button {\n  font-family: monospace;\n  font-size: 0.9em;\n  text-align: center;\n  vertical-align: middle;\n  min-width: 0;\n  padding: 0;\n  width: 1.5em;\n  margin: -6px 0 -3px;\n}\n\
          #portalslist.mobile .portal-list-keys button {\n  width: 3em;\n  height: 1.5em;\n}\n\
          .portal-list-keys .plus {\n  margin-left: 0.3em;\n  margin-right: -1px;\n}\n\n"
         )
    .appendTo("head");
}

window.plugin.keys.setupContent = function() {
  plugin.keys.contentHTML = '<div id="keys-content-outer">'
                              + '<div id="Capsule-add" class="Capsule-button" onclick="window.plugin.keys.changeCapsuleID(-1);"> <div class="Capsule-button-minus"></div> </div>'
                              + '<div id="Capsule-count" title="Choose a Capsule"></div>'
                              + '<div id="Capsule-subtract" class="Capsule-button" onclick="window.plugin.keys.changeCapsuleID(1);"> <div class="Capsule-button-plus-v"></div> <div class="Capsule-button-plus-h"></div> </div>'
                              + '<div>  &nbsp&nbsp&nbsp </div>'
                              + '<div id="keys-add" class="keys-button" onclick="window.plugin.keys.addKey(-1);"> <div class="keys-button-minus"></div> </div>'
                              + '<div id="keys-count" title="Number of keys for this Portal in Capsule"></div>'
                              + '<div id="keys-subtract" class="keys-button" onclick="window.plugin.keys.addKey(1);"><div class="keys-button-plus-v"></div><div class="keys-button-plus-h"></div></div>'
                              + '<div>  &nbsp&nbsp&nbsp </div>'
                              + '<div id="Total-count" title="Total number of keys in Capsule"></div>'
                          + '</div>';
  plugin.keys.disabledMessage = '<div id="keys-content-outer" title="Your browser do not support localStorage">Plugin Keys disabled</div>';
}

window.plugin.keys.setupPortalsList = function() {
  if(!window.plugin.portalslist) return;

  window.addHook('pluginKeysUpdateKey', function(data) {
    $('[data-list-keycount="'+data.guid+'"]').text(data.count || 0);
  });

  window.addHook('pluginKeysRefreshAll', function() {
    $('[data-list-keycount]').each(function(i, element) {
      var guid = element.getAttribute("data-list-keycount");
      if (plugin.keys.CapsuleID==plugin.keys.keys.length)
        $(element).text(0);
      else $(element).text((plugin.keys.keys[plugin.keys.CapsuleID][guid] || 0));
    });
  });

  window.plugin.portalslist.fields.push({
    title: "Keys",
    value: function(portal) { return portal.options.guid; }, // we store the guid, but implement a custom comparator so the list does sort properly without closing and reopening the dialog
    sort: function(guidA, guidB) {
      if (plugin.keys.CapsuleID==plugin.keys.keys.length){
        var keysA = 0;
        var keysB = 0;
      }else{
        var keysA = plugin.keys.keys[plugin.keys.CapsuleID][guidA] || 0;
        var keysB = plugin.keys.keys[plugin.keys.CapsuleID][guidB] || 0;
      }
      return keysA - keysB;
    },
    format: function(cell, portal, guid) {
      $(cell)
        .addClass("alignR portal-list-keys ui-dialog-buttonset") // ui-dialog-buttonset for proper button styles
        .append($('<span>')
          .text(plugin.keys.keys[plugin.keys.CapsuleID][guid] || 0)
          .attr({
            "class": "value",
            "data-list-keycount": guid
          }));
      // for some reason, jQuery removes event listeners when the list is sorted. Therefore we use DOM's addEventListener
      $('<button>')
        .text('+')
        .addClass("plus")
        .appendTo(cell)
        [0].addEventListener("click", function() { window.plugin.keys.addKey(1, guid); }, false);
      $('<button>')
        .text('-')
        .addClass("minus")
        .appendTo(cell)
        [0].addEventListener("click", function() { window.plugin.keys.addKey(-1, guid); }, false);
    },
  });
}

var setup =  function() {
  if($.inArray('pluginKeysUpdateKey', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysUpdateKey');
  if($.inArray('pluginKeysRefreshAll', window.VALID_HOOKS) < 0)
    window.VALID_HOOKS.push('pluginKeysRefreshAll');

  window.plugin.keys.setupCSS();
  window.plugin.keys.setupContent();
  window.plugin.keys.loadLocal(plugin.keys.KEY);
  window.plugin.keys.loadLocal(plugin.keys.UPDATE_QUEUE);
  window.addHook('portalDetailsUpdated', window.plugin.keys.addToSidebar);
  window.addHook('iitcLoaded', window.plugin.keys.registerFieldForSyncing);

  if(window.plugin.portalslist) {
    window.plugin.keys.setupPortalsList();
  } else {
    setTimeout(function() {
      if(window.plugin.portalslist)
        window.plugin.keys.setupPortalsList();
    }, 500);
  }
}

window.plugin.keys.mergeKeys = function (obj, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) obj[key] = (obj[key]||0) + src[key];
    }
    return obj;
}

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


