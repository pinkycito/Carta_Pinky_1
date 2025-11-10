const canvas = document.getElementById('cartaCanvas');
const ctx = canvas.getContext('2d');

// --- NUEVO: Canvas de fondo para corazones y brillos ---
const bgCanvas = document.createElement('canvas');
bgCanvas.id = 'bgCanvas';
bgCanvas.style.position = 'fixed';
bgCanvas.style.left = '0';
bgCanvas.style.top = '0';
bgCanvas.style.width = '100vw';
bgCanvas.style.height = '100vh';
bgCanvas.style.pointerEvents = 'none';
bgCanvas.style.zIndex = '1';
document.body.insertBefore(bgCanvas, document.body.firstChild);
const bgCtx = bgCanvas.getContext('2d');

// Carta config
const carta = {
  x: 100, y: 100, w: 300, h: 180,
  flapHeight: 60,
  openProgress: 0, // 0 cerrado, 1 abierto
  opening: false,
  bounce: 0 // rebote de la tapa
};

// Corazones animados
const corazones = [];
function crearCorazon() {
  // Colores variados
  const colores = ["#ff0015ff", "#ff0080ff", "#ff003cff", "#ea00ffff"];
  const color = colores[Math.floor(Math.random()*colores.length)];
  // Corazones más esparcidos por toda la pantalla
  const x = Math.random() * bgCanvas.width;
  const y = bgCanvas.height - 40;
  const size = 18 + Math.random()*16;
  const speed = 1.1 + Math.random()*1.5;
  const dx = (Math.random()-0.5)*1.8;
  const curve = (Math.random()-0.5)*0.012;
  corazones.push({
    x,
    y,
    size,
    speed,
    dx,
    alpha: 1,
    rot: (Math.random()-0.5)*0.7,
    color,
    curve,
    t: 0
  });
}

function dibujarCorazon(x, y, size, alpha=1, rot=0, color="#e63946") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size/2, -size/2, -size, size/3, 0, size);
  ctx.bezierCurveTo(size, size/3, size/2, -size/2, 0, 0);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
}

// Partículas de brillo
const brillos = [];
function crearBrillo() {
  for (let i=0; i<8; i++) {
    brillos.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height * 0.7 + bgCanvas.height * 0.15,
      r: 1 + Math.random()*2.5,
      alpha: 0.7 + Math.random()*0.3,
      vy: -0.5 - Math.random()*1.2,
      life: 40 + Math.random()*30
    });
  }
}
function dibujarBrillos() {
  for (let i=brillos.length-1; i>=0; i--) {
    const b = brillos[i];
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, 2*Math.PI);
    ctx.fillStyle = "#df5dadff";
    ctx.shadowColor = "#fffbe8";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
    b.y += b.vy;
    b.alpha -= 0.012;
    b.life--;
    if (b.life <= 0 || b.alpha <= 0) brillos.splice(i,1);
  }
}

// Utilidad para leer parámetros de consulta
function getQueryParams() {
  const params = {};
  window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
    params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
  });
  return params;
}

