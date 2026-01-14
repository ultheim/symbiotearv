// ============================================
// VISUALS MODULE (visuals.js) - OPTIMIZED MURMURATION
// ============================================

let foodParticles = []; 
window.feedingActive = false;
let eatenFoodCount = 0;
let totalFoodCount = 0;
let bloatFactor = 1.0; 
let pulseTime = 0;     
let digestionGlow = 0; 

// Global Access to Palette
window.curPalette = { pri: {r:255, g:115, b:0}, sec: {r:200, g:100, b:50}, conn: {r:255, g:160, b:0} };

let indicesList=["SYSTEM", "LOCKED", "SECURE", "AUTH", "REQUIRED", "WAIT", "KEY", "VOID"];
window.updateKeywords = (newList) => {
    if(newList && newList.length > 0) indicesList = newList;
};

// --- CONFIGURATION ---
const BOID_COUNT = 1600; // 10x density
const CELL_SIZE = 60;    // Spatial grid size for optimization
const NEIGHBOR_DIST = 45;// Distance to connect lines
const MAX_SPEED = 7;
const MAX_FORCE = 0.2;

// --- 3D VECTOR MATH (Optimized) ---
class Vec3 {
    constructor(x, y, z) { this.x=x; this.y=y; this.z=z; }
    add(v) { this.x+=v.x; this.y+=v.y; this.z+=v.z; return this; }
    sub(v) { this.x-=v.x; this.y-=v.y; this.z-=v.z; return this; }
    mult(n) { this.x*=n; this.y*=n; this.z*=n; return this; }
    div(n) { if(n!==0){this.x/=n; this.y/=n; this.z/=n;} return this; }
    magSq() { return this.x*this.x + this.y*this.y + this.z*this.z; }
    mag() { return Math.sqrt(this.magSq()); }
    normalize() { const m = this.mag(); if(m>0) this.div(m); return this; }
    limit(max) { if(this.magSq() > max*max) { this.normalize(); this.mult(max); } return this; }
    clone() { return new Vec3(this.x, this.y, this.z); }
}

// --- ALPHABET CHORDS (Same as original) ---
const alphabetChords = {
    'A': [{x:0.5, y:0.2}, {x:0.2, y:0.8}, {x:0.8, y:0.8}],
    'E': [{x:0.2, y:0.2}, {x:0.2, y:0.8}, {x:0.8, y:0.2}, {x:0.8, y:0.5}, {x:0.8, y:0.8}],
    'I': [{x:0.5, y:0.2}, {x:0.5, y:0.8}, {x:0.3, y:0.2}, {x:0.7, y:0.2}, {x:0.3, y:0.8}, {x:0.7, y:0.8}],
    'O': [{x:0.5, y:0.2}, {x:0.2, y:0.5}, {x:0.5, y:0.8}, {x:0.8, y:0.5}],
    'U': [{x:0.2, y:0.2}, {x:0.2, y:0.8}, {x:0.5, y:0.9}, {x:0.8, y:0.8}, {x:0.8, y:0.2}],
    // ... (Mappings fallback to default for brevity, system uses random chord if missing)
    'DEFAULT': [{x:0.5,y:0.5}, {x:0.2,y:0.2}, {x:0.8,y:0.8}, {x:0.2,y:0.8}, {x:0.8,y:0.2}]
};

