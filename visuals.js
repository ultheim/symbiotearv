// ============================================
// VISUALS MODULE (visuals.js) - QUANTUM MURMURATION
// ============================================

let foodParticles = [];
window.feedingActive = false;
let eatenFoodCount = 0;
let totalFoodCount = 0;
let bloatFactor = 1.0; 

// Global Access to Palette
window.curPalette = { pri: {r:255, g:115, b:0}, sec: {r:200, g:100, b:50}, conn: {r:255, g:160, b:0} };

let indicesList=["SYSTEM", "LOCKED", "SECURE", "AUTH", "REQUIRED", "WAIT", "KEY", "VOID"];
window.updateKeywords = (newList) => { if(newList && newList.length > 0) indicesList = newList; };

// --- CONFIGURATION ---
const BOID_COUNT = 2000; // Increased x10 as requested
const MAX_SPEED = 6;
const MAX_FORCE = 0.15;
const PERCEPTION_RADIUS = 50;
const SEPARATION_DIST = 25;
const CELL_SIZE = 60; // For Spatial Grid

// --- SPATIAL GRID FOR PERFORMANCE ---
class SpatialGrid {
    constructor(width, height, cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.grid = new Map();
    }
    
    clear() { this.grid.clear(); }
    
    getKey(x, y) {
        // Simple hash key
        return `${Math.floor(x/this.cellSize)}|${Math.floor(y/this.cellSize)}`;
    }
    
    add(boid) {
        const key = this.getKey(boid.pos.x + 1000, boid.pos.y + 1000); // Offset to avoid negative keys
        if (!this.grid.has(key)) this.grid.set(key, []);
        this.grid.get(key).push(boid);
    }
    
    getNeighbors(boid) {
        const neighbors = [];
        const bx = boid.pos.x + 1000;
        const by = boid.pos.y + 1000;
        const cellX = Math.floor(bx / this.cellSize);
        const cellY = Math.floor(by / this.cellSize);

        // Check 3x3 grid around the boid
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const key = `${cellX + i}|${cellY + j}`;
                if (this.grid.has(key)) {
                    const cellBoids = this.grid.get(key);
                    for(let other of cellBoids) {
                        if(other !== boid) neighbors.push(other);
                    }
                }
            }
        }
        return neighbors;
    }
}

// --- MATH UTILS ---
class Vector3 {
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    add(v) { this.x+=v.x; this.y+=v.y; this.z+=v.z; }
    sub(v) { this.x-=v.x; this.y-=v.y; this.z-=v.z; }
    mult(n) { this.x*=n; this.y*=n; this.z*=n; }
    div(n) { if(n!==0) { this.x/=n; this.y/=n; this.z/=n; } }
    mag() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
    normalize() { const m = this.mag(); if(m>0) this.div(m); }
    limit(max) { if(this.mag() > max) { this.normalize(); this.mult(max); } }
    copy() { return new Vector3(this.x, this.y, this.z); }
}

class Boid {
    constructor() {
        // Initialize in a cloud
        this.pos = new Vector3((Math.random()-0.5)*600, (Math.random()-0.5)*400, (Math.random()-0.5)*200);
        this.vel = new Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
        this.vel.normalize(); this.vel.mult(MAX_SPEED);
        this.acc = new Vector3(0,0,0);
        this.hueOffset = Math.random() * 20; // Slight color var
    }

