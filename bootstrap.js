if (typeof Zotero == 'undefined') {
    var Zotero;
}
var ShortDOI;
var chromeHandle;
var importedServices;

let mainWindowListener;

function log(msg) {
    Zotero.debug("DOI Manager: " + msg);
}

function loadServices() {
    if (typeof Services != 'undefined') {
        return Services;
    }
    if (importedServices) {
        return importedServices;
    }

    if (ChromeUtils.importESModule) {
        importedServices = ChromeUtils.importESModule("resource://gre/modules/Services.sys.mjs").Services;
    } else {
        importedServices = ChromeUtils.import("resource://gre/modules/Services.jsm").Services;
    }
    return importedServices;
}

// In Zotero 6, bootstrap methods are called before Zotero is initialized, and using include.js
// to get the Zotero XPCOM service would risk breaking Zotero startup. Instead, wait for the main
// Zotero window to open and get the Zotero object from there.
//
// In Zotero 7 and later, bootstrap methods are not called until Zotero is initialized, and 'Zotero'
// is automatically made available.
async function waitForZotero() {
    if (typeof Zotero != 'undefined') {
        await Zotero.initializationPromise;
        return;
    }

    var services = loadServices();
    var windows = services.wm.getEnumerator('navigator:browser');
    var found = false;
    while (windows.hasMoreElements()) {
        let win = windows.getNext();
        if (win.Zotero) {
            Zotero = win.Zotero;
            found = true;
            break;
        }
    }
    if (!found) {
        await new Promise((resolve) => {
            var listener = {
                onOpenWindow: function (aWindow) {
                    // Wait for the window to finish loading
                    let domWindow = aWindow
                        .QueryInterface(Ci.nsIInterfaceRequestor)
                        .getInterface(
                            Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow
                        );
                    domWindow.addEventListener(
                        "load",
                        function () {
                            domWindow.removeEventListener(
                                "load",
                                arguments.callee,
                                false
                            );
                            if (domWindow.Zotero) {
                                services.wm.removeListener(listener);
                                Zotero = domWindow.Zotero;
                                resolve();
                            }
                        },
                        false
                    );
                },
            };
            services.wm.addListener(listener);
        });
    }
    await Zotero.initializationPromise;
}

// Adds main window open/close listeners in Zotero 6
function listenForMainWindowEvents() {
    var services = loadServices();
    mainWindowListener = {
        onOpenWindow: function (aWindow) {
            let domWindow = aWindow
                .QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
            async function onload() {
                domWindow.removeEventListener("load", onload, false);
                if (
                    domWindow.location.href !==
                    "chrome://zotero/content/standalone/standalone.xul"
                ) {
                    return;
                }
                onMainWindowLoad({ window: domWindow });
            }
            domWindow.addEventListener("load", onload, false);
        },
        onCloseWindow: async function (aWindow) {
            let domWindow = aWindow
                .QueryInterface(Ci.nsIInterfaceRequestor)
                .getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
            if (
                domWindow.location.href !==
                "chrome://zotero/content/standalone/standalone.xul"
            ) {
                return;
            }
            onMainWindowUnload({ window: domWindow });
        },
    };
    services.wm.addListener(mainWindowListener);
}

function removeMainWindowListener() {
    if (mainWindowListener) {
        loadServices().wm.removeListener(mainWindowListener);
    }
}

// Loads default preferences from prefs.js in Zotero 6
function setDefaultPrefs(rootURI) {
    var services = loadServices();
    var branch = services.prefs.getDefaultBranch("");
    var obj = {
        pref(pref, value) {
            switch (typeof value) {
                case 'boolean':
                    branch.setBoolPref(pref, value);
                    break;
                case 'string':
                    branch.setStringPref(pref, value);
                    break;
                case 'number':
                    branch.setIntPref(pref, value);
                    break;
                default:
                    Zotero.logError(`Invalid type '${typeof (value)}' for pref '${pref}'`);
            }
        },
    };
    services.scriptloader.loadSubScript(rootURI + "prefs.js", obj);
}

async function install() {
    await waitForZotero();

    log("Installed");
}

async function startup({ id, version, resourceURI, rootURI = resourceURI.spec }) {
    await waitForZotero();

    log("Starting");

    var services = loadServices();

    if (Zotero.platformMajorVersion < 102) {
        // Listen for window load/unload events in Zotero 6, since onMainWindowLoad/Unload don't
        // get called
        listenForMainWindowEvents();
        // Read prefs from prefs.js in Zotero 6
        setDefaultPrefs(rootURI);
    }

    var aomStartup = Cc[
        "@mozilla.org/addons/addon-manager-startup;1"
    ].getService(Ci.amIAddonManagerStartup);
    var manifestURI = services.io.newURI(rootURI + "manifest.json");
    chromeHandle = aomStartup.registerChrome(manifestURI, [
        ["locale", "zoteroshortdoi", "en-US", "locale/en-US/"],
        ["locale", "zoteroshortdoi", "de", "locale/de/"],
    ]);

    services.scriptloader.loadSubScript(rootURI + "zoteroshortdoi.js");

    ShortDOI.init({ id, version, rootURI });

    if (Zotero.platformMajorVersion >= 102) {
        Zotero.PreferencePanes.register({
            pluginID: id,
            src: rootURI + 'content/options.xhtml',
            //scripts: ['prefs.js'],
            //stylesheets: ['prefs.css'],
        });
    }

    ShortDOI.addToAllWindows();
}

function onMainWindowLoad({ window }) {
    ShortDOI.addToWindow(window);
}

function onMainWindowUnload({ window }) {
    ShortDOI.removeFromWindow(window);
}

function shutdown() {
    log("Shutting down");

    if (Zotero.platformMajorVersion < 102) {
        removeMainWindowListener();
    }

    if (ShortDOI) {
        ShortDOI.shutdown();
        ShortDOI.removeFromAllWindows();
        ShortDOI = undefined;
    }

    if (chromeHandle) {
        chromeHandle.destruct();
        chromeHandle = null;
    }
}

function uninstall() {
    // `Zotero` object isn't available in `uninstall()` in Zotero 6, so log manually
    if (typeof Zotero == 'undefined') {
        dump("DOI Manager: Uninstalled\n\n");
        return;
    }

    log("Uninstalled");
}
