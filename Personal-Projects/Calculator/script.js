'use strict';

const output = document.getElementById("output");
const calculator = document.getElementById("Full");

calculator.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    output.textContent += button.id + " ";
     
    });