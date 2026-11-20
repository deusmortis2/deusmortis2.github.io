/**
 * Spireclash aim assist. Once the crosshair drifts close to the rival (and
 * the rival is in plain sight), it is drawn the rest of the way onto them,
 * follows them as they move, and the look slows a little while on target so
 * small corrections are easier. Works the same for mouse and touch, since it
 * steers the shared yaw and pitch rather than the input itself.
 */
(function () {
  'use strict';
  const G = window.G;

  // Per level: radius (metres around the rival that count as close), pull
  // (how quickly the crosshair is drawn in, per second), track (share of the
  // rival's movement across the screen that the aim follows) and friction
  // (look speed kept while right on target).
  const LEVELS = {
    off: null,
    light: { radius: 1.5, pull: 4, track: 0.45, friction: 0.8 },
    standard: { radius: 2.3, pull: 7, track: 0.7, friction: 0.65 },
    strong: { radius: 3.2, pull: 11, track: 0.9, friction: 0.5 },
  };
  // The close zone as an angle: never tinier than this (far rivals) ...
  const MIN_CONE = 0.035;
  // ... nor wider than this (rivals right up close).
  const MAX_CONE = 0.32;
  // Beyond this the rival is too far away to help with.
  const MAX_RANGE = 95;
  // Aiming down sights widens the close zone a touch.
  const ADS_BOOST = 1.25;
  // The largest rival movement (radians a frame) that tracking follows, so a
  // respawn or teleport never yanks the view.
  const MAX_TRACK_STEP = 0.12;

  const TO = new THREE.Vector3();
  const centre = { yaw: 0, pitch: 0 };
  let prev = null;
  let weight = 0;

  // Yaw and pitch from the camera to a point.
  function anglesTo(from, x, y, z, out) {
    const dx = x - from.x;
    const dz = z - from.z;
    out.yaw = G.yawFromDir(dx, dz);
    out.pitch = Math.atan2(y - from.y, Math.hypot(dx, dz));
    return out;
  }

  // Whether nothing solid stands between the camera and a point on the rival.
  function canSee(camera, player, foe, y) {
    const from = camera.position;
    TO.set(foe.pos.x - from.x, y - from.y, foe.pos.z - from.z);
    const dist = TO.length();
    if (dist < 0.01) return true;
    TO.divideScalar(dist);
    const hit = G.combat.raycast(from, TO, dist + 1, player);
    return !!hit && hit.char === foe;
  }

  function lose() {
    prev = null;
    weight = 0;
  }

  // Steer ctx.ctrl's yaw and pitch for this frame. ctx holds ctrl, camera,
  // player, foe, level (a LEVELS key) and active (the player can shoot now).
  function update(dt, ctx) {
    const lv = LEVELS[ctx.level];
    const { ctrl, camera, player, foe } = ctx;
    if (!lv || !ctx.active || !foe.alive) {
      lose();
      return;
    }
    const cam = camera.position;
    const dx = foe.pos.x - cam.x;
    const dz = foe.pos.z - cam.z;
    const flat = Math.hypot(dx, dz);
    // The pull aims where the crosshair already crosses the rival, held to
    // their body, so going for the head stays on the head.
    const crossY = cam.y + Math.tan(ctrl.pitch) * flat;
    const aimY = G.clamp(crossY, foe.pos.y + 0.45, foe.pos.y + 1.68);
    const dist = Math.hypot(flat, aimY - cam.y);
    if (dist > MAX_RANGE) {
      lose();
      return;
    }
    const aimPitch = Math.atan2(aimY - cam.y, flat);
    const dYaw = G.angleDiff(ctrl.yaw, G.yawFromDir(dx, dz));
    const dPitch = aimPitch - ctrl.pitch;
    const off = Math.hypot(dYaw * Math.cos(aimPitch), dPitch);
    const radius = lv.radius * (ctrl.ads ? ADS_BOOST : 1);
    const cone = G.clamp(Math.atan(radius / Math.max(dist, 0.1)), MIN_CONE, MAX_CONE);
    const visible = off <= cone && (canSee(camera, player, foe, foe.pos.y + 1.0) || canSee(camera, player, foe, foe.pos.y + 1.65));
    if (!visible) {
      lose();
      return;
    }
    // 1 dead on the rival, falling to 0 at the edge of the close zone.
    const w = Math.sqrt(1 - off / cone);
    weight = w;

    // Tracking: follow the rival's movement across the view since last frame.
    anglesTo(cam, foe.pos.x, foe.pos.y + 1.0, foe.pos.z, centre);
    if (prev) {
      const follow = lv.track * Math.min(1, w * 3);
      const ty = G.clamp(G.angleDiff(prev.yaw, centre.yaw), -MAX_TRACK_STEP, MAX_TRACK_STEP);
      const tp = G.clamp(centre.pitch - prev.pitch, -MAX_TRACK_STEP, MAX_TRACK_STEP);
      ctrl.yaw += ty * follow;
      ctrl.pitch += tp * follow;
    } else {
      prev = { yaw: 0, pitch: 0 };
    }
    prev.yaw = centre.yaw;
    prev.pitch = centre.pitch;

    // Pull: close the rest of the gap, firmer the nearer the crosshair is.
    const k = 1 - Math.exp(-lv.pull * w * dt);
    ctrl.yaw += dYaw * k;
    ctrl.pitch = G.clamp(ctrl.pitch + dPitch * k, -1.45, 1.45);
  }

  // Multiplier for look speed: below 1 while the crosshair is on the rival.
  function friction(level) {
    const lv = LEVELS[level];
    if (!lv) return 1;
    return 1 - (1 - lv.friction) * weight;
  }

  G.aimAssist = { LEVELS, update, friction, reset: lose };
})();
