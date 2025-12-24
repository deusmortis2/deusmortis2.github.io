'use strict';
const header = document.getElementById("bHeader");
const hd1 = document.getElementById("head1");
const hd2 = document.getElementById("head2");
const hd3 = document.getElementById("head3");
const pg1 = document.getElementById("p1");
const pg2 = document.getElementById("p2");
const pg3 = document.getElementById("p3");
// const tl = document.getElementById("title");
// const alien = document.getElementById("aImg");
header.innerHTML="<img src=https://cdn.hashnode.com/res/hashnode/image/upload/v1712072540742/C7c8AOPN6.png width=50px height=50px> <h1>Welcome to freeCodeCamp</h1>";
const img2 = document.createElement("img");
img2.src = "https://cdn.hashnode.com/res/hashnode/image/upload/v1712072540742/C7c8AOPN6.png";
img2.height = "50";
img2.width = "50";
header.appendChild(img2);
const htmlHeader = document.querySelector(".html");
// htmlHeader.innerHTML = "<h4>Hello World!</h4>";
const greeting = document.createElement("h4");
htmlHeader.appendChild(greeting);
// const alienImg = document.createElement("img");
// alienImg.src = "https://cdn.pixabay.com/photo/2021/02/18/14/49/icon-6027440_1280.png";
// alienImg.height = "25";
// alienImg.width = "25";
// htmlHeader.appendChild(alienImg);
// const alienShip = document.createElement("img");
// alienShip.src = "https://cdn.pixabay.com/photo/2020/04/02/16/22/ufo-4995753_1280.png";
// alienShip.height = "50";
// alienShip.width = "100";
// const shipBox = document.getElementById("shipContainer");
// shipBox.appendChild(alienShip);
// greeting.textContent="Hello World";

// const element = document.getElementById("aSImg");

// element.addEventListener("animationend", () => {
//     // Set your final state here. For example:
//    "transform: scale(1.5) translateX(-100px);"
// }, { once: true });
setTimeout(func, 15000);
function func() {
       document.body.style.backgroundImage = 'url(https://media.istockphoto.com/id/92893866/photo/space-stars-texture.jpg?s=2048x2048&w=is&k=20&c=UOSf7eVT8ZHc_1XGA8CWZ8agZSVkqhEPeyXUbCxFpPU=)';
    header.innerHTML = "<h1>All Your Base Are Belong To Us</h1>";
    hd1.innerText = "Hello World";
    hd2.innerText = "Someone set up us the bomb!";
    hd3.innerText = "You have no chance to survive make your time";
    pg1.innerText = "Aww, that's too bad!";
    pg2.innerText = "Come get some!";
    pg3.innerText = "How'd that feel?";
}


/* the goal in this revision is to make this initial HTML lab into something that better represents freeCodeCamp and with the help of animations inevitably results in a timed alien take over storing ship image here https://cdn.pixabay.com/photo/2020/04/02/16/22/ufo-4995753_1280.png space background here https://media.istockphoto.com/id/92893866/photo/space-stars-texture.jpg?s=2048x2048&w=is&k=20&c=UOSf7eVT8ZHc_1XGA8CWZ8agZSVkqhEPeyXUbCxFpPU=*/