let para = "Fiorella J. Retamozo Ramirez."; // valor por defecto
let mensaje = `Mi Pinckychita, no sabes cómo quisiera estar en estos momentos a tu lado y lo lamento mucho.  A pesar de tantas cosas que están sucediendo y la distancia, no me impide poder expresarme por este medio. Me inspiré y programé esta carta, de uno de tus videojuego favoritos, Audition.

Nunca te digo cosas bonitas cuando estamos juntos, pero te aseguro que no es porque yo no quiera, pues siempre que estoy contigo termino poniéndome nervioso y me olvido.

Bueno, quiero que sepas que me siento muy afortunado el poder haberte conocido. Sabes que soy una persona que no cree en muchas cosas, pero siempre he creído en el destino y creo que nuestro amor no fue una simple casualidad.

A pesar que ahora no estamos juntos, quiero que sepas que la Distancia nunca me ha hecho olvidar lo mucho que te Quiero. Sé que últimamente no hablamos muy seguido como antes, pero ambos sabemos el porqué. Pero mi silencio no significa que he dejado de pensar en Ti, es todo lo contrario, extraño mucho tus mensajes, llamadas y fotitos que siempre me dan alegría y hacen pensar que te tengo a mi lado.

Te lo dije antes y te lo volveré a decir, eres lo más hermoso que me ha pasado en la Vida. Contigo pude conocer lo que es el amor por primera vez, contigo hice y sigo haciendo muchas cosas por primera vez (como ahora, escribir una carta). 

Gracias por llegar a mi vida y hacerme tan feliz. Gracias por ser mi amiga, confidente y mi amor. Gracias por darle sentido a mi vida. 
Desde el fondo de mi corazón, te amo y amaré por siempre…

❤️
Psdt. (Es la primera vez que escribo una carta de amor)`;

 
let mostrarMensaje = false;
let mensajeAnim = {
  texto: "",
  idx: 0,
  timer: null,
  velocidad: 70 // ms por letra (antes 28)
};
let loadingText = "Para ti Pinky"; // valor por defecto para loading

// --- Papel 3D DOM y animación ---
const papel3d = document.getElementById('papel3d');
const papelMsg = document.getElementById('papelMsg');

// Actualiza el mensaje animado en el papel3d
function updatePapelMsg() {
  papelMsg.textContent = mensajeAnim.texto || "";
}

// Posiciona y escala el papel3d centrado sobre el canvas
function positionPapel3d() {
  // Centrar absolutamente en la ventana, vertical y horizontal
  papel3d.style.position = "fixed";
  papel3d.style.left = "50%";
  papel3d.style.top = "50%";
  // SOLO modificar scale/rotate, NO el translate
  // NO poner width ni height aquí, deja que el CSS lo controle
  papel3d.style.transform = "translate(-50%, -50%)";
}
window.addEventListener('resize', positionPapel3d);

// Modificar iniciarAnimMensaje para actualizar el papel3d
function iniciarAnimMensaje() {
  mensajeAnim.texto = "";
  mensajeAnim.idx = 0;
  updatePapelMsg();
  if (mensajeAnim.timer) clearInterval(mensajeAnim.timer);
  mensajeAnim.timer = setInterval(() => {
    if (mensajeAnim.idx < mensaje.length) {
      mensajeAnim.texto += mensaje[mensajeAnim.idx];
      mensajeAnim.idx++;
      updatePapelMsg();
    } else {
      clearInterval(mensajeAnim.timer);
    }
  }, mensajeAnim.velocidad);
}

// Mostrar el papel3d con animación de desdoblado 3D y brillo
function mostrarPapel3d() {
  positionPapel3d();
  papel3d.classList.add('visible');
  // Estado inicial: doblado y pequeño
  gsap.set(papel3d, {
    opacity: 0,
    scaleX: 0.7,
    scaleY: 0.1,
    rotateX: 80,
    filter: "brightness(1.2) drop-shadow(0 0 32px #fffbe8cc)"
  });
  // Animación de desdoblado con rebote y brillo
  gsap.to(papel3d, {
    opacity: 1,
    scaleX: 1.18,
    scaleY: 1.05,
    rotateX: -8,
    filter: "brightness(1.25) drop-shadow(0 0 48px #fffbe8cc)",
    duration: 0.7,
    ease: "power4.out",
    onComplete: () => {
      // Rebote y relajación final
      gsap.to(papel3d, {
        scaleX: 1,
        scaleY: 1,
        rotateX: 0,
        filter: "brightness(1) drop-shadow(0 0 0px #fffbe800)",
        duration: 0.7,
        ease: "elastic.out(1, 0.5)"
      });
    }
  });
}

