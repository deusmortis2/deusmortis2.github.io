'use strict';
function updateHeart(btn) {
    if (btn.classList.contains("filled") === false ) {
    btn.innerHTML = "&#10084;";
    btn.classList.add("filled");
    } else {
        btn.classList.remove("filled");
        btn.innerHTML = "&#9825;";
    }

}

const btns = document.querySelectorAll(".favorite-icon");
btns.forEach((btn) => btn.addEventListener('click', ()=> updateHeart(btn)));
console.log(btns);