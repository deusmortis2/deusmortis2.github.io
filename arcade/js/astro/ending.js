// The victory film after Neptune's boss. It plays over the canvas (and in
// fullscreen too), then calls done so the game can start over from the top.
// If the film can't load or play, done is called straight away instead.

const filmSrc = "video/boss_run_victory_v2.mp4";

export function playEnding(frame, muted, done) {
  const video = document.createElement("video");
  video.className = "ending-video";
  video.src = filmSrc;
  video.playsInline = true;
  video.muted = muted;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    video.remove();
    done();
  };
  video.addEventListener("ended", finish);
  video.addEventListener("error", finish);
  frame.append(video);
  // Some browsers refuse sound without a recent click; try again muted.
  video.play().catch(() => {
    video.muted = true;
    video.play().catch(finish);
  });
}