// --- BOID CLASS ---
class Boid {
    constructor(id) {
        this.id = id;
        this.pos = new Vec3((Math.random()-0.5)*300, (Math.random()-0.5)*300, (Math.random()-0.5)*100);
        this.vel = new Vec3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2);
        this.acc = new Vec3(0,0,0);
        // "Public" (Outer shell) vs "Private" (Inner core) layers
        this.type = Math.random() > 0.6 ? 'PRI' : 'PUB'; 
    }

    applyForce(f) { this.acc.add(f); }

    // Optimized Flocking using Grid neighbors
    flock(neighbors, targetInfo, repulsion) {
        let sep = new Vec3(0,0,0), ali = new Vec3(0,0,0), coh = new Vec3(0,0,0);
        let count = 0;

        // 1. FLOCKING
        for (let other of neighbors) {
            if (other === this) continue;
            let dx = this.pos.x - other.pos.x;
            let dy = this.pos.y - other.pos.y;
            let dz = this.pos.z - other.pos.z;
            let dSq = dx*dx + dy*dy + dz*dz;

            if (dSq < NEIGHBOR_DIST * NEIGHBOR_DIST) {
                // Separation
                let d = Math.sqrt(dSq);
                let diff = new Vec3(dx, dy, dz).normalize().div(d); // Weight by dist
                sep.add(diff);
                // Alignment
                ali.add(other.vel);
                // Cohesion
                coh.add(other.pos);
                count++;
            }
        }

        if (count > 0) {
            sep.div(count).normalize().mult(MAX_SPEED).sub(this.vel).limit(MAX_FORCE * 1.5);
            ali.div(count).normalize().mult(MAX_SPEED).sub(this.vel).limit(MAX_FORCE);
            coh.div(count).sub(this.pos).normalize().mult(MAX_SPEED).sub(this.vel).limit(MAX_FORCE * 0.8);
        }

        this.applyForce(sep.mult(1.5));
        this.applyForce(ali.mult(1.0));
        this.applyForce(coh.mult(1.0));

        // 2. CENTER PULL (Keep them in screen)
        let returnForce = this.pos.clone().mult(-1).normalize().mult(0.05);
        this.applyForce(returnForce);

        // 3. TARGETING (Talking)
        if (targetInfo.active) {
            // Map boid ID to a specific point in the chord to create shape
            let pt = targetInfo.points[this.id % targetInfo.points.length];
            let tx = (pt.x - 0.5) * 500; // Spread out
            let ty = (pt.y - 0.5) * 500;
            let target = new Vec3(tx, ty, 0);
            
            let steer = target.sub(this.pos);
            let d = steer.mag();
            // Arrive behavior
            let speed = MAX_SPEED;
            if (d < 100) speed = (d/100) * MAX_SPEED;
            steer.normalize().mult(speed).sub(this.vel).limit(MAX_FORCE * 2.0);
            this.applyForce(steer);
        } 
        // 4. FEEDING (Diving)
        else if (window.feedingActive && foodParticles.length > 0) {
            // Find nearest food (Optimized: just check first few)
            let food = foodParticles[this.id % foodParticles.length];
            if(food) {
                // Approximate 3D target from 2D food pos
                let tx = food.x - targetInfo.cx; 
                let ty = food.y - targetInfo.cy;
                let dive = new Vec3(tx, ty, 0).sub(this.pos);
                dive.normalize().mult(MAX_SPEED).sub(this.vel).limit(MAX_FORCE * 1.5);
                this.applyForce(dive);
            }
        }

        // 5. MOUSE/TOUCH REPULSION
        if (repulsion.active) {
            // 2D Mouse projection to Cylinder in 3D
            let dx = this.pos.x - repulsion.x;
            let dy = this.pos.y - repulsion.y;
            let dSq = dx*dx + dy*dy; // Cylinder distance (ignore Z for cylinder)
            
            if (dSq < 200 * 200) {
                let force = new Vec3(dx, dy, 0).normalize();
                force.mult(8.0); // Strong push
                this.applyForce(force);
            }
        }
    }

    update() {
        this.vel.add(this.acc).limit(MAX_SPEED);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }
}

// --- STANDARD EXPORTS ---

window.spawnFoodText = (text) => {
    foodParticles = [];
    eatenFoodCount = 0;
    const chars = text.split('');
    totalFoodCount = chars.length;
    window.feedingActive = true;
    
    if(text.length > 5) bloatFactor = 1.0 + (Math.min(text.length, 50) * 0.005);

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
            vx: (Math.random() - 0.5) * 3,  
            vy: -5 - Math.random() * 5,
            life: 1.0
        });
    });
};

window.speak = function(text) {
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
            
            // Set global target points for boids
            window.activeChord = alphabetChords[char] || alphabetChords['DEFAULT'];
            
            window.morphMouthShape(char);
            window.currentIntensity = 1.5; setTimeout(() => { window.currentIntensity = 1.0; }, 50);
            charIndex++; 
            setTimeout(playNextChar, 80 * speedMod);
        }
        playNextChar();
    }
    playNextWord();
};

