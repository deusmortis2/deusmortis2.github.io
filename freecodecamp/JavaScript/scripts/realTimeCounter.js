'use strict';
    const count = document.getElementById('counter');
    const textInput = document.getElementById('text-input');
    const paragraph = document.getElementById('char-count');
document.getElementById('text-input').addEventListener('input',() => {
    const current = textInput.value.length;
    count.textContent = current;
    if (current >= 50) {
        textInput.value = textInput.value.substring(0, 50);
        paragraph.style.color = 'red';
    }
});

