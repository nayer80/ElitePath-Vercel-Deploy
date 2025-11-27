// visual-compare.js
const overlay = document.getElementById('overlay');
const input = document.getElementById('screenshot');
const opacity = document.getElementById('opacity');
const scale = document.getElementById('scale');
const offsetX = document.getElementById('offsetX');
const offsetY = document.getElementById('offsetY');
const reset = document.getElementById('reset');
const viewer = document.getElementById('viewer');

function applyTransform(){
  const s = scale.value/100;
  const x = parseInt(offsetX.value,10);
  const y = parseInt(offsetY.value,10);
  overlay.style.opacity = opacity.value;
  overlay.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  overlay.style.transformOrigin = 'top left';
}

input.addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    overlay.src = ev.target.result;
    overlay.style.opacity = opacity.value;
    overlay.style.transform = 'translate(0,0) scale(1)';
    offsetX.value = 0; offsetY.value = 0; scale.value = 100; opacity.value = 0.6;
  };
  reader.readAsDataURL(file);
});

[opacity, scale, offsetX, offsetY].forEach(el=>el.addEventListener('input', applyTransform));

reset.addEventListener('click', ()=>{
  offsetX.value = 0; offsetY.value = 0; scale.value = 100; opacity.value = 0.6;
  applyTransform();
});

// allow simple drag to move overlay
let dragging = false; let startX=0, startY=0, startOffsetX=0, startOffsetY=0;
overlay.addEventListener('mousedown', (e)=>{
  dragging = true; startX = e.clientX; startY = e.clientY; startOffsetX = parseInt(offsetX.value,10); startOffsetY = parseInt(offsetY.value,10);
  overlay.style.cursor = 'grabbing';
});
window.addEventListener('mousemove', (e)=>{
  if(!dragging) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  offsetX.value = startOffsetX + dx;
  offsetY.value = startOffsetY + dy;
  applyTransform();
});
window.addEventListener('mouseup', ()=>{
  dragging = false; overlay.style.cursor = 'default';
});

// initialize
applyTransform();