// Ocultar el papel3d con animación inversa
function ocultarPapel3d() {
  gsap.to(papel3d, {
    opacity: 0,
    scaleX: 0.7,
    scaleY: 0.1,
    rotateX: 80,
    filter: "brightness(1.2) drop-shadow(0 0 32px #fffbe8cc)",
    duration: 0.6,
    ease: "power2.in",
    onComplete: () => {
      papel3d.classList.remove('visible');
      papelMsg.textContent = "";
    }
  });
}

// --- Destello animado en el borde dorado ---
let destello = {
  t: 0,
  active: false
};

function dibujarCarta() {
  // Sombra y brillo al abrir
  ctx.save();
  ctx.shadowColor = "#b5838d";
  ctx.shadowBlur = 18 * (1-carta.openProgress);
  ctx.fillStyle = "#fff";
  ctx.fillRect(carta.x+8, carta.y+8, carta.w, carta.h);
  if (carta.openProgress > 0.95) {
    // Efecto de brillo
    ctx.globalAlpha = (carta.openProgress-0.95)/0.05 * 0.5;
    ctx.fillStyle = "#fffbe8";
    ctx.beginPath();
    ctx.ellipse(carta.x + carta.w/2, carta.y + carta.h/2, carta.w/2, carta.h/3, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // Cuerpo de la carta con borde blanco
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff"; // <-- borde blanco
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.rect(carta.x, carta.y, carta.w, carta.h);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // --- Detalles "Para:" y "De:" en el sobre ---
  if (carta.openProgress < 0.2) {
    ctx.save();
    ctx.font = "bold 1.05rem 'Montserrat', sans-serif";
    ctx.fillStyle = "#b5838d";
    ctx.globalAlpha = 0.85;
    // "Para:"
    ctx.textAlign = "left";
    ctx.fillText("Para:", carta.x + 18, carta.y + 32);
    ctx.font = "normal 1rem 'Pacifico', cursive";
    ctx.fillText(para ? para : "La mujer mas hermosa", carta.x + 70, carta.y + 32);
    ctx.restore();
  }

  // --- Destello animado en el borde dorado ---
  ctx.save();
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.rect(carta.x, carta.y, carta.w, carta.h);
  ctx.stroke();

  // Destello
  if (destello.active) {
    const t = destello.t;
    const len = 2*(carta.w + carta.h);
    const pos = (t % 1) * len;
    ctx.save();
    ctx.strokeStyle = ctx.createLinearGradient(
      carta.x, carta.y, carta.x + carta.w, carta.y + carta.h
    );
    ctx.shadowColor = "#fffbe8";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    // Recorrer el borde y dibujar un segmento brillante
    let p = pos;
    for (let i = 0; i < 1; i += 0.25) {
      let seg = Math.min(40, len - p);
      if (p < carta.w) {
        ctx.moveTo(carta.x + p, carta.y);
        ctx.lineTo(carta.x + Math.min(carta.w, p + seg), carta.y);
      } else if (p < carta.w + carta.h) {
        ctx.moveTo(carta.x + carta.w, carta.y + (p - carta.w));
        ctx.lineTo(carta.x + carta.w, carta.y + Math.min(carta.h, p - carta.w + seg));
      } else if (p < 2 * carta.w + carta.h) {
        ctx.moveTo(carta.x + carta.w - (p - carta.w - carta.h), carta.y + carta.h);
        ctx.lineTo(carta.x + carta.w - Math.min(carta.w, p - carta.w - carta.h + seg), carta.y + carta.h);
      } else {
        ctx.moveTo(carta.x, carta.y + carta.h - (p - 2 * carta.w - carta.h));
        ctx.lineTo(carta.x, carta.y + carta.h - Math.min(carta.h, p - 2 * carta.w - carta.h + seg));
      }
      p += 60;
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  // Líneas decorativas
  // Elimina la rayita inferior
  /*
  ctx.save();
  ctx.strokeStyle = "#f9c6d1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(carta.x+20, carta.y+carta.h-20);
  ctx.lineTo(carta.x+carta.w-20, carta.y+carta.h-20);
  ctx.stroke();
  ctx.restore();
  */

  // Sello de corazón
  ctx.save();
  ctx.globalAlpha = 0.7;
  dibujarCorazon(carta.x + carta.w - 36, carta.y + carta.h - 36, 22, 1, 0, "#e63946");
  ctx.restore();

  // Flap (tapa) animada con rebote
  ctx.save();
  ctx.translate(carta.x + carta.w/2, carta.y);
  let flapAngle = -Math.PI/2 * carta.openProgress + carta.bounce;
  ctx.rotate(flapAngle);
  ctx.beginPath();
  ctx.moveTo(-carta.w/2, 0);
  ctx.lineTo(0, -carta.flapHeight);
  ctx.lineTo(carta.w/2, 0);
  ctx.closePath();
  ctx.fillStyle = "#f9c6d1";
  ctx.strokeStyle = "#b5838d";
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Papel interior animado y adaptativo
  if (carta.openProgress > 0.7) {
    ctx.save();
    let slide = Math.min(1, (carta.openProgress-0.7)/0.3);
    ctx.globalAlpha = slide;
    ctx.fillStyle = "#fffbe8";
    ctx.strokeStyle = "#b5838d";
    ctx.lineWidth = 1.5;

    // --- Papel más ancho en mobile ---
    let paperOverflow;
    if (window.innerWidth <= 900) {
      // En mobile, sobresale aún más (ajusta el valor si quieres más ancho)
      paperOverflow = carta.w * 1.1;
    } else {
      // En desktop, sobresale moderadamente
      paperOverflow = carta.w * 0.55;
    }
    const paperMarginY = 18;
    const paperX = carta.x - paperOverflow / 2;
    const paperY = carta.y + paperMarginY;
    const paperW = carta.w + paperOverflow;
    const paperH = carta.h - paperMarginY * 2;

    // Determinar el tamaño de fuente ideal para que quepa todo el texto
    let fontSize = 30;
    let minFontSize = 13;
    let lineHeight = fontSize * 1.2;
    let lines = [];
    let words = mensaje.split(' ');

    // Función para calcular líneas con un tamaño de fuente dado
    function getLines(fontSizeTry) {
      ctx.font = `bold ${fontSizeTry}px 'Pacifico', cursive`;
      let lh = fontSizeTry * 1.2;
      let tempLines = [];
      let currentLine = "";
      for (let i = 0; i < words.length; i++) {
        let testLine = currentLine + (currentLine ? " " : "") + words[i];
        let testWidth = ctx.measureText(testLine).width;
        if (testWidth > paperW - 24 && currentLine) {
          tempLines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) tempLines.push(currentLine);
      return { tempLines, lh };
    }

    // Reduce el tamaño de fuente hasta que quepa todo el texto
    while (true) {
      let { tempLines, lh } = getLines(fontSize);
      if (tempLines.length * lh + 40 <= paperH || fontSize <= minFontSize) {
        lines = tempLines;
        lineHeight = lh;
        break;
      }
      fontSize -= 2;
    }

    // Centrar verticalmente el papel
    let realPaperH = lines.length * lineHeight + 40;
    let offsetY = paperY + (paperH - realPaperH) / 2;

    ctx.beginPath();
    ctx.rect(paperX, offsetY, paperW, realPaperH);
    ctx.fill();
    ctx.stroke();

    // Dibuja el texto línea por línea centrado
    ctx.font = `bold ${fontSize}px 'Pacifico', cursive`;
    ctx.fillStyle = "#b5838d";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], paperX + paperW / 2, offsetY + 20 + i * lineHeight);
    }
    ctx.restore();
  }

  dibujarConfeti();
}

// Dibuja corazones en el fondo
function dibujarCorazonesBg() {
  for (let i = corazones.length-1; i >= 0; i--) {
    const c = corazones[i];
    c.t += 1;
    c.y -= c.speed;
    c.x += c.dx + Math.sin(c.t*0.04)*c.curve*80;
    c.alpha -= 0.0009;
    dibujarCorazonBg(c.x, c.y, c.size, c.alpha, c.rot, c.color);
    if (c.alpha <= 0) corazones.splice(i, 1);
  }
}
function dibujarCorazonBg(x, y, size, alpha=1, rot=0, color="#e63946") {
  bgCtx.save();
  bgCtx.translate(x, y);
  bgCtx.rotate(rot);
  bgCtx.globalAlpha = alpha;
  bgCtx.beginPath();
  bgCtx.moveTo(0, 0);
  bgCtx.bezierCurveTo(-size/2, -size/2, -size, size/3, 0, size);
  bgCtx.bezierCurveTo(size, size/3, size/2, -size/2, 0, 0);
  bgCtx.fillStyle = color;
  bgCtx.shadowColor = color;
  bgCtx.shadowBlur = 10;
  bgCtx.fill();
  bgCtx.globalAlpha = 1;
  bgCtx.shadowBlur = 0;
  bgCtx.restore();
}

// Dibuja brillos en el fondo
function dibujarBrillosBg() {
  for (let i=brillos.length-1; i>=0; i--) {
    const b = brillos[i];
    bgCtx.save();
    bgCtx.globalAlpha = b.alpha;
    bgCtx.beginPath();
    bgCtx.arc(b.x, b.y, b.r, 0, 2*Math.PI);
    bgCtx.fillStyle = "#fffbe8";
    bgCtx.shadowColor = "#fffbe8";
    bgCtx.shadowBlur = 12;
    bgCtx.fill();
    bgCtx.restore();
    b.y += b.vy;
    b.alpha -= 0.012;
    b.life--;
    if (b.life <= 0 || b.alpha <= 0) brillos.splice(i,1);
  }
}

function animar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  dibujarCarta();

  // --- Destello animado en el borde dorado ---
  if (destello.active) {
    destello.t += 0.018;
    if (destello.t > 1.2) destello.active = false;
  }

  requestAnimationFrame(animar);
}

// --- NUEVO: Animación de fondo ---
function animarBg() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  if (carta.openProgress > 0.7) {
    if (Math.random() < 0.05) crearCorazon();
  }
  dibujarCorazonesBg();
  dibujarBrillosBg();
  requestAnimationFrame(animarBg);
}
animarBg();

