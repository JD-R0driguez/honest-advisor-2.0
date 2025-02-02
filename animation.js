const TARGET_X = window.innerWidth / 2;
const TARGET_Y = window.innerHeight / 1.9;

let width, height, largeHeader, canvas, ctx;
let target = { x: TARGET_X, y: TARGET_Y };
let animateHeader = true;


document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initAnimation();
  addListeners();
});


function initHeader() {

    largeHeader = document.getElementById("large-header");
    canvas = document.getElementById("demo-canvas");

    width = window.innerWidth;
    height = window.innerHeight;

    // Make the container and canvas fill the screen
    largeHeader.style.width = width + 'px';
    largeHeader.style.height = height + 'px';
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');

    createGridPoints();
}

function createGridPoints() {
    const xSpacing = width / 40;
    const ySpacing = height / 40;
    points = [];
    for (let x = 0; x < width; x += xSpacing) {
        for (let y = 0; y < height; y += ySpacing) {
            const p = { x: x, originX: x, y: y, originY: y };
            points.push(p);
        }
    }

    // For each point, find the 2 closest neighbor
    for (let i = 0; i < points.length; i++) {
        let p1 = points[i];
        let closest = null;
        for (let j = 0; j < points.length; j++) {
            if (j === i) continue;
            let p2 = points[j];
            if (closest === null || getDistance(p1, p2) < getDistance(p1, closest)) {
                closest = p2;
            }
        }
        p1.closest = [closest];
        }
        
    for (let i in points) {
        const c = new Circle(points[i], 2 + Math.random() * 2);
        points[i].circle = c;
    }
}


function getDistance(p1, p2) {
    return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}


function initAnimation() {
    animate();
    for (let i in points) {
        shiftPoint(points[i]);
    }
}

function addListeners() {
    window.addEventListener('scroll', scrollCheck);
    window.addEventListener('resize', resize);
}
  

function scrollCheck() {
    animateHeader = (document.body.scrollTop <= height);
}
  

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    largeHeader.style.width = width + 'px';
    largeHeader.style.height = height + 'px';
    canvas.width = width;
    canvas.height = height;
  
    target.x = width / 2;
    target.y = height / 1.9;
}


function animate() {
  if (animateHeader) {
    ctx.clearRect(0, 0, width, height);

    for (let i in points) {
        let p = points[i];
        let distSq = getDistance(target, p);

        if (distSq < 4000) {
            p.active = 0.3;
            p.circle.active = 0.6;
        } else if (distSq < 20000) {
            p.active = 0.1;
            p.circle.active = 0.3;
        } else if (distSq < 40000) {
            p.active = 0.02;
            p.circle.active = 0.1;
        } else {
            p.active = 0;
            p.circle.active = 0;
        }

        drawLines(p);
        p.circle.draw();
    }
  }
  requestAnimationFrame(animate);
}


// Animate each point's location in a slow drifting manner
function shiftPoint(p) {
    const duration = 3 + Math.random(); 
    const offsetX = -50 + Math.random() * 100;
    const offsetY = -50 + Math.random() * 100;

    const newX = p.originX + offsetX;
    const newY = p.originY + offsetY;

    const steps = Math.floor(60 * duration);
    let currentStep = 0;
    const startX = p.x;
    const startY = p.y;

    function step() {
        currentStep++;
        p.x = startX + ((newX - startX) * currentStep / steps);
        p.y = startY + ((newY - startY) * currentStep / steps);

        if (currentStep < steps) {
        requestAnimationFrame(step);
        } else {
        setTimeout(() => shiftPoint(p), 0);
        }
    }
    step();
}


function drawLines(p) {
    if (!p.active) return;
    ctx.beginPath();
    for (let c of p.closest) {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(c.x, c.y);
    }
    ctx.strokeStyle = `rgba(156, 217, 249, ${p.active})`;
    ctx.stroke();
}


class Circle {
    constructor(pos, rad) {
        this.pos = pos;
        this.radius = rad;
        this.active = 0;
    }
    draw() {
        if (!this.active) return;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = `rgba(156, 217, 249, ${this.active})`;
        ctx.fill();
    }
}


