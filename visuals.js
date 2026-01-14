// ============================================
// VISUALS MODULE (visuals.js) - NEURAL MURMURATION
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

// --- BOID / PARTICLE SYSTEM SETUP ---
const NUM_BOIDS = 180; // Enough for density, low enough for connection lines
const VISUAL_RANGE = 120; // How far they see each other
const CONNECTION_DIST = 90; // When to draw lines (The "Web" look)

// Interaction State
window.activeChord = [];
window.currentIntensity = 1.0;

// --- 3D VECTOR CLASS ---
class Vector3 {
    constructor(x, y, z) { this.x = x; this.y = y; this.z = z; }
    add(v) { this.x+=v.x; this.y+=v.y; this.z+=v.z; }
    sub(v) { this.x-=v.x; this.y-=v.y; this.z-=v.z; }
    mult(n) { this.x*=n; this.y*=n; this.z*=n; }
    div(n) { if(n!==0) { this.x/=n; this.y/=n; this.z/=n; } }
    mag() { return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z); }
    normalize() { const m = this.mag(); if(m>0) this.div(m); }
    limit(max) { if(this.mag() > max) { this.normalize(); this.mult(max); } }
}

class Boid {
    constructor() {
        // Start in a random cloud
        this.pos = new Vector3((Math.random()-0.5)*200, (Math.random()-0.5)*200, (Math.random()-0.5)*200);
        this.vel = new Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
        this.acc = new Vector3(0,0,0);
        this.maxSpeed = 5;
        this.maxForce = 0.15;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    // The "Murmuration" Logic
    flock(boids, mousePos) {
        let sep = new Vector3(0,0,0);
        let ali = new Vector3(0,0,0);
        let coh = new Vector3(0,0,0);
        let count = 0;

        for (let other of boids) {
            if (other === this) continue;
            let d = Math.sqrt((this.pos.x-other.pos.x)**2 + (this.pos.y-other.pos.y)**2 + (this.pos.z-other.pos.z)**2);
            
            if (d < VISUAL_RANGE) {
                // Separation
                if (d < 40) {
                    let diff = new Vector3(this.pos.x - other.pos.x, this.pos.y - other.pos.y, this.pos.z - other.pos.z);
                    diff.normalize();
                    diff.div(d); // Weight by distance
                    sep.add(diff);
                }
                // Alignment & Cohesion
                ali.add(other.vel);
                coh.add(other.pos);
                count++;
            }
        }

        if (count > 0) {
            // Alignment
            ali.div(count);
            ali.normalize();
            ali.mult(this.maxSpeed);
            ali.sub(this.vel);
            ali.limit(this.maxForce);

            // Cohesion
            coh.div(count);
            coh.sub(this.pos); // Steer towards location
            coh.normalize();
            coh.mult(this.maxSpeed);
            coh.sub(this.vel);
            coh.limit(this.maxForce);
        }
        
        // Separation final math
        if (sep.mag() > 0) {
            sep.normalize();
            sep.mult(this.maxSpeed);
            sep.sub(this.vel);
            sep.limit(this.maxForce * 1.5); // Separation is high priority
        }

        // --- SYMBIOSIS SPECIFIC BEHAVIORS ---

        // 1. Center Pull (Keep them on screen)
        let centerPull = new Vector3(-this.pos.x, -this.pos.y, -this.pos.z);
        centerPull.mult(0.005); 

        // 2. Mouse Repulsion (Touch Behavior)
        let mouseForce = new Vector3(0,0,0);
        // mousePos is passed as projected 2D coordinates relative to center, but we approximate in 3D
        if (mousePos.active) {
            let dx = this.pos.x - mousePos.x; // Very rough approximation since mouse is 2D
            let dy = this.pos.y - mousePos.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 150) {
                let rep = new Vector3(dx, dy, 0);
                rep.normalize();
                rep.mult(5.0); // Strong push
                mouseForce.add(rep);
            }
        }

        // 3. Mouth/Shape Forming (The "Active Chord")
        if (window.activeChord && window.activeChord.length > 0) {
            // Override flocking if we need to form a letter
            // We assign this boid to a specific target point based on its index
            let targetIdx = Math.floor(Math.abs(this.pos.x + this.pos.y) % window.activeChord.length);
            let pt = window.activeChord[targetIdx];
            
            // Map 0..1 chord coordinates to -200..200 3D space
            let tx = (pt.x - 0.5) * 400;
            let ty = (pt.y - 0.5) * 400;
            
            let target = new Vector3(tx, ty, 0);
            let steer = new Vector3(target.x - this.pos.x, target.y - this.pos.y, target.z - this.pos.z);
            
            // Stronger steering for shapes
            steer.limit(this.maxForce * 4); 
            this.applyForce(steer);
            
            // Reduce flocking chaos when speaking
            sep.mult(0.2); ali.mult(0.1); coh.mult(0.1); centerPull.mult(0);
        }

        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);
        this.applyForce(centerPull);
        this.applyForce(mouseForce);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0); // Reset accel
    }
}

// --- STANDARD EXPORTS ---

