// ============================================
// VISUALS MODULE (visuals.js) - MURMURATION EDITION
// ============================================

let foodParticles = [];
window.feedingActive = false;
let eatenFoodCount = 0;
let totalFoodCount = 0;
let bloatFactor = 1.0; 

// Palette Access
window.curPalette = { pri: {r:255, g:115, b:0}, sec: {r:200, g:100, b:50}, conn: {r:255, g:160, b:0} };

// Interaction State
let indicesList = ["SYSTEM", "READY", "FLOCK", "SYNC", "VOID"];
window.updateKeywords = (newList) => { if(newList && newList.length > 0) indicesList = newList; };
window.activeChord = []; // Stores target points for mouth shapes
window.currentIntensity = 1.0;

// --- BOIDS CONFIGURATION ---
const BOID_COUNT = 400; // Number of "starlings"
const VISUAL_RANGE = 80;
const PROTECTED_RANGE = 20;
const CENTERING_FACTOR = 0.0005;
const AVOID_FACTOR = 0.05;
const MATCH_FACTOR = 0.05;
const COHERE_FACTOR = 0.0005;
const MAX_SPEED = 6;
const MIN_SPEED = 3;

// --- 3D UTILS ---
class Vector3 {
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    add(v) { this.x+=v.x; this.y+=v.y; this.z+=v.z; }
    sub(v) { this.x-=v.x; this.y-=v.y; this.z-=v.z; }
    mult(n) { this.x*=n; this.y*=n; this.z*=n; }
    mag() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
    normalize() { const m = this.mag(); if(m>0) this.mult(1/m); }
    limit(max) { if(this.mag() > max) { this.normalize(); this.mult(max); } }
}

class Boid {
    constructor(w, h) {
        // Random start position within a sphere
        const r = Math.random() * 200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        this.pos = new Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        this.vel = new Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
        this.vel.normalize(); 
        this.vel.mult(MAX_SPEED);
    }