    flock(neighbors, targetForce, mouseRepel) {
        let sep = new Vector3(0,0,0);
        let ali = new Vector3(0,0,0);
        let coh = new Vector3(0,0,0);
        let count = 0;

        for (let other of neighbors) {
            let d = Math.sqrt((this.pos.x-other.pos.x)**2 + (this.pos.y-other.pos.y)**2 + (this.pos.z-other.pos.z)**2);
            if (d < PERCEPTION_RADIUS && d > 0) {
                // Separation
                if (d < SEPARATION_DIST) {
                    let diff = new Vector3(this.pos.x - other.pos.x, this.pos.y - other.pos.y, this.pos.z - other.pos.z);
                    diff.normalize();
                    diff.div(d); // Weight by distance
                    sep.add(diff);
                }
                // Alignment
                ali.add(other.vel);
                // Cohesion
                coh.add(other.pos);
                count++;
            }
        }

        if (count > 0) {
            ali.div(count); ali.normalize(); ali.mult(MAX_SPEED); ali.sub(this.vel); ali.limit(MAX_FORCE);
            coh.div(count); coh.sub(this.pos); coh.normalize(); coh.mult(MAX_SPEED); coh.sub(this.vel); coh.limit(MAX_FORCE);
        }

        sep.mult(1.5);
        ali.mult(1.0);
        coh.mult(1.0);

        // --- CUSTOM FORCES ---
        
        // 1. Center Gravity (Keep on screen)
        let center = new Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
        center.mult(0.0005);

        // 2. Mouse Interaction (Repel)
        let mouseForce = new Vector3(0,0,0);
        if(mouseRepel.active) {
            // Rough 2D-to-3D check
            let dx = this.pos.x - mouseRepel.x;
            let dy = this.pos.y - mouseRepel.y;
            let d = Math.sqrt(dx*dx + dy*dy);
            if(d < 150) {
                let force = new Vector3(dx, dy, 0);
                force.normalize();
                force.mult(10.0); // Strong Scatter
                mouseForce.add(force);
            }
        }

        // 3. Shape Targeting (Speaking) or Food (Eating)
        if(targetForce) {
            // If targeting, reduce flocking noise so they form shapes cleanly
            sep.mult(0.4); ali.mult(0.1); coh.mult(0.1); center.mult(0);
            this.acc.add(targetForce);
        }

        this.acc.add(sep);
        this.acc.add(ali);
        this.acc.add(coh);
        this.acc.add(center);
        this.acc.add(mouseForce);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(MAX_SPEED);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }
}