// --- MAIN ANIMATION LOOP ---
window.initSymbiosisAnimation = function() {
    const canvas = document.getElementById('symbiosisCanvas');
    const container = document.getElementById('symbiosis-container');
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    
    function resize() {
        const rect = container.getBoundingClientRect();
        width = rect.width; height = rect.height;
        canvas.width = width; canvas.height = height;
    }
    window.addEventListener('resize', resize); resize();

    // 1. Initialize Large Swarm
    const boids = [];
    for(let i=0; i<BOID_COUNT; i++) boids.push(new Boid(i));

    let rotationY = 0;
    let rotationX = 0;
    let time = 0;
    let realMouse = { x: -1000, y: -1000, active: false };

    // Mouse Handler
    const handleMove = (mx, my) => {
        const r = container.getBoundingClientRect();
        // Calculate Mouse relative to center of screen (0,0)
        realMouse.x = (mx - r.left) - (width/2);
        realMouse.y = (my - r.top) - (height*0.35);
        realMouse.active = true;
    };
    container.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
    container.addEventListener('touchmove', e => handleMove(e.touches[0].clientX, e.touches[0].clientY));
    container.addEventListener('touchend', () => { realMouse.active = false; realMouse.x = -1000; });

    function lerpRGB(curr, target, factor) {
        curr.r += (target.r - curr.r) * factor;
        curr.g += (target.g - curr.g) * factor;
        curr.b += (target.b - curr.b) * factor;
    }

    // 3D Projection
    function project(p, cx, cy) {
        const fov = 500;
        let x = p.x, y = p.y, z = p.z;
        if(window.glitchMode) { x += (Math.random()-0.5)*15; }
        
        const x1 = x*Math.cos(rotationY) - z*Math.sin(rotationY);
        const z1 = z*Math.cos(rotationY) + x*Math.sin(rotationY);
        
        // Simple scale
        const scale = fov / (fov + z1 + 300);
        return { 
            x: cx + x1*scale, 
            y: cy + y*scale, 
            z: z1, 
            scale: scale,
            type: p.type
        };
    }

    function animate() {
        // A. Clear
        if(window.glitchMode && Math.random() > 0.8) {
            ctx.fillStyle = 'rgba(50,0,0,0.1)';
            ctx.fillRect(0,0,width,height);
        } else {
            ctx.clearRect(0,0,width,height);
        }

        ctx.globalCompositeOperation = 'lighter'; // Original Look

        // B. Update Palette
        let targetSet = window.PALETTES[window.currentMood] || window.PALETTES["NEUTRAL"];
        if(window.glitchMode) targetSet = { pri:{r:255,g:255,b:255}, sec:{r:255,g:0,b:0}, conn:{r:100,g:0,b:0} };
        lerpRGB(window.curPalette.pri, targetSet.pri, 0.05);
        lerpRGB(window.curPalette.sec, targetSet.sec, 0.05);
        lerpRGB(window.curPalette.conn, targetSet.conn, 0.05);

        const cx = width/2, cy = height * 0.35;
        time += 0.01;
        rotationY += 0.003; 
        rotationX = Math.sin(time*0.5)*0.1;
        pulseTime += 0.03;
        let pulseRadius = (pulseTime * 60) % 800;

        // C. Spatial Partitioning (The Optimization)
        const grid = {};
        for(let b of boids) {
            // Hash position to grid key
            const k = `${Math.floor(b.pos.x/CELL_SIZE)},${Math.floor(b.pos.y/CELL_SIZE)},${Math.floor(b.pos.z/CELL_SIZE)}`;
            if(!grid[k]) grid[k] = [];
            grid[k].push(b);
        }

        // D. Update Boids
        const targetInfo = { 
            active: (window.activeChord && window.activeChord.length > 0),
            points: window.activeChord,
            cx: cx, cy: cy 
        };

        const projPoints = [];

        for(let b of boids) {
            // Retrieve Neighbors from Grid (only checking adjacent cells)
            const neighbors = [];
            const gx = Math.floor(b.pos.x/CELL_SIZE);
            const gy = Math.floor(b.pos.y/CELL_SIZE);
            const gz = Math.floor(b.pos.z/CELL_SIZE);
            
            for(let x=gx-1; x<=gx+1; x++) {
                for(let y=gy-1; y<=gy+1; y++) {
                    for(let z=gz-1; z<=gz+1; z++) {
                        const k = `${x},${y},${z}`;
                        if(grid[k]) {
                            for(let nb of grid[k]) neighbors.push(nb);
                        }
                    }
                }
            }

            // Calc Physics
            b.flock(neighbors, targetInfo, realMouse);
            b.update();
            
            // Project
            projPoints.push({ boid: b, proj: project(b.pos, cx, cy) });
        }

        // E. Digestion Effect
        if(digestionGlow > 0) {
            digestionGlow *= 0.95;
            const glowR = 100 + digestionGlow*150;
            const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
            const r = Math.floor(window.curPalette.pri.r);
            const g = Math.floor(window.curPalette.pri.g);
            const b = Math.floor(window.curPalette.pri.b);
            gr.addColorStop(0, `rgba(${r},${g},${b},${digestionGlow*0.3})`);
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gr;
            ctx.beginPath(); ctx.arc(cx,cy,glowR,0,Math.PI*2); ctx.fill();
        }

        // F. Render Lines & Dots
        ctx.lineWidth = 0.8;
        
        // Optimizing Draw Loop: We only draw lines for "Public" nodes to save cycles
        // or just rely on spatial density.
        
        for(let item of projPoints) {
            const p = item.proj;
            const b = item.boid;
            if(p.scale < 0 || p.z < -200) continue; // Clip behind camera

            const alpha = Math.min(1, p.scale);

            // Draw Dot
            const col = (p.type === 'PUB') ? window.curPalette.pri : window.curPalette.sec;
            ctx.fillStyle = `rgba(${Math.floor(col.r)},${Math.floor(col.g)},${Math.floor(col.b)},${alpha})`;
            ctx.beginPath(); 
            ctx.arc(p.x, p.y, (p.type==='PUB'?1.5:1.0)*p.scale, 0, Math.PI*2); 
            ctx.fill();

            // Draw Lines (Only if 'PUB' type to reduce draw calls, creating the "shell" look)
            if(p.type === 'PUB' && alpha > 0.3) {
                 // Check neighbors in sorted grid is hard here, so we cheat:
                 // We link to boids with ID + 1, ID + 2 (Simulating a chain)
                 // This is a rendering trick that looks like spatial connection but is O(1)
                 
                 // Actually, let's use the spatial grid for REAL connections but limit count
                 const gx = Math.floor(b.pos.x/CELL_SIZE);
                 const gy = Math.floor(b.pos.y/CELL_SIZE);
                 const gz = Math.floor(b.pos.z/CELL_SIZE);
                 const k = `${gx},${gy},${gz}`;
                 
                 if(grid[k]) {
                     let connected = 0;
                     for(let nb of grid[k]) {
                         if(connected >= 2) break; // Limit connections per node
                         if(nb === b) continue;
                         
                         const distSq = (b.pos.x-nb.pos.x)**2 + (b.pos.y-nb.pos.y)**2 + (b.pos.z-nb.pos.z)**2;
                         if(distSq < NEIGHBOR_DIST*NEIGHBOR_DIST) {
                             // Project neighbor
                             const nbProj = project(nb.pos, cx, cy);
                             
                             // Pulse Logic
                             const centerDist = Math.sqrt((p.x-cx)**2 + (p.y-cy)**2);
                             let pulse = 0;
                             if(Math.abs(centerDist - pulseRadius) < 60) pulse = 0.6;

                             const r = Math.floor(window.curPalette.conn.r);
                             const g = Math.floor(window.curPalette.conn.g);
                             const bl = Math.floor(window.curPalette.conn.b);
                             
                             ctx.strokeStyle = `rgba(${r},${g},${bl},${(0.2+pulse)*alpha})`;
                             ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nbProj.x, nbProj.y); ctx.stroke();
                             connected++;
                         }
                     }
                 }
            }
        }

        // G. Labels
        ctx.globalCompositeOperation = 'source-over';
        ctx.font = "10px monospace";
        indicesList.forEach((lbl, i) => {
            const idx = Math.floor((i/indicesList.length) * BOID_COUNT);
            if(projPoints[idx]) {
                const p = projPoints[idx].proj;
                if(p.z > -100) {
                     ctx.fillStyle = `rgba(${window.curPalette.sec.r},${window.curPalette.sec.g},${window.curPalette.sec.b},0.8)`;
                     ctx.fillText(lbl, p.x+8, p.y+3);
                     ctx.fillRect(p.x-1, p.y-1, 2, 2);
                }
            }
        });

        // H. Food Particles (Aggressive Ingestion)
        if(window.feedingActive && foodParticles.length > 0) {
            ctx.font = "bold 22px 'Courier New'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const absorbR = 120 * bloatFactor;

            for (let i = foodParticles.length - 1; i >= 0; i--) {
                let fp = foodParticles[i];
                const dx = cx - fp.x; const dy = cy - fp.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Float up
                fp.x += fp.vx; fp.y += fp.vy;
                fp.life -= 0.005;

                // Collision with Swarm center area
                if(dist < absorbR) {
                    // Shatter effect
                    fp.life -= 0.1;
                    digestionGlow = Math.min(digestionGlow + 0.05, 1.5);
                    
                    // Draw sparks
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(fp.x + (Math.random()-0.5)*20, fp.y + (Math.random()-0.5)*20, 2, 2);
                }

                if(fp.life <= 0 || fp.y < -50) {
                    foodParticles.splice(i, 1);
                    eatenFoodCount++;
                    continue;
                }

                ctx.save(); ctx.translate(fp.x, fp.y);
                const r = Math.floor(window.curPalette.pri.r);
                const g = Math.floor(window.curPalette.pri.g);
                const b = Math.floor(window.curPalette.pri.b);
                ctx.fillStyle = `rgba(${r},${g},${b},${fp.life})`;
                // Glitch shake
                if(dist < absorbR) ctx.translate((Math.random()-0.5)*5, (Math.random()-0.5)*5);
                ctx.fillText(fp.char, 0, 0); 
                ctx.restore();
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}