    update(boids, width, height) {
        let close_dx = 0, close_dy = 0, close_dz = 0;
        let xvel_avg = 0, yvel_avg = 0, zvel_avg = 0;
        let xpos_avg = 0, ypos_avg = 0, zpos_avg = 0;
        let neighbors = 0;

        // 1. FLOCKING ALGORITHMS
        for (let other of boids) {
            if (other === this) continue;
            const dx = this.pos.x - other.pos.x;
            const dy = this.pos.y - other.pos.y;
            const dz = this.pos.z - other.pos.z;
            const distSq = dx*dx + dy*dy + dz*dz;

            if (distSq < VISUAL_RANGE * VISUAL_RANGE) {
                // Separation
                if (distSq < PROTECTED_RANGE * PROTECTED_RANGE) {
                    close_dx += dx;
                    close_dy += dy;
                    close_dz += dz;
                }
                // Alignment & Cohesion data gathering
                xvel_avg += other.vel.x;
                yvel_avg += other.vel.y;
                zvel_avg += other.vel.z;
                xpos_avg += other.pos.x;
                ypos_avg += other.pos.y;
                zpos_avg += other.pos.z;
                neighbors++;
            }
        }

        // Apply Flocking Forces
        if (neighbors > 0) {
            xvel_avg /= neighbors; yvel_avg /= neighbors; zvel_avg /= neighbors;
            xpos_avg /= neighbors; ypos_avg /= neighbors; zpos_avg /= neighbors;

            // Alignment
            this.vel.x += (xvel_avg - this.vel.x) * MATCH_FACTOR;
            this.vel.y += (yvel_avg - this.vel.y) * MATCH_FACTOR;
            this.vel.z += (zvel_avg - this.vel.z) * MATCH_FACTOR;

            // Cohesion
            this.vel.x += (xpos_avg - this.pos.x) * COHERE_FACTOR;
            this.vel.y += (ypos_avg - this.pos.y) * COHERE_FACTOR;
            this.vel.z += (zpos_avg - this.pos.z) * COHERE_FACTOR;
        }

        // Separation
        this.vel.x += close_dx * AVOID_FACTOR;
        this.vel.y += close_dy * AVOID_FACTOR;
        this.vel.z += close_dz * AVOID_FACTOR;

        // 2. INTERACTION (Speaking or Eating)
        // If speaking (activeChord), override cohesion to form the shape
        if (window.activeChord && window.activeChord.length > 0) {
            // Map 2D chord points to 3D target space
            let targetIndex = Math.floor(Math.random() * window.activeChord.length);
            let pt = window.activeChord[targetIndex];
            // Convert 0..1 coord to -Width/2..Width/2
            let tx = (pt.x - 0.5) * (width * 0.5);
            let ty = (pt.y - 0.5) * (height * 0.5);
            
            // Strong pull to target
            this.vel.x += (tx - this.pos.x) * 0.08;
            this.vel.y += (ty - this.pos.y) * 0.08;
            // flatten Z for letters
            this.vel.z += (0 - this.pos.z) * 0.05; 
        } 
        // If feeding, chase the food particles
        else if (window.feedingActive && foodParticles.length > 0) {
             let nearest = null;
             let minD = 999999;
             // Find nearest food (in 2D projection approximate)
             for(let fp of foodParticles) {
                 // Food is 2D, Boid is 3D. We target the food's x,y and z=0
                 let fpx = fp.x - (width/2); // Center relative
                 let fpy = fp.y - (height * 0.35); // Center relative
                 let d = (this.pos.x - fpx)**2 + (this.pos.y - fpy)**2;
                 if(d < minD) { minD = d; nearest = {x:fpx, y:fpy}; }
             }
             if(nearest) {
                 this.vel.x += (nearest.x - this.pos.x) * 0.06;
                 this.vel.y += (nearest.y - this.pos.y) * 0.06;
                 this.vel.z += (0 - this.pos.z) * 0.05; // Dive to surface
             }
        }
        else {
            // Idle Mode: Gentle center pull to keep them on screen
            // Add a little noise for organic "wobble"
            this.vel.x += (Math.random()-0.5) * 0.1;
            this.vel.y += (Math.random()-0.5) * 0.1;
            this.vel.z += (Math.random()-0.5) * 0.1;
            
            this.vel.x += (-this.pos.x) * CENTERING_FACTOR;
            this.vel.y += (-this.pos.y) * CENTERING_FACTOR;
            this.vel.z += (-this.pos.z) * CENTERING_FACTOR;
        }

        // 3. PHYSICS UPDATE
        // Speed Limit
        const speed = this.vel.mag();
        if(speed > MAX_SPEED) { this.vel.normalize(); this.vel.mult(MAX_SPEED); }
        if(speed < MIN_SPEED) { this.vel.normalize(); this.vel.mult(MIN_SPEED); }

        this.pos.add(this.vel);
    }
}

// --- TEXT FEEDING LOGIC ---
window.spawnFoodText = (text) => {
    foodParticles = [];
    eatenFoodCount = 0;
    const chars = text.split('');
    totalFoodCount = chars.length;
    window.feedingActive = true;
    bloatFactor = 1.0; 

    const canvas = document.getElementById('symbiosisCanvas');
    const width = canvas.width;
    const height = canvas.height;
    const startY = height + 50; 
    const spread = Math.min(width * 0.9, chars.length * 40); 
    const startX = (width - spread) / 2;

    chars.forEach((char, i) => {
        foodParticles.push({
            char: char,
            x: startX + (i * (spread / chars.length)) + (Math.random()-0.5)*50, 
            y: startY + (Math.random() * 100),
            vx: (Math.random() - 0.5) * 2,  
            vy: -4 - Math.random() * 4, // Floating up
            active: true
        });
    });
};