// --- MAIN LOOP ---
window.initSymbiosisAnimation = function() {
    const canvas = document.getElementById('symbiosisCanvas');
    const container = document.getElementById('symbiosis-container');
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    let width, height;

    // Grid System
    let spatialGrid;

    // Boids
    const boids = [];
    for(let i=0; i<BOID_COUNT; i++) boids.push(new Boid());

    // Interaction vars
    let rotationY = 0;
    let time = 0;
    let realMouse = {x:0, y:0, active: false};

    function resize() {
        const rect = container.getBoundingClientRect();
        width = rect.width; height = rect.height;
        canvas.width = width; canvas.height = height;
        spatialGrid = new SpatialGrid(width*2, height*2, CELL_SIZE); // Larger virtual space
    }
    window.addEventListener('resize', resize); resize();

    // Mouse Handler
    const handleMove = (x, y) => {
        const r = container.getBoundingClientRect();
        // Translate screen coords to 0,0 center relative coords
        realMouse.x = (x - r.left) - width/2;
        realMouse.y = (y - r.top) - height * 0.35;
        realMouse.active = true;
    };
    container.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
    container.addEventListener('touchmove', e => handleMove(e.touches[0].clientX, e.touches[0].clientY));
    container.addEventListener('touchend', () => { realMouse.active = false; });

    function lerpRGB(curr, target, factor) {
        curr.r += (target.r - curr.r) * factor;
        curr.g += (target.g - curr.g) * factor;
        curr.b += (target.b - curr.b) * factor;
    }

    function animate() {
        // 1. TRAILS EFFECT (No clearRect)
        // Dark overlay with low opacity creates the trails
        ctx.fillStyle = 'rgba(5, 5, 8, 0.2)'; // Very dark blue/black
        ctx.fillRect(0,0,width,height);
        
        ctx.globalCompositeOperation = 'lighter'; // Additive blending for "energy" look

        // 2. PALETTE & LOGIC
        time += 0.01;
        rotationY += 0.002;
        
        let targetSet = window.PALETTES[window.currentMood] || window.PALETTES["NEUTRAL"];
        if (window.glitchMode) targetSet = { pri:{r:255,g:255,b:255}, sec:{r:255,g:0,b:0}, conn:{r:0,g:0,b:0} };
        lerpRGB(window.curPalette.pri, targetSet.pri, 0.1);

        // 3. BUILD GRID
        spatialGrid.clear();
        boids.forEach(b => spatialGrid.add(b));

        // 4. UPDATE BOIDS
        const cx = width / 2;
        const cy = height * 0.35;

        boids.forEach((b, index) => {
            // Get neighbors from grid (Optimization)
            const neighbors = spatialGrid.getNeighbors(b);

            // Calculate Target Forces (Speaking or Eating)
            let targetForce = null;

            // A. SPEAKING: Form Shapes
            if(window.activeChord && window.activeChord.length > 0) {
                // Assign this boid to a target point in the chord
                let ptIndex = index % window.activeChord.length;
                let pt = window.activeChord[ptIndex];
                
                // Map to 3D Space (Scale up)
                let tx = (pt.x - 0.5) * 500;
                let ty = (pt.y - 0.5) * 500;
                
                // Steer towards target
                let desired = new Vector3(tx - b.pos.x, ty - b.pos.y, -b.pos.z); // Pull to Z=0
                
                // ARRIVAL BEHAVIOR: Slow down as we get close, but keep swirling
                let d = desired.mag();
                desired.normalize();
                if (d < 100) desired.mult(MAX_SPEED * (d/100)); // Slow down
                else desired.mult(MAX_SPEED * 2); // Rush there
                
                let steer = new Vector3(desired.x - b.vel.x, desired.y - b.vel.y, desired.z - b.vel.z);
                steer.limit(0.3); // Stronger steering for shapes
                targetForce = steer;
            }
            // B. EATING: Swarm Food
            else if(window.feedingActive && foodParticles.length > 0) {
                // Find nearest food
                let nearest = null; 
                let record = 100000;
                
                // Optimization: Only check a few food particles
                for(let f of foodParticles) {
                    let fx = f.x - cx; let fy = f.y - cy;
                    let d = Math.sqrt((b.pos.x - fx)**2 + (b.pos.y - fy)**2);
                    if (d < record) { record = d; nearest = {x:fx, y:fy}; }
                }

                if(nearest) {
                    // Swarm behavior: Circle the food tightly
                    let dir = new Vector3(nearest.x - b.pos.x, nearest.y - b.pos.y, -b.pos.z);
                    dir.normalize();
                    dir.mult(0.5); // Attraction
                    targetForce = dir;
                    
                    // Add chaos/orbit
                    targetForce.add(new Vector3((Math.random()-0.5), (Math.random()-0.5), 0));
                }
            }

            b.flock(neighbors, targetForce, realMouse);
            b.update();

            // 5. RENDER BOID
            // Project to 2D
            let x = b.pos.x, y = b.pos.y, z = b.pos.z;
            // Rotate camera
            let x1 = x * Math.cos(rotationY) - z * Math.sin(rotationY);
            let z1 = z * Math.cos(rotationY) + x * Math.sin(rotationY);
            // Perspective
            let scale = 400 / (400 + z1 + 500); // 400 is FOV
            
            if (scale > 0) {
                let screenX = cx + x1 * scale;
                let screenY = cy + y * scale;

                const r = Math.floor(window.curPalette.pri.r + b.hueOffset);
                const g = Math.floor(window.curPalette.pri.g);
                const blue = Math.floor(window.curPalette.pri.b);
                const alpha = Math.min(1, scale * 0.8);

                ctx.fillStyle = `rgba(${r},${g},${blue},${alpha})`;
                
                // Draw a small glowing "spark" instead of a rect
                let size = 1.5 * scale;
                if(window.feedingActive) size *= 1.5; // Bigger when angry

                ctx.beginPath();
                ctx.arc(screenX, screenY, size, 0, Math.PI*2);
                ctx.fill();
            }
        });

        // 6. RENDER FOOD
        if(window.feedingActive && foodParticles.length > 0) {
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = "bold 24px 'Courier New'";
            
            for (let i = foodParticles.length - 1; i >= 0; i--) {
                let fp = foodParticles[i];
                // Physics for food (floating up)
                fp.x += fp.vx; fp.y += fp.vy;
                
                // Draw Food
                const alpha = 1.0;
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.shadowBlur = 10; ctx.shadowColor = "white";
                ctx.fillText(fp.char, fp.x, fp.y);
                ctx.shadowBlur = 0;

                // Collision Logic (Simple radius check against center of swarm for efficiency)
                // Actually, let's check if the swarm density around the food is high?
                // Simpler: Check distance to "Mouth" (center of screen)
                let distToMouth = Math.sqrt((fp.x - cx)**2 + (fp.y - cy)**2);
                
                // Swarm pulls food in?
                if(distToMouth > 50) {
                    fp.vx += (cx - fp.x) * 0.005;
                    fp.vy += (cy - fp.y) * 0.005;
                } else {
                    // EAT IT
                    foodParticles.splice(i, 1);
                    eatenFoodCount++;
                    // Explosion Effect
                    ctx.fillStyle = "white";
                    ctx.beginPath(); ctx.arc(fp.x, fp.y, 40, 0, Math.PI*2); ctx.fill();
                }
                
                if(fp.y < -50) foodParticles.splice(i,1);
            }
        }

        // 7. RENDER LABELS
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.font = "10px monospace"; ctx.textAlign = "left";
        indicesList.forEach((lbl, i) => {
            // Attach to random boid index
            let idx = Math.floor((i/indicesList.length) * boids.length);
            let b = boids[idx];
            // Project again for text (inefficient but cleaner code structure)
            let x = b.pos.x, z = b.pos.z;
            let x1 = x * Math.cos(rotationY) - z * Math.sin(rotationY);
            let z1 = z * Math.cos(rotationY) + x * Math.sin(rotationY);
            let scale = 400 / (400 + z1 + 500);
            if(scale > 0) {
                let sx = cx + x1 * scale;
                let sy = cy + b.pos.y * scale;
                ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
                ctx.fillText(lbl, sx + 10, sy);
                ctx.fillRect(sx, sy, 2, 2);
            }
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// --- STANDARD EXPORTS (Required for main.js compatibility) ---
window.spawnFoodText = (text) => {
    foodParticles = [];
    const chars = text.split('');
    const canvas = document.getElementById('symbiosisCanvas');
    const startX = (canvas.width - (chars.length * 30)) / 2;
    chars.forEach((char, i) => {
        foodParticles.push({
            char: char,
            x: startX + i*30,
            y: canvas.height + 50,
            vx: (Math.random()-0.5)*2,
            vy: -5 - Math.random()*2
        });
    });
    window.feedingActive = true;
};

window.speak = function(text) {
    window.feedingActive = false;
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

    function playNextWord() {
        if(wordIndex >= words.length) {
            window.activeChord=[]; window.stopBreathStream(); 
            setTimeout(() => { subtitleMask.style.opacity='0'; }, 100); 
            return;
        }
        if(wordIndex > 0) spans[wordIndex-1].classList.remove('active');
        spans[wordIndex].classList.add('active');
        const spanCenter = spans[wordIndex].offsetLeft + (spans[wordIndex].offsetWidth / 2);
        subtitleTrack.style.transform = `translateX(${-spanCenter}px)`;
        
        const chars = words[wordIndex].split('');
        let charIndex = 0;
        function playNextChar() {
            if (charIndex >= chars.length) { wordIndex++; setTimeout(playNextWord, 150 * moodData.speed); return; }
            const char = chars[charIndex].toUpperCase();
            window.activeChord = window.alphabetChords?.[char] || window.alphabetChords?.[' '];
            window.morphMouthShape(char);
            charIndex++; 
            setTimeout(playNextChar, 80 * moodData.speed);
        }
        playNextChar();
    }
    playNextWord();
};

// --- CHORDS DEFINITION (Needed for shaping) ---
window.alphabetChords = {
    'A': [{x:0.5, y:0.2}, {x:0.2, y:0.8}, {x:0.8, y:0.8}],
    'E': [{x:0.2, y:0.2}, {x:0.2, y:0.8}, {x:0.8, y:0.2}, {x:0.8, y:0.5}, {x:0.8, y:0.8}],
    'I': [{x:0.5, y:0.2}, {x:0.5, y:0.8}, {x:0.3, y:0.2}, {x:0.7, y:0.2}, {x:0.3, y:0.8}, {x:0.7, y:0.8}],
    'O': [{x:0.5, y:0.2}, {x:0.2, y:0.5}, {x:0.5, y:0.8}, {x:0.8, y:0.5}],
    'U': [{x:0.2, y:0.2}, {x:0.2, y:0.8}, {x:0.5, y:0.9}, {x:0.8, y:0.8}, {x:0.8, y:0.2}],
    // ... (Add others for complexity, or map to these basics)
    ' ': [{x:Math.random(), y:Math.random()}] // Random scatter on space
};
// Quick fill for other letters to map to rough shapes
"BCDFGHJKLMNPQRSTVWXYZ".split("").forEach(c => {
    window.alphabetChords[c] = [{x:0.5,y:0.5}, {x:Math.random(),y:Math.random()}, {x:Math.random(),y:Math.random()}];
});