window.spawnFoodText = (text) => {
    foodParticles = [];
    eatenFoodCount = 0;
    const chars = text.split('');
    totalFoodCount = chars.length;
    window.feedingActive = true;
    
    if(text.length > 5) {
        bloatFactor = 1.0 + (Math.min(text.length, 50) * 0.005);
    }

    const canvas = document.getElementById('symbiosisCanvas');
    const width = canvas.width;
    const height = canvas.height;
    const startY = height + 50; 
    const spread = Math.min(width * 0.9, chars.length * 40); 
    const startX = (width - spread) / 2;

    chars.forEach((char, i) => {
        foodParticles.push({
            char: char,
            x: startX + (i * (spread / chars.length)) + (Math.random()-0.5)*100, 
            y: startY + (Math.random() * 100),
            vx: (Math.random() - 0.5) * 4,  
            vy: -8 - Math.random() * 6,
            friction: 0.96,
            offset: Math.random() * 100,             
            swirlDir: Math.random() > 0.5 ? 1 : -1   
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
            
            window.activeChord = window.alphabetChords?.[char] || [{x:0.5, y:0.5}];
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

    // 1. Initialize Boids
    const boids = [];
    for(let i=0; i<NUM_BOIDS; i++) {
        boids.push(new Boid());
    }

    let rotationX=0, rotationY=0; 
    let realMouse={x:-1000,y:-1000, active: false};

    // 2. Mouse/Touch Handlers (Preserving original feel)
    const handleMove = (x, y) => {
        const r = container.getBoundingClientRect();
        // Convert screen coord to a centered coord relative to the swarm center
        // Original swarm center is roughly width/2, height*0.35
        realMouse.x = (x - r.left) - (width/2); 
        realMouse.y = (y - r.top) - (height*0.35); 
        realMouse.active = true;
    };
    
    container.addEventListener('mousemove', e => handleMove(e.clientX, e.clientY));
    container.addEventListener('touchmove', e => handleMove(e.touches[0].clientX, e.touches[0].clientY));
    container.addEventListener('touchend', () => { realMouse.active = false; realMouse.x=-1000; });

    function lerpRGB(curr, target, factor) {
        curr.r += (target.r - curr.r) * factor;
        curr.g += (target.g - curr.g) * factor;
        curr.b += (target.b - curr.b) * factor;
    }

    function updateColorLogic() {
        let targetSet;
        if (window.glitchMode) {
            const rR = Math.random() * 255;
            targetSet = { pri:{r:rR,g:0,b:0}, sec:{r:0,g:rR,b:0}, conn:{r:255,g:255,b:255} };
        } else if (window.currentMood in window.PALETTES) {
            targetSet = window.PALETTES[window.currentMood];
        } else {
            targetSet = window.PALETTES["NEUTRAL"];
        }
        const speed = window.glitchMode ? 0.5 : 0.03;
        lerpRGB(window.curPalette.pri, targetSet.pri, speed);
        lerpRGB(window.curPalette.sec, targetSet.sec, speed);
        lerpRGB(window.curPalette.conn, targetSet.conn, speed);
    }

    // 3D Projection Helper
    function project(p, cx, cy) {
        const fov = 400;
        let x = p.x, y = p.y, z = p.z;
        if(window.glitchMode) { x += (Math.random()-0.5)*10; y += (Math.random()-0.5)*10; }
        
        const x1 = x*Math.cos(rotationY) - z*Math.sin(rotationY);
        const z1 = z*Math.cos(rotationY) + x*Math.sin(rotationY);
        const y2 = y*Math.cos(rotationX) - z1*Math.sin(rotationX);
        const z2 = z1*Math.cos(rotationX) + y*Math.sin(rotationX);
        
        const scale = fov / (fov + z2 + 400); 
        return { x: cx + x1*scale, y: cy + y2*scale, z: z2, scale: scale };
    }

    let time=0;
    function animate() {
        // A. Visual Cleanup
        if(window.glitchMode && Math.random() > 0.7) {
            ctx.fillStyle = `rgba(${Math.random()*50}, 0, 0, 0.1)`;
            ctx.fillRect(0,0,width,height);
            ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
        } else { 
            ctx.clearRect(0,0,width,height); 
        }
        
        ctx.setTransform(1,0,0,1,0,0);
        // CRITICAL: This gives the shiny, energy-beam look
        ctx.globalCompositeOperation = 'lighter'; 
        
        updateColorLogic();
        const cx = width/2, cy = height * 0.35;
        
        rotationY += 0.002; 
        rotationX = Math.sin(time*0.5)*0.2; 
        time += 0.01;
        
        pulseTime += 0.02; 
        let pulseRadius = (pulseTime * 50) % 600; 
        if(digestionGlow > 0) { digestionGlow *= 0.92; if(digestionGlow<0.01) digestionGlow=0; }

        // B. Update Boids
        boids.forEach(b => {
            b.flock(boids, realMouse);
            b.update();
        });

        // C. Project to 2D
        const projected = boids.map(b => project(b.pos, cx, cy));

        // D. Digestion Glow (Background)
        if(digestionGlow > 0) {
            const glowRadius = 50 + (digestionGlow * 100); 
            const grg = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
            const r = Math.floor(window.curPalette.pri.r);
            const g = Math.floor(window.curPalette.pri.g);
            const b = Math.floor(window.curPalette.pri.b);
            grg.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${digestionGlow * 0.4})`);
            grg.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = grg;
            ctx.beginPath(); ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2); ctx.fill();
        }

        // E. Draw Connections (The Neural Look)
        ctx.lineWidth = 1;
        // Optimization: Don't check every pair, check subsets or use proximity from flock step
        // But for <200 boids, O(N^2) is acceptable on modern JS engines
        for(let i=0; i<projected.length; i++) {
            let p1 = projected[i];
            // Skip points behind camera or too far away
            if (p1.z < -300) continue;

            // Draw Node (Dot)
            const nr = Math.floor(window.curPalette.pri.r);
            const ng = Math.floor(window.curPalette.pri.g);
            const nb = Math.floor(window.curPalette.pri.b);
            const alpha = Math.min(1, Math.max(0.2, p1.scale));
            
            // Draw lines to neighbors
            // We connect to close neighbors to form the mesh
            for(let j=i+1; j<projected.length; j++) {
                let p2 = projected[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist2d = Math.sqrt(dx*dx + dy*dy);
                
                // Use CONNECTION_DIST scaled by perspective
                if (dist2d < CONNECTION_DIST * p1.scale) {
                     // Pulse Logic from Original
                    let centerDist = Math.sqrt(Math.pow(p1.x - cx, 2) + Math.pow(p1.y - cy, 2));
                    let pulseBright = 0;
                    if (Math.abs(centerDist - pulseRadius) < 50) { 
                        pulseBright = 0.5 * (1 - (Math.abs(centerDist - pulseRadius)/50)); 
                    }

                    const lineAlpha = ((1 - dist2d/(CONNECTION_DIST*p1.scale)) * 0.3 + pulseBright) * alpha;
                    
                    const cr = Math.floor(window.curPalette.conn.r);
                    const cg = Math.floor(window.curPalette.conn.g);
                    const cb = Math.floor(window.curPalette.conn.b);

                    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${lineAlpha})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
            
            // Draw the point itself (Glowing Orb)
            ctx.fillStyle = `rgba(${nr},${ng},${nb},${alpha})`;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, 2 * p1.scale, 0, Math.PI*2);
            ctx.fill();
        }

        // F. Text Labels (Indices)
        ctx.globalCompositeOperation = 'source-over'; 
        ctx.font = "11px monospace"; ctx.textAlign = "left";
        indicesList.forEach((lbl, i) => {
            // Attach label to specific boids (stable indices)
            const idx = Math.floor((i/indicesList.length) * NUM_BOIDS);
            const p = projected[idx];
            if(p && p.z > -300) {
                const r = Math.floor(window.curPalette.sec.r);
                const g = Math.floor(window.curPalette.sec.g);
                const b = Math.floor(window.curPalette.sec.b);
                ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, p.scale)})`;
                ctx.fillText(lbl, p.x + 10, p.y + 4); 
                ctx.fillRect(p.x-1, p.y-1, 2, 2);
            }
        });

        // G. Food Particles
        if(window.feedingActive && foodParticles.length > 0) {
            ctx.font = "bold 20px 'Courier New'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const absorptionRadius = 90 * bloatFactor; 

            for (let i = foodParticles.length - 1; i >= 0; i--) {
                let fp = foodParticles[i];
                const dx = cx - fp.x; const dy = cy - fp.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                fp.vx += Math.sin(time * 3 + fp.offset) * 0.15; 
                fp.vy += Math.cos(time * 2 + fp.offset) * 0.15;
                
                // Pull into center (The Swarm's "Mouth")
                let pullStrength = (dist > 300) ? 0.15 : (dist > 150 ? 0.4 : 1.2);
                fp.vx += (dx / dist) * pullStrength; fp.vy += (dy / dist) * pullStrength;
                
                fp.vx *= fp.friction; fp.vy *= fp.friction; fp.x += fp.vx; fp.y += fp.vy;
                
                let alpha = 1; 

                // Absorb
                if (dist < absorptionRadius) {
                    let scale = dist / absorptionRadius; 
                    alpha = Math.pow(scale, 0.5); 
                    if (dist < 20 || scale < 0.1) {
                        foodParticles.splice(i, 1); eatenFoodCount++; 
                        digestionGlow = Math.min(digestionGlow + 0.3, 1.5);
                        continue; 
                    }
                }
                
                ctx.save(); ctx.translate(fp.x, fp.y);
                const r = Math.floor(window.curPalette.pri.r);
                const g = Math.floor(window.curPalette.pri.g);
                const b = Math.floor(window.curPalette.pri.b);
                const shimmer = 0.7 + (Math.sin(time * 10 + fp.offset) * 0.3);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * shimmer})`;
                ctx.fillText(fp.char, 0, 0); ctx.restore();
            }
        }
        
        requestAnimationFrame(animate);
    }
    animate();
}