// --- AUDIO SYNC STUB ---
// (We keep this compatible so main.js doesn't break, 
// but the visuals are now driven by activeChord in the boid loop)
window.speak = function(text) {
    // Standard routine from original code
    window.feedingActive = false; eatenFoodCount = 0; totalFoodCount = 0;
    window.initAudio(); window.startBreathStream();
    const subtitleMask = document.getElementById('subtitle-mask');
    const subtitleTrack = document.getElementById('subtitle-track');
    subtitleTrack.innerHTML = ''; subtitleMask.style.opacity = '1';
    subtitleTrack.style.transform = 'translateX(0px)';
    const words = text.split(" ");
    const spans = [];
    words.forEach(word => {
        const s = document.createElement('span'); s.textContent = word; s.className = 'char-span'; 
        subtitleTrack.appendChild(s); spans.push(s);
    });
    
    let wordIndex = 0;
    const moodData = window.MOOD_AUDIO[window.glitchMode ? "GLITCH" : window.currentMood] || window.MOOD_AUDIO["NEUTRAL"];
    const speedMod = moodData.speed;

    function playNextWord() {
        if(wordIndex >= words.length) {
            window.activeChord=[]; window.stopBreathStream(); 
            setTimeout(() => { subtitleMask.style.opacity='0'; setTimeout(()=>subtitleTrack.innerHTML='', 1000); }, 100); 
            return;
        }
        if(wordIndex > 0) spans[wordIndex-1].classList.remove('active');
        spans[wordIndex].classList.add('active');
        const spanCenter = spans[wordIndex].offsetLeft + (spans[wordIndex].offsetWidth / 2);
        subtitleTrack.style.transform = `translateX(${-spanCenter}px)`;
        const chars = words[wordIndex].split('');
        let charIndex = 0;
        function playNextChar() {
            if (charIndex >= chars.length) { wordIndex++; setTimeout(playNextWord, 150 * speedMod); return; }
            const char = chars[charIndex].toUpperCase();
            // This global variable drives the boid attraction in the loop above
            window.activeChord = window.alphabetChords?.[char] || [{x:0.5, y:0.5}];
            window.morphMouthShape(char);
            charIndex++; 
            setTimeout(playNextChar, 80 * speedMod);
        }
        playNextChar();
    }
    playNextWord();
};