// Confeti animado
const confetis = [];
function lanzarConfeti() {
  const colores = ["#e63946", "#ffb4d9", "#ff6f91", "#ffb3c6", "#ffd700", "#b5838d", "#fffbe8"];
  for (let i = 0; i < 32; i++) {
    confetis.push({
      x: carta.x + carta.w/2,
      y: carta.y + carta.h/2,
      r: 6 + Math.random()*6,
      color: colores[Math.floor(Math.random()*colores.length)],
      vx: (Math.random()-0.5)*7,
      vy: -4 - Math.random()*5,
      ay: 0.18 + Math.random()*0.08,
      rot: Math.random()*Math.PI*2,
      vr: (Math.random()-0.5)*0.2,
      alpha: 1
    });
  }
}
function dibujarConfeti() {
  for (let i = confetis.length-1; i >= 0; i--) {
    const c = confetis[i];
    ctx.save();
    ctx.globalAlpha = c.alpha;
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, c.r, c.r*0.5, 0, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
    c.x += c.vx;
    c.y += c.vy;
    c.vy += c.ay;
    c.rot += c.vr;
    c.alpha -= 0.008;
    if (c.alpha <= 0 || c.y > canvas.height+40) confetis.splice(i, 1);
  }
}

// Referencia al fondo animado
const bgFade = document.getElementById('bgFade');

