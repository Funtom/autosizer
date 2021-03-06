// Copyright 2011-2014 Kevin Cox

/*******************************************************************************
*                                                                              *
*  Permission is hereby granted, free of charge, to any person obtaining a     *
*  copy of this software and associated documentation files (the "Software"),  *
*  to deal in the Software without restriction, including without limitation   *
*  the rights to use, copy, modify, merge, publish, distribute, sublicense,    *
*  and/or sell copies of the Software, and to permit persons to whom the       *
*  Software is furnished to do so, subject to the following conditions:        *
*                                                                              *
*  The above copyright notice and this permission notice shall be included in  *
*  all copies or substantial portions of the Software.                         *
*                                                                              *
*  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR  *
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,    *
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL     *
*  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER  *
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING     *
*  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER         *
*  DEALINGS IN THE SOFTWARE.                                                   *
*                                                                              *
*******************************************************************************/

"use strict";

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/AddonManager.jsm");

function d ( msg, important )
{
	//if (!important) return; // Comment for debugging.
	
	dump("autosizer-bs: "+msg+"\n");
	Services.console.logStringMessage("autosizer-bs: "+msg);
}

d("bootstrap.js loaded.");

function runOnLoad(window) {
	// Listen for one load event before checking the window type
	if (window.document.readyState == "complete")
	{
		if (window.document.documentElement.getAttribute("windowtype") == "navigator:browser")
			new Autosizer(window);
	}
	else
	{
		window.addEventListener("load", function lsnr() {
			window.removeEventListener("load", lsnr, false);
			
			runOnLoad(window);
		}, false);
	}
}

function windowWatcher(subject, topic)
{
	if (topic == "domwindowopened")
		runOnLoad(subject);
}

/*** Bootstrap Functions ***/
function startup(data, reason)
{
	d("Importing Autosizer.");
	Components.utils.import("chrome://autosizer/content/Autosizer.jsm");
	d("Autosizer imported.");
	
	/*** Add to new windows when they are opened ***/
	Services.ww.registerNotification(windowWatcher);
	
	/*** Add to currently open windows ***/
	let browserWindows = Services.wm.getEnumerator("navigator:browser");
	while (browserWindows.hasMoreElements()) {
		let browserWindow = browserWindows.getNext();
		
		windowWatcher(browserWindow, "domwindowopened");
	}
}

function shutdown(data, reason)
{
	if ( reason == APP_SHUTDOWN ) return;
	
	Services.ww.unregisterNotification(windowWatcher);
	
	d("Destroying Autosizer.");
	Autosizer.destroy();
	
	Components.utils.unload("chrome://autosizer/content/Autosizer.jsm");
	Components.utils.unload("chrome://autosizer/content/CPref.jsm");
	
	d("Shutdown complete.");
}

function install (data, reason)
{
	let prefs = Services.prefs.getBranch("extensions.autosizer.");
	
	if ( reason == ADDON_UPGRADE )
	{
		if ( Services.vc.compare(data.oldVersion, "3.0") < 0 )
		{
			d("Migrating Preferences.");
			
			if (prefs.prefHasUserValue("sizeOn"))
			{
				let nv = {none:"none",key:"inc",atonce:"once"}[prefs.getCharPref("sizeOn")];
				if (nv) prefs.setCharPref("sizestyle", nv);
			}
			prefs.clearUserPref("sizeOn");
			
			if (prefs.prefHasUserValue("padding"))
				prefs.setIntPref("padding.query", prefs.getIntPref("padding"));
			prefs.clearUserPref("paddingadding");
			
			if (prefs.prefHasUserValue("namePadding"))
				prefs.setIntPref("padding.engine", prefs.getIntPref("namePadding"));
			prefs.clearUserPref("namePadding");
			
			if (prefs.prefHasUserValue("cleanOnSubmit"))
				prefs.setBoolPref("aftersearch.clean", prefs.getBoolPref("cleanOnSubmit"));
			prefs.clearUserPref("cleanOnSubmit");
			
			if (prefs.prefHasUserValue("revertOnSubmit"))
				prefs.setBoolPref("aftersearch.resetengine", prefs.getBoolPref("revertOnSubmit"));
			prefs.clearUserPref("revertOnSubmit");
			
			if (prefs.prefHasUserValue("shrinkToButton"))
				prefs.setBoolPref("buttonify", prefs.getBoolPref("shrinkToButton"));
			prefs.clearUserPref("shrinkToButton");
			
			if (prefs.prefHasUserValue("expandonfocus"))
				prefs.setBoolPref("sizeon.focus", prefs.getBoolPref("expandonfocus"));
			prefs.clearUserPref("expandonfocus");
			
			if (prefs.prefHasUserValue("shrinkwhenfull"))
				prefs.setBoolPref("sizeon.content", prefs.getBoolPref("shrinkwhenfull"));
			prefs.clearUserPref("shrinkwhenfull");
			
			if (prefs.prefHasUserValue("preflink"))
				prefs.setBoolPref("preflink.enginemenu", prefs.getCharPref("preflink") != "none");
			prefs.clearUserPref("preflink");
			
			d("Migration completed.");
		}
	}
}