// --- MAIN RENDER LOOP ---
window.initSymbiosisAnimation = function() {
    const canvas = document.getElementById('symbiosisCanvas');
    const container = document.getElementById('symbiosis-container');
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    let width, height;

    // Boids Array
    const boids = [];
    for(let i=0; i<BOID_COUNT; i++) boids.push(new Boid());

    function resize() {
        const rect = container.getBoundingClientRect();
        width = rect.width; height = rect.height;
        canvas.width = width; canvas.height = height;
    }
    window.addEventListener('resize', resize); resize();

    function lerpRGB(curr, target, factor) {
        curr.r += (target.r - curr.r) * factor;
        curr.g += (target.g - curr.g) * factor;
        curr.b += (target.b - curr.b) * factor;
    }

    // Camera / Projection vars
    let rotationY = 0; 
    let time = 0;

    function animate() {
        // 1. CLEAR - use trail effect for murmuration smoothness
        // If glitch mode, flash red occasionally
        if(window.glitchMode && Math.random() > 0.8) {
            ctx.fillStyle = `rgba(50, 0, 0, 0.2)`;
            ctx.fillRect(0,0,width,height);
        } else {
            // "Fade out" previous frame to create trails
            ctx.fillStyle = 'rgba(5, 5, 5, 0.25)'; // Higher alpha = shorter trails
            ctx.fillRect(0, 0, width, height);
        }

        // 2. COLOR MANAGEMENT
        let targetSet = window.PALETTES[window.currentMood] || window.PALETTES["NEUTRAL"];
        if (window.glitchMode) targetSet = { pri:{r:255,g:255,b:255}, sec:{r:255,g:0,b:0}, conn:{r:0,g:0,b:0} };
        lerpRGB(window.curPalette.pri, targetSet.pri, 0.05);

        // 3. PROJECTION SETTINGS
        const cx = width / 2;
        const cy = height * 0.35;
        const fov = 600;
        rotationY += 0.003; // Slow camera spin
        time += 0.01;

        // 4. UPDATE & DRAW BOIDS
        boids.forEach(b => {
            b.update(boids, width, height);

            // Project 3D -> 2D
            // Simple Y-rotation for camera
            let x = b.pos.x, y = b.pos.y, z = b.pos.z;
            let x1 = x * Math.cos(rotationY) - z * Math.sin(rotationY);
            let z1 = z * Math.cos(rotationY) + x * Math.sin(rotationY);
            
            // Perspective scale
            let scale = fov / (fov + z1 + 400); 
            let px = cx + x1 * scale;
            let py = cy + y * scale;

            // Draw Boid
            if (scale > 0) {
                // Size changes with depth (z)
                let r = Math.floor(window.curPalette.pri.r);
                let g = Math.floor(window.curPalette.pri.g);
                let b_col = Math.floor(window.curPalette.pri.b);
                
                // Opacity based on depth
                let alpha = Math.min(1, Math.max(0.2, scale));
                
                ctx.beginPath();
                ctx.fillStyle = `rgba(${r},${g},${b_col},${alpha})`;
                
                // Draw starling shape (small arrow/triangle pointing in velocity dir)
                // We project velocity to 2D to rotate the arrow
                let angle = Math.atan2(b.vel.y, b.vel.x);
                // But add rotationY impact loosely
                angle += rotationY * 0.1; 

                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(angle);
                
                // Shape: Elongated Diamond/Bird
                ctx.beginPath();
                ctx.moveTo(4*scale, 0);
                ctx.lineTo(-3*scale, 2*scale);
                ctx.lineTo(-1*scale, 0);
                ctx.lineTo(-3*scale, -2*scale);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        });

        // 5. DRAW UI TEXT (Floating labels attached to random boids)
        ctx.font = "10px monospace";
        indicesList.forEach((lbl, i) => {
            // Attach label to every Nth boid
            let idx = Math.floor((i / indicesList.length) * boids.length);
            let targetBoid = boids[idx];
            if(targetBoid) {
                // re-project for text pos
                let x = targetBoid.pos.x, z = targetBoid.pos.z;
                let x1 = x*Math.cos(rotationY)-z*Math.sin(rotationY);
                let z1 = z*Math.cos(rotationY)+x*Math.sin(rotationY);
                let scale = fov/(fov+z1+400);
                if(scale > 0) {
                    ctx.fillStyle = "rgba(255,255,255,0.4)";
                    ctx.fillText(lbl, cx+x1*scale + 10, cy+targetBoid.pos.y*scale);
                    // Connection line
                    ctx.strokeStyle = "rgba(255,255,255,0.1)";
                    ctx.beginPath(); ctx.moveTo(cx+x1*scale, cy+targetBoid.pos.y*scale);
                    ctx.lineTo(cx+x1*scale + 8, cy+targetBoid.pos.y*scale); ctx.stroke();
                }
            }
        });

        // 6. FOOD PARTICLES RENDERING
        if(window.feedingActive && foodParticles.length > 0) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 18px 'Courier New'";

            for (let i = foodParticles.length - 1; i >= 0; i--) {
                let fp = foodParticles[i];
                
                // Move food up
                fp.x += fp.vx;
                fp.y += fp.vy;
                
                // Check collision with swarm (Eating)
                // We check if "enough" boids are close to the food
                let swarmHits = 0;
                let projectionX = fp.x - cx;
                let projectionY = fp.y - cy;
                
                // Simple distance check against a few boids to save performance
                // Actually, let's just use a radius check from the flock center?
                // Better: check distance to specific boids that are chasing it.
                // For visual simplicity, if it's near the center Y where boids congregate:
                
                if (fp.y < cy + 100 && fp.y > cy - 100 && Math.abs(fp.x - cx) < 150) {
                    // "Eaten" visual effect
                    eatenFoodCount++;
                    // Flash effect
                    ctx.fillStyle = "#FFF";
                    ctx.beginPath(); ctx.arc(fp.x, fp.y, 10, 0, Math.PI*2); ctx.fill();
                    foodParticles.splice(i, 1);
                    continue;
                }

                if (fp.y < -50) { foodParticles.splice(i, 1); continue; } // Out of bounds

                // Draw Food
                const r = Math.floor(window.curPalette.pri.r);
                const g = Math.floor(window.curPalette.pri.g);
                const b = Math.floor(window.curPalette.pri.b);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
                ctx.fillText(fp.char, fp.x, fp.y);
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}