// Agrandar carta y blur fondo al abrir
function abrirCarta() {
  if (carta.opening) return;
  carta.opening = true;
  document.getElementById('subtitle').style.opacity = 0;
  document.getElementById('openSound').currentTime = 0;
  document.getElementById('openSound').play();
  // --- Música de fondo ---
  const bgMusic = document.getElementById('bgMusic');
  bgMusic.currentTime = 0;
  bgMusic.volume = 0.18; // antes 0.45
  bgMusic.play().catch(()=>{});
  document.body.classList.add('blurred');
  // Fondo animado: transición a negro
  if (bgFade) bgFade.classList.add('bg-fade-dark');
  // Elimina la clase bg-open del body (ya no se usa para fondo)
  document.body.classList.remove('bg-open');
  canvas.classList.add('enlarged');
  // Cambia el fondo del canvas a negro
  canvas.style.background = "radial-gradient(circle at 60% 40%, #161616 60%, #000 100%)";
  lanzarConfeti();
  destello.active = true;
  destello.t = 0;
  gsap.to(carta, {
    openProgress: 1,
    duration: 1.1,
    ease: "elastic.out(1, 0.7)",
    onUpdate: () => {
      if (carta.openProgress > 0.7 && brillos.length < 8) crearBrillo();
      setCarta3D(carta.openProgress);
      // Mostrar papel3d cuando la carta esté suficientemente abierta
      if (carta.openProgress > 0.82 && !papel3d.classList.contains('visible')) {
        mostrarPapel3d();
      }
    },
    onComplete: () => {
      mostrarMensaje = true;
      iniciarAnimMensaje();
      // Animar botones
      gsap.to('#closeBtn', { opacity: 1, scale: 1, pointerEvents: 'auto', duration: 0.5, delay: 0.1 });
      gsap.to('#downloadBtn', { opacity: 1, scale: 1, pointerEvents: 'auto', duration: 0.5, delay: 0.2 });
      document.getElementById('closeBtn').classList.add('visible');
      document.getElementById('downloadBtn').classList.add('visible');
      // Animar firma
      gsap.to('.firma', { opacity: 1, y: 0, duration: 1, ease: "power2.out" });
    }
  });
  gsap.to("#cartaCanvas", { y: 0, duration: 0.2 });
}

