// ----- Canvas setup -----
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var dragging = false;
var pos = { x: 0, y: 0 };
var model = null;

var statusEl = document.getElementById("status");
var resultEl = document.getElementById("result");
var confEl = document.getElementById("confidence");
var barsEl = document.getElementById("bars");

// Build the 0–9 probability bars
for (var d = 0; d < 10; d++) {
  var row = document.createElement("div");
  row.className = "bar";
  row.innerHTML = "<span>" + d + "</span><div class='track'><div class='fill'></div></div><span class='pct'>–</span>";
  barsEl.appendChild(row);
}

// Map a pointer event to canvas pixel coordinates (works when the canvas is scaled by CSS)
function setPosition(e) {
  var rect = canvas.getBoundingClientRect();
  pos.x = (e.clientX - rect.left) * (canvas.width / rect.width);
  pos.y = (e.clientY - rect.top) * (canvas.height / rect.height);
}

function draw(e) {
  if (!dragging) return;
  e.preventDefault();
  ctx.beginPath();
  ctx.lineWidth = 40;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // NOTE: the model's preprocessing sums the RGB channels, so pure red keeps the
  // input identical to what the model was built for.
  ctx.strokeStyle = "red";
  ctx.moveTo(pos.x, pos.y);
  setPosition(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

// Pointer events cover mouse, touch and pen
canvas.addEventListener("pointerdown", function (e) {
  dragging = true;
  canvas.setPointerCapture(e.pointerId);
  setPosition(e);
  draw(e); // allow single-tap dots
});
canvas.addEventListener("pointermove", draw);
["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) {
  canvas.addEventListener(ev, function () { dragging = false; });
});

function erase() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resultEl.textContent = "–";
  confEl.textContent = "Draw something to get a prediction";
  updateBars(null);
}

function updateBars(probs) {
  var rows = barsEl.children;
  var best = probs ? probs.indexOf(Math.max.apply(null, probs)) : -1;
  for (var i = 0; i < rows.length; i++) {
    var p = probs ? probs[i] : 0;
    rows[i].querySelector(".fill").style.width = (p * 100).toFixed(1) + "%";
    rows[i].querySelector(".pct").textContent = probs ? (p * 100).toFixed(1) + "%" : "–";
    rows[i].classList.toggle("top", i === best);
  }
}

// ----- Model -----
async function loadModel() {
  model = await tf.loadLayersModel("tensorflow/model.json");
  // warm start: speeds up the first real inference
  tf.tidy(function () { model.predict(tf.zeros([1, 28, 28, 1])); });
  statusEl.textContent = "Model ready ✓";
}

async function predictModel() {
  if (!model) { statusEl.textContent = "Model still loading…"; return; }
  var probs = tf.tidy(function () {
    var image = tf.browser.fromPixels(ctx.getImageData(0, 0, canvas.width, canvas.height));
    image = tf.image.resizeBilinear(image, [28, 28]).sum(2).expandDims(0).expandDims(-1);
    return model.predict(image).dataSync();
  });
  probs = Array.from(probs);
  var best = probs.indexOf(Math.max.apply(null, probs));
  resultEl.textContent = best;
  confEl.textContent = (probs[best] * 100).toFixed(1) + "% confident";
  updateBars(probs);
}

loadModel().catch(function (err) {
  statusEl.textContent = "Could not load the model: " + err.message;
});
