// ==UserScript==
// @name         Auto-Login: USask, Weblink, Crowdmark & Canvas
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automates login for cas.usask.ca, weblinkauth, handles crowdmark redirects, and closes Canvas SLEQ popups safely
// @author       You
// @updateURL    https://raw.githubusercontent.com/scrxpted7327/Userscripts/main/AutoLogin.dat
// @downloadURL  https://raw.githubusercontent.com/scrxpted7327/Userscripts/main/AutoLogin.js
// @match        *://cas.usask.ca/cas/login*
// @match        *://*.weblinkauth.com/*
// @match        *://crowdmark.com/*
// @match        *://app.crowdmark.com/sign-in*
// @match        *://usask.instructure.com/login/oauth2/confirm*
// @match        *://canvas.usask.ca/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Helper: Wait for an element to appear in the DOM (Presence check)
    function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    // Helper: Wait for an element to be VISIBLE (Style check: display != none)
    function waitForVisible(selector) {
        return new Promise(resolve => {
            const check = () => {
                const el = document.querySelector(selector);
                // offsetParent is null if the element or its parents are hidden (display: none)
                if (el && el.offsetParent !== null) {
                    resolve(el);
                } else {
                    // Check again on next animation frame
                    requestAnimationFrame(check);
                }
            };
            check();
        });
    }

    // Configuration for different domains
    const SITES = [
        // --- Standard Login Forms (User/Pass) ---
        {
            name: "USask CAS",
            domainKey: "cas.usask.ca",
            check: () => window.location.hostname === "cas.usask.ca",
            type: "login",
            userSel: "#username",
            passSel: "#password",
            submitSel: "input[type='submit']"
        },
        {
            name: "WeblinkAuth",
            domainKey: "weblinkauth.com",
            check: () => window.location.hostname.includes("weblinkauth.com") && document.querySelector("form[action^='/login?signin=']"),
            type: "login",
            userSel: "#username",
            passSel: "#password",
            submitSel: "button.btn.btn-primary",
            rememberSel: "#rememberMe"
        },

        // --- Custom Redirects / Clicks ---
        {
            name: "Crowdmark Homepage Redirect",
            check: () => window.location.hostname === "crowdmark.com" && (window.location.pathname === "/" || window.location.pathname === ""),
            type: "action",
            run: () => {
                window.location.replace("https://app.crowdmark.com/sign-in");
            }
        },
        {
            name: "Crowdmark Canvas Sign-in",
            check: () => window.location.hostname === "app.crowdmark.com" && window.location.pathname.includes("sign-in"),
            type: "action",
            run: async () => {
                await waitForElement("a.button.button--large");
                const buttons = document.querySelectorAll("a.button.button--large");
                for (let btn of buttons) {
                    if (btn.textContent.includes("Sign in with Canvas")) {
                        console.log("Found Canvas login button, clicking...");
                        btn.click();
                        break;
                    }
                }
            }
        },
        {
            name: "Canvas OAuth Authorize",
            check: () => window.location.hostname === "usask.instructure.com" && window.location.pathname.includes("/login/oauth2/confirm"),
            type: "action",
            run: async () => {
                const selector = "input[name='commit'][value='Authorize']";
                const btn = await waitForElement(selector);
                console.log("Found Authorize button, clicking...");
                btn.click();
            }
        },
        {
            name: "Canvas SLEQ Popup",
            check: () => window.location.hostname === "canvas.usask.ca",
            type: "action",
            run: async () => {
                console.log("Checking for SLEQ Popup...");

                // 1. Wait for the popup container to exist in DOM
                await waitForElement("#dvcanvaspopup");

                // 2. Check if the heading text matches
                const heading = document.getElementById("bluePopupHeading");
                if (heading && heading.textContent.includes("SLEQ Feedback")) {
                    console.log("SLEQ Feedback detected.");

                    // 3. Wait specifically for the Close button to be VISIBLE
                    // (This prevents clicking before the fade-in animation completes)
                    const closeBtn = await waitForVisible("#btnClosePrompt");
                    
                    console.log("Close button visible. Clicking 'Remind me Later'...");
                    closeBtn.click();
                }
            }
        }
    ];

    // Helper: Manage Credentials
    function getCredentials(domainKey) {
        let creds = GM_getValue(domainKey);
        if (!creds) {
            const u = prompt(`Enter Username for ${domainKey}:`);
            if (!u) return null;
            const p = prompt(`Enter Password for ${domainKey}:`);
            if (!p) return null;
            if (confirm("Save credentials for auto-login next time?")) {
                GM_setValue(domainKey, { u: u, p: p });
            }
            return { u: u, p: p };
        }
        return creds;
    }

    // Logic: Handle Standard Form Login
    async function handleLogin(site) {
        console.log(`%c Detected ${site.name}. Attempting Auto-Auth...`, 'background: #222; color: #00ffff');
        try {
            const userInput = await waitForElement(site.userSel);
            const passInput = document.querySelector(site.passSel);
            const submitBtn = document.querySelector(site.submitSel);

            const creds = getCredentials(site.domainKey);
            if (!creds) return;

            // Fill fields
            const fill = (el, val) => { el.value = val; el.dispatchEvent(new Event('input', {bubbles:true})); };
            fill(userInput, creds.u);
            fill(passInput, creds.p);

            // Remember Me
            if (site.rememberSel) {
                const remBtn = document.querySelector(site.rememberSel);
                if (remBtn && !remBtn.checked) remBtn.click();
            }

            // Click Login
            setTimeout(() => {
                if (submitBtn) submitBtn.click();
                else passInput.closest('form').submit();
            }, 500);
        } catch (e) { console.error(e); }
    }

    // Register Menu Command to Clear Creds
    GM_registerMenuCommand("Reset Stored Credentials", () => {
        SITES.filter(s => s.type === 'login').forEach(s => GM_deleteValue(s.domainKey));
        alert("Credentials cleared.");
    });

    // Main Execution Loop
    for (const site of SITES) {
        if (site.check()) {
            if (site.type === "login") {
                handleLogin(site);
            } else if (site.type === "action") {
                console.log(`%c Detected ${site.name}. Executing Action...`, 'background: #222; color: #ff00ff');
                site.run();
            }
            break;
        }
    }

})();