// Restaurar tamaño y fondo al cerrar
function cerrarCarta() {
  if (!carta.opening) return;
  // --- Pausar música de fondo ---
  const bgMusic = document.getElementById('bgMusic');
  bgMusic.pause();
  gsap.to('#closeBtn', { opacity: 0, scale: 0.8, pointerEvents: 'none', duration: 0.4 });
  gsap.to('#downloadBtn', { opacity: 0, scale: 0.8, pointerEvents: 'none', duration: 0.4 });
  document.getElementById('closeBtn').classList.remove('visible');
  document.getElementById('downloadBtn').classList.remove('visible');
  document.body.classList.remove('blurred');
  // Fondo animado: transición a rosado
  if (bgFade) bgFade.classList.remove('bg-fade-dark');
  // Elimina la clase bg-open del body (ya no se usa para fondo)
  document.body.classList.remove('bg-open');
  canvas.classList.remove('enlarged');
  // Restaura el fondo del canvas a blanco
  canvas.style.background = "radial-gradient(circle at 60% 40%, #fff 60%, #fff 100%)";
  mostrarMensaje = false;
  if (mensajeAnim.timer) clearInterval(mensajeAnim.timer);
  const closeSound = document.getElementById('closeSound');
  closeSound.currentTime = 0.18;
  closeSound.volume = 0.23;
  closeSound.play();
  ocultarPapel3d();
  gsap.to(carta, {
    openProgress: 0,
    duration: 0.7,
    ease: "power2.inOut",
    onUpdate: () => {
      setCarta3D(carta.openProgress);
    },
    onComplete: () => {
      carta.opening = false;
      document.getElementById('subtitle').style.opacity = 1;
      // Animar firma fuera
      gsap.to('.firma', { opacity: 0.7, y: 18, duration: 0.7, ease: "power2.in" });
    }
  });
  gsap.to("#cartaCanvas", { y: 0, duration: 0.2 });
  setTimeout(animarBounceSobre, 900);
}

