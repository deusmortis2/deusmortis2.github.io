const display = document.getElementById("display");
const buttons = document.querySelectorAll(".drum-pad");

for(const button of buttons) {
  const audio = document.getElementById(`${button.innerText}`);
  let audioText = audio.src.replace("https://cdn.freecodecamp.org/curriculum/drum/", "");
  audioText = audioText.replace(".mp3", "");
  audioText = audioText.replace(/[_-]/g, " "); 
  button.addEventListener("click", () => {
    display.textContent = `${audioText}`;
    audio.play();
});
document.addEventListener("keydown", (event) => {
  const buttonText = `${button.innerText}`;
  if (event.key.toUpperCase() === buttonText) {
    display.textContent = `${audioText}`;
    audio.play();
  }
});


}