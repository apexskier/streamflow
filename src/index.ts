import { Vector } from './vector';
import { shuffleArray } from './shuffle';

const canvasEl = document.querySelector('canvas')!;
const ctx = canvasEl.getContext('2d')!;

// determine the 'backing store ratio' of the canvas context
const backingStoreRatio =
  (ctx as any).webkitBackingStorePixelRatio ||
  (ctx as any).mozBackingStorePixelRatio ||
  (ctx as any).msBackingStorePixelRatio ||
  (ctx as any).oBackingStorePixelRatio ||
  (ctx as any).backingStorePixelRatio ||
  1;

// assume the device pixel ratio is 1 if the browser doesn't specify it
// determine the actual ratio we want to draw at
const ratio = (window.devicePixelRatio || 1) / backingStoreRatio;
ctx.scale(ratio, ratio);

var w = window.innerWidth * ratio;
var h = window.innerHeight * ratio;
canvasEl.setAttribute('width', `${w}`);
canvasEl.setAttribute('height', `${h}`);
canvasEl.style.height = `${h / ratio}px`;
canvasEl.style.width = `${w / ratio}px`;

interface Drawable {
  draw(ctx: CanvasRenderingContext2D): void;
}

interface Raft {
  position: Vector;
}

// https://stackoverflow.com/a/6333775
function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) {
  var headLength = 10;
  var dx = toX - fromX;
  var dy = toY - fromY;
  var angle = Math.atan2(dy, dx);
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6),
  );
  ctx.stroke();
}

class Rock implements Drawable {
  constructor(readonly position: Vector, readonly radius: number) {}
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'grey';
    ctx.fill();
    ctx.beginPath();
    ctx.restore();
  }
  calculateFlowAt(position: Vector, flow: Vector) {
    const positionToThis = this.position.subtract(position);
    const distance = positionToThis.length();
    if (distance <= this.radius) {
      // crash?
      return new Vector();
    }
    const angleFromPositionBetweenFlowAndThis = positionToThis.angleTo(flow);
    const perpendicularComponent =
      distance * Math.sin(angleFromPositionBetweenFlowAndThis);
    const areaOfEffect = this.radius * 1.5;
    if (perpendicularComponent > areaOfEffect) {
      return new Vector();
    }
    const reboundForce = Math.cos(
      (perpendicularComponent * (Math.PI / 2)) / areaOfEffect,
    );
    const d = 1 / ((distance - this.radius) / 100 + 1);
    return flow.reflect(positionToThis).multiply(reboundForce).multiply(d);
  }
}

const raft = {
  position: new Vector(w / 2 + 20, 20),
  positionV: new Vector(),
  rotation: 0,
  rotationV: 0,
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.fillRect(-10, -15, 20, 60);
    ctx.restore();
  },
};

const rocks = [
  new Rock(new Vector(w / 2, h / 5), 40),
  new Rock(new Vector(w / 2 + 20, h / 5), 40),
  new Rock(new Vector(w / 2 + 50, h / 5), 40),
  new Rock(new Vector(w / 2, h / 3), 70),
  new Rock(new Vector(w / 2 + 200, h / 3 + 10), 70),
  new Rock(new Vector(w / 2, (h * 4) / 6), 70),
  new Rock(new Vector(w / 2, (h * 5) / 7), 120),
];

const rotationFriction = 0.00001;
const positionFriction = 0.00005;

function signOf(x: number): -1 | 1 {
  return x > 0 ? 1 : -1;
}

window.addEventListener('keydown', (ev) => {
  if (ev.code === 'Space') {
    ev.preventDefault();
    if (!running) {
      start();
    } else {
      pause();
    }
  } else if (ev.code === 'KeyA') {
    ev.preventDefault();
    // TODO: there needs to be some sort of dampening. As the value is higher, the additional velocity is lower and caps at some point
    raft.rotationV = Math.min(raft.rotationV + 0.0005, 0.005);
    raft.positionV = raft.positionV.add(
      Vector.fromAngle(raft.rotation + Math.PI / 2).multiply(0.001),
    );
  } else if (ev.code === 'KeyD') {
    ev.preventDefault();
    raft.rotationV = Math.max(raft.rotationV - 0.0005, -0.005);
    raft.positionV = raft.positionV.add(
      Vector.fromAngle(raft.rotation + Math.PI / 2).multiply(0.001),
    );
  }
});

let running = true;

let lastTime = 0;
function tick(time: number) {
  const timeDelta = time - lastTime;

  // reset
  ctx.clearRect(0, 0, w, h);

  // calculate stream flow at position of raft
  let baseStreamFlow = new Vector(0, 0.05);
  let streamFlow = baseStreamFlow.clone();

  // shuffle rocks and recycle the flow.
  // A real simulation would need to calculate every element interacting with each other (O(n^2))
  // Since this will apply in different orders each time it sort of mimics that but in O(n) time.
  // Assuming rendering can keep a decent framerate, seems like it works
  shuffleArray(rocks);
  for (const rock of rocks) {
    const rockStreamFlow = rock.calculateFlowAt.call(
      rock,
      raft.position,
      streamFlow,
    );

    streamFlow = streamFlow.add(rockStreamFlow);

    ctx.save();
    const t = rock.position.add(
      rockStreamFlow.unit().multiply(rock.radius + 10),
    );
    ctx.translate(t.x, t.y);
    drawArrow(ctx, 0, 0, rockStreamFlow.x * 10000, rockStreamFlow.y * 10000);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(100, 100);
  drawArrow(ctx, 0, 0, baseStreamFlow.x * 10000, baseStreamFlow.y * 10000);
  ctx.restore();

  ctx.save();
  ctx.translate(200, 100);
  drawArrow(ctx, 0, 0, streamFlow.x * 10000, streamFlow.y * 10000);
  ctx.restore();

  ctx.save();
  ctx.translate(300, 100);
  const finalEffect = streamFlow.add(raft.positionV);
  drawArrow(ctx, 0, 0, finalEffect.x * 10000, finalEffect.y * 10000);
  ctx.restore();

  for (const rock of rocks) {
    rock.draw(ctx);
  }

  raft.draw.call(raft, ctx);

  ctx.save();
  const t = raft.position.add(raft.positionV.unit().multiply(40));
  ctx.translate(t.x, t.y);
  drawArrow(ctx, 0, 0, raft.positionV.x * 10000, raft.positionV.y * 10000);
  ctx.restore();

  // update positions
  raft.position = raft.position.add(finalEffect.multiply(timeDelta));

  raft.rotation += timeDelta * raft.rotationV;

  // apply physics
  raft.rotationV =
    Math.abs(Math.max(0, Math.abs(raft.rotationV) - rotationFriction)) *
    signOf(raft.rotationV);

  const raftDirectionVector = Vector.fromAngle(
    raft.rotation + Math.PI / 2,
  ).multiply(raft.positionV.length());
  raft.positionV = Vector.lerp(raft.positionV, raftDirectionVector, 0.25);
  raft.positionV = new Vector(
    Math.abs(Math.max(0, Math.abs(raft.positionV.x) - positionFriction)) *
      signOf(raft.positionV.x),
    Math.abs(Math.max(0, Math.abs(raft.positionV.y) - positionFriction)) *
      signOf(raft.positionV.y),
  );

  lastTime = time;

  if (running) {
    return window.requestAnimationFrame(tick);
  }
}

let rafHandle: number = 0;
function start() {
  running = true;
  lastTime = 0;
  rafHandle = tick(0) ?? 0;
}
function pause() {
  window.cancelAnimationFrame(rafHandle);
  running = false;
}

start();