// Descargar carta como imagen con feedback visual
document.getElementById('downloadBtn').addEventListener('click', () => {
  setTimeout(() => {
    const link = document.createElement('a');
    link.download = 'carta.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    // Mostrar mensaje de descargado con animación
    const msg = document.getElementById('downloadMsg');
    gsap.to(msg, { opacity: 1, scale: 1.1, duration: 0.3 });
    setTimeout(() => {
      gsap.to(msg, { opacity: 0, scale: 1, duration: 0.5 });
    }, 1300);
    // Efecto de partículas al descargar
    lanzarConfeti();
  }, 200);
});

// Responsive canvas
function resizeCanvas() {
  const ratio = 5/4;
  let w = Math.min(window.innerWidth * 0.95, 600);
  let h = w / ratio;
  if (h > window.innerHeight * 0.8) {
    h = window.innerHeight * 0.8;
    w = h * ratio;
  }
  canvas.width = w;
  canvas.height = h;
  carta.x = w*0.2;
  carta.y = h*0.25;
  carta.w = w*0.6;
  carta.h = h*0.45;
  carta.flapHeight = carta.h*0.33;
  // Ajusta el canvas de fondo
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

canvas.addEventListener('click', abrirCarta);
document.getElementById('closeBtn').addEventListener('click', cerrarCarta);

// Animación hover sobre la carta
canvas.addEventListener('mouseenter', () => {
  if (!carta.opening && carta.openProgress === 0) {
    gsap.to(canvas, {
      scale: 1.08,
      rotate: -4,
      boxShadow: "0 24px 64px 0 rgba(230,57,70,0.22), 0 0 0 16px #fffbe8",
      filter: "brightness(1.08) drop-shadow(0 0 24px #ffd70055)",
      duration: 0.32,
      ease: "power2.out"
    });
  }
});
canvas.addEventListener('mouseleave', () => {
  if (!carta.opening && carta.openProgress === 0) {
    gsap.to(canvas, {
      scale: 1,
      rotate: 0,
      boxShadow: "0 16px 48px 0 rgba(230,57,70,0.22), 0 0 0 12px #fffbe8, 0 2px 32px 0 rgba(181,131,141,0.10), 0 0 32px 0 #ffd70033",
      filter: "drop-shadow(0 8px 32px #b5838d44)",
      duration: 0.32,
      ease: "power2.in"
    });
  }
});

animar();

// --- Animación de rebote para llamar la atención ---
function animarBounceSobre() {
  if (!carta.opening && carta.openProgress === 0) {
    gsap.to("#cartaCanvas", {
      y: -18,
      duration: 0.38,
      ease: "power1.inOut",
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        setTimeout(animarBounceSobre, 1200);
      }
    });
  } else {
    gsap.to("#cartaCanvas", { y: 0, duration: 0.2 });
  }
}

// --- Animación de rebote inicial llamativa ---
function animarBounceInicial() {
  gsap.fromTo(
    "#cartaCanvas",
    { y: -24, scale: 1 },
    {
      y: 0,
      scale: 1.08,
      duration: 0.45,
      ease: "bounce.out",
      repeat: 2,
      yoyo: true,
      onComplete: () => {
        animarBounceSobre(); // Luego sigue el rebote suave normal
      }
    }
  );
}

