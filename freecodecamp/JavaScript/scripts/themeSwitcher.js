'use strict';

const themes = [
    {name: "light", message: "Hello sunshine \u2014 Light theme is on!" },
    {name: "dark", message: "The night is yours \u2014 Dark theme is on!" },
    {name: "ocean", message: "Blue skies and high tides \u2014 Ocean theme is on!" },
    {name: "nord", message: "The frost has settled \u2014 Nord theme is on!" }
];
const themeBtn = document.getElementById("theme-switcher-button");


function toggleDropDown() {
    const themeElements = document.querySelectorAll('[role="menuitem"]');
    const statusEl = document.getElementById("status");
    const dropDown = document.getElementById('theme-dropdown');
      if (dropDown.hidden === false) {
        themeBtn.ariaExpanded = false;
        } else {
    themeBtn.ariaExpanded = true;};
    dropDown.toggleAttribute('hidden');

   themeElements.forEach((theme) => { 
    theme.addEventListener("click", () => {
    themeElements.forEach(t => {t.setAttribute("aria-selected", "false")});
    theme.setAttribute("aria-selected", "true");
    document.body.className = '';
    console.log(dropDown.hidden);
     if (dropDown.hidden === false) {
        themeBtn.ariaExpanded = false;
        } else {
    themeBtn.ariaExpanded = true;};   
    const themeTxt = theme.textContent;
    dropDown.toggleAttribute('hidden');
    themeBtn.ariaExpanded = false;
    document.body.classList.add("theme-" + themeTxt.toLowerCase());
    for (const t of themes) {
        if (t.name === themeTxt.toLowerCase()) {
            statusEl.textContent = t.message;
        }
    }
})
}); 
}




themeBtn.addEventListener("click", toggleDropDown);