window.addEventListener('DOMContentLoaded', () => {
  // --- Leer parámetros de consulta una sola vez ---
  const params = getQueryParams();
  if (params.para) {
    para = params.para;
  }
  if (params.mensaje) {
    mensaje = params.mensaje;
  }
  if (params.firma) {
    const firmaEl = document.querySelector('.firma');
    if (firmaEl) firmaEl.textContent = params.firma;
  }
  // Loading SOLO usa el parámetro loading, si no, SIEMPRE el valor por defecto
  if (params.loading) {
    loadingText = params.loading;
  } else {
    loadingText = "Para ti Pinky❤️";
  }

  setCarta3D(0);
  gsap.set('.firma', { opacity: 0.7, y: 18 });
  positionPapel3d();
  if (isMobile()) {
    document.getElementById('subtitle').textContent = "Toca la carta para abrirla";
  }
  // Mostrar loading y ocultar carta hasta terminar
  const loading = document.getElementById('loadingMama');
  const cartaCanvas = document.getElementById('cartaCanvas');
  // Reinicia animación del corazón SVG
  const heartPath = document.getElementById('loadingHeartPath');
  if (heartPath) {
    heartPath.style.animation = 'none';
    // Forzar reflow para reiniciar animación
    void heartPath.offsetWidth;
    heartPath.style.animation = '';
  }
  cartaCanvas.style.visibility = 'hidden';

  // Animación de tipeo para loadingText (personalizable)
  const loadingSpan = loading ? loading.querySelector('span') : null;
  if (loadingSpan) {
    loadingSpan.textContent = "";
    let idx = 0;
    const typeInterval = 70;
    const typeWriter = setInterval(() => {
      loadingSpan.textContent = loadingText.slice(0, idx + 1);
      idx++;
      if (idx === loadingText.length) clearInterval(typeWriter);
    }, typeInterval);
  }

  setTimeout(() => {
    if (loading) loading.classList.add('hide');
    cartaCanvas.style.visibility = '';
    animarBounceInicial(); // <-- Inicia rebote llamativo al mostrar la carta
  }, 2400); // antes 1700
});

// --- Asegura que el rebote empiece siempre, incluso si la animación de entrada no se ejecuta ---
animarBounceSobre();

// --- 3D carta: animación de rotación y profundidad ---
function setCarta3D(progress) {
  // progress: 0 (cerrada) a 1 (abierta)
  const cartaEl = document.getElementById('cartaCanvas');
  const rotY = -10 + 20 * progress; // de -10deg a +10deg
  const rotX = -18 + 30 * progress; // de -18deg a +12deg
  cartaEl.style.transform = `perspective(900px) scale(${progress > 0.7 ? 1.18 : 1}) rotateY(${rotY}deg) rotateX(${rotX}deg)`;
  cartaEl.style.boxShadow = progress > 0.7
    ? "0 24px 64px 0 rgba(230,57,70,0.22), 0 0 0 12px #fffbe8"
    : "0 8px 32px rgba(0,0,0,0.18)";
}

// Animación de entrada de la carta
gsap.fromTo(
  "#cartaCanvas",
  { y: -120, opacity: 0 },
  { y: 0, opacity: 1, duration: 1.2, ease: "bounce.out", delay: 0.2,
    onComplete: animarBounceSobre // Iniciar rebote después de la entrada
  }
);

// Tooltip en botón cerrar (ya está en CSS, solo para touch)
const closeBtn = document.getElementById('closeBtn');
const closeTooltip = document.getElementById('closeTooltip');
closeBtn.addEventListener('touchstart', () => {
  closeTooltip.style.visibility = 'visible';
  closeTooltip.style.opacity = '1';
});
closeBtn.addEventListener('touchend', () => {
  setTimeout(() => {
    closeTooltip.style.visibility = '';
    closeTooltip.style.opacity = '';
  }, 800);
});

// Accesibilidad: abrir/cerrar con teclado
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    if (!carta.opening) abrirCarta();
    else if (mostrarMensaje) cerrarCarta();
  }
  if (e.code === 'Escape' && carta.opening && mostrarMensaje) cerrarCarta();
});

// Instrucción móvil
function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}