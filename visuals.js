// ============================================
// VISUALS MODULE (visuals.js) - AERODYNAMIC INTERACTION
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

// --- PHONETIC ANALYSIS ENGINE ---
// Maps whole words to "Atmospheric Conditions"
const WORD_BEHAVIOR = {
    SHARP: { separation: 18, alignment: 0.1, cohesion: 0.05, speedMod: 1.6, chaos: 2.5 },
    FLOW:  { separation: 35, alignment: 0.25, cohesion: 0.01, speedMod: 0.8, chaos: 0.1 },
    NEUTRAL: { separation: 25, alignment: 0.12, cohesion: 0.02, speedMod: 1.0, chaos: 0.5 }
};

let currentAtmosphere = WORD_BEHAVIOR.NEUTRAL;
let targetAtmosphere = WORD_BEHAVIOR.NEUTRAL;
let globalTurbulence = { x: 0, y: 0, z: 0 };

// --- BOID LOGIC ---
const FLOCK_SIZE = 450; 
const MAX_FLOCK = 700;
const VISION = 110;       
const MAX_SPEED = 8.0;    
const MIN_SPEED = 3.5;    

class Boid {
    constructor(x, y, z, isNewborn = false) {
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * 200;
        this.pos = { 
            x: x || Math.cos(angle) * rad, 
            y: y || Math.sin(angle) * rad, 
            z: z || (Math.random()-0.5) * 100 
        };
        this.vel = { 
            x: (Math.random()-0.5)*MAX_SPEED, 
            y: (Math.random()-0.5)*MAX_SPEED, 
            z: (Math.random()-0.5)*MAX_SPEED 
        };
        this.acc = { x: 0, y: 0, z: 0 };
        this.id = Math.random();
        this.type = isNewborn ? 'sec' : (Math.random() > 0.6 ? 'pri' : 'sec');
        this.bornTime = isNewborn ? 1.0 : 0.0;
        this.panicMode = 0; // Tracks if boid is currently fleeing a predator (mouse)
    }

    applyForce(fx, fy, fz) {
        this.acc.x += fx; this.acc.y += fy; this.acc.z += fz;
    }

    update(boids, mouse, width, height) {
        let sep = {x:0, y:0, z:0};
        let ali = {x:0, y:0, z:0};
        let coh = {x:0, y:0, z:0};
        let count = 0;

        // Optimization: Spatial Stride
        const stride = boids.length > 350 ? 2 : 1; 

        for(let i=0; i<boids.length; i+=stride) {
            let other = boids[i];
            if(other === this) continue;
            
            let dx = this.pos.x - other.pos.x;
            let dy = this.pos.y - other.pos.y;
            let dz = this.pos.z - other.pos.z;
            let dSq = dx*dx + dy*dy + dz*dz;

            if(dSq < VISION*VISION) {
                ali.x += other.vel.x; ali.y += other.vel.y; ali.z += other.vel.z;
                coh.x += other.pos.x; coh.y += other.pos.y; coh.z += other.pos.z;
                
                if(dSq < currentAtmosphere.separation * currentAtmosphere.separation) {
                    let d = Math.sqrt(dSq);
                    let scale = 1.8 / (d || 0.1); 
                    sep.x += dx * scale; sep.y += dy * scale; sep.z += dz * scale;
                }
                count++;
            }
        }

        if(count > 0) {
            coh.x = (coh.x/count) - this.pos.x; coh.y = (coh.y/count) - this.pos.y; coh.z = (coh.z/count) - this.pos.z;
            ali.x /= count; ali.y /= count; ali.z /= count;
        }

        // --- FLUID DYNAMICS ---
        this.applyForce(sep.x * 2.5, sep.y * 2.5, sep.z * 2.5); 
        this.applyForce(ali.x * currentAtmosphere.alignment, ali.y * currentAtmosphere.alignment, ali.z * currentAtmosphere.alignment); 
        this.applyForce(coh.x * currentAtmosphere.cohesion, coh.y * currentAtmosphere.cohesion, coh.z * currentAtmosphere.cohesion); 

        // --- INTERACTION: PREDATOR & OBSTACLE ---
        if(mouse.active) {
            let dx = this.pos.x - mouse.x;
            let dy = this.pos.y - mouse.y;
            let distSq = dx*dx + dy*dy;
            
            // Check Mouse Velocity (Shockwave calculation)
            let mouseSpeed = Math.sqrt(mouse.vx*mouse.vx + mouse.vy*mouse.vy);
            let perceptionRadius = 250 + (mouseSpeed * 5); // Vision expands when threat is fast
            
            if(distSq < perceptionRadius * perceptionRadius) {
                let dist = Math.sqrt(distSq);
                
                if(mouseSpeed > 8) {
                    // --- HIGH SPEED: PREDATOR RESPONSE (SCATTER) ---
                    // Birds don't just fly away; they scatter perpendicular to the threat or violently outward
                    let force = (perceptionRadius - dist) / perceptionRadius;
                    
                    // Violent radial push
                    this.applyForce(dx * force * 0.8, dy * force * 0.8, 0);
                    
                    // Add panic jitter
                    this.vel.x += (Math.random()-0.5) * 5;
                    this.vel.y += (Math.random()-0.5) * 5;
                    this.panicMode = 1.0;
                } else {
                    // --- LOW SPEED: HYDRODYNAMIC FLOW (AVOIDANCE) ---
                    // Gentle push to flow around the cursor
                    let force = (perceptionRadius - dist) / perceptionRadius;
                    this.applyForce(dx * force * 0.05, dy * force * 0.05, 0);
                    
                    // Slight turbulence in wake
                    this.applyForce((Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5, 0);
                }
            }
        }

        // --- GLOBAL TURBULENCE (Voice) ---
        if(window.activeWordMode) {
            this.applyForce(globalTurbulence.x, globalTurbulence.y, globalTurbulence.z);
            if(Math.random() < 0.1) {
                this.applyForce(
                    (Math.random()-0.5) * currentAtmosphere.chaos,
                    (Math.random()-0.5) * currentAtmosphere.chaos,
                    (Math.random()-0.5) * currentAtmosphere.chaos
                );
            }
        }

        // --- SOFT EDGES ---
        const dX = -this.pos.x;
        const dY = -this.pos.y;
        const dist = Math.sqrt(dX*dX + dY*dY);
        const limit = width * 0.45;
        
        if(dist > limit) {
            const force = (dist - limit) * 0.0005; 
            this.applyForce(dX * force, dY * force, 0);
            this.vel.x *= 0.98; 
            this.vel.y *= 0.98;
        }

        // Z-Depth 
        if(this.pos.z < -200) this.applyForce(0, 0, 0.2); 
        if(this.pos.z > 200) this.applyForce(0, 0, -0.2); 

        // Physics Integration
        this.vel.x += this.acc.x; this.vel.y += this.acc.y; this.vel.z += this.acc.z;
        
        // Drag
        let speed = Math.sqrt(this.vel.x**2 + this.vel.y**2 + this.vel.z**2);
        let drag = speed * 0.01; 
        this.vel.x *= (1 - drag); this.vel.y *= (1 - drag); this.vel.z *= (1 - drag);

        // Clamp
        let limitSpeed = MAX_SPEED * currentAtmosphere.speedMod;
        
        // If panicking, allow speed burst
        if (this.panicMode > 0) {
            limitSpeed *= 1.5;
            this.panicMode -= 0.05;
        }

        if(speed > limitSpeed) {
            let s = limitSpeed/speed;
            this.vel.x *= s; this.vel.y *= s; this.vel.z *= s;
        } else if (speed < MIN_SPEED && speed > 0.1) {
            let s = MIN_SPEED/speed;
            this.vel.x *= s; this.vel.y *= s; this.vel.z *= s;
        }

        this.pos.x += this.vel.x; this.pos.y += this.vel.y; this.pos.z += this.vel.z;
        this.acc = {x:0, y:0, z:0}; 
        
        if(this.bornTime > 0) this.bornTime -= 0.02; 
    }
}

// --- TEXT SPAWNING ---
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
    
    const startY = height * 0.5 + 100; 
    const spread = Math.min(width * 0.8, chars.length * 50); 
    const startX = -spread / 2; 

    chars.forEach((char, i) => {
        foodParticles.push({
            char: char,
            x: startX + (i * (spread / chars.length)) + (Math.random()-0.5)*40, 
            y: startY + (Math.random() * 100),
            vx: (Math.random() - 0.5) * 1.5,  
            vy: -2 - Math.random() * 2, 
            offset: Math.random() * 100,
            active: true
        });
    });
};

// --- AUDIO BRIDGE (THE AVIAN TRANSLATOR) ---
window.activeWordMode = false;

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
            window.activeWordMode = false;
            targetAtmosphere = WORD_BEHAVIOR.NEUTRAL;
            window.stopBreathStream(); 
            setTimeout(() => { subtitleMask.style.opacity='0'; setTimeout(()=>subtitleTrack.innerHTML='', 1000); }, 100); 
            return;
        }
        
        if(wordIndex > 0) spans[wordIndex-1].classList.remove('active');
        spans[wordIndex].classList.add('active');
        
        const spanCenter = spans[wordIndex].offsetLeft + (spans[wordIndex].offsetWidth / 2);
        subtitleTrack.style.transform = `translateX(${-spanCenter}px)`;
        
        // --- WORD ANALYSIS (BIOMIMICRY) ---
        const currentWord = words[wordIndex].toUpperCase();
        window.activeWordMode = true;

        let sharpCount = (currentWord.match(/[KTPXZGQ]/g) || []).length;
        let softCount = (currentWord.match(/[LMNRWVYAEIOU]/g) || []).length;
        
        if(sharpCount > softCount || currentWord.length < 4) {
            targetAtmosphere = WORD_BEHAVIOR.SHARP;
            let angle = Math.random() * Math.PI * 2;
            globalTurbulence = { 
                x: Math.cos(angle) * 2.0, 
                y: Math.sin(angle) * 2.0, 
                z: (Math.random()-0.5) * 1.5 
            };
            window.morphMouthShape('I'); 
        } else {
            targetAtmosphere = WORD_BEHAVIOR.FLOW;
            globalTurbulence = { x: 0, y: 0, z: 0 }; 
            window.morphMouthShape('O'); 
        }

        window.currentIntensity = 1.5 + (sharpCount * 0.2); 
        setTimeout(() => { window.currentIntensity = 1.0; }, 100);

        wordIndex++;
        let duration = Math.max(250, currentWord.length * 80) * speedMod;
        setTimeout(playNextWord, duration);
    }
    
    playNextWord();
};

// --- MAIN ANIMATION ---
window.initSymbiosisAnimation = function() {
    const canvas = document.getElementById('symbiosisCanvas');
    const container = document.getElementById('symbiosis-container');
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    let width, height;

    // FLOCK INIT
    const boids = [];
    for(let i=0; i<FLOCK_SIZE; i++) boids.push(new Boid());

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

    function lerp(start, end, amt) {
        return (1-amt)*start + amt*end;
    }

    let rotationX=0, rotationY=0;
    let time = 0;
    // Enhanced Mouse Object
    let realMouse = { 
        x: -1000, 
        y: -1000, 
        active: false,
        vx: 0,
        vy: 0,
        lastX: -1000,
        lastY: -1000
    };

    function handleMouse(cx, cy) {
        const r = container.getBoundingClientRect();
        let newX = (cx - r.left) - (width/2);
        let newY = (cy - r.top) - (height*0.35);
        
        // Calculate Velocity
        if(realMouse.active) {
            realMouse.vx = newX - realMouse.lastX;
            realMouse.vy = newY - realMouse.lastY;
        }
        
        realMouse.x = newX;
        realMouse.y = newY;
        realMouse.lastX = newX;
        realMouse.lastY = newY;
        realMouse.active = true;
    }

    // Touch Handling (Multi-touch awareness optional, usually primary is enough)
    container.addEventListener('mousemove', e => handleMouse(e.clientX, e.clientY));
    container.addEventListener('touchmove', e => {
        e.preventDefault(); // Stop scrolling
        handleMouse(e.touches[0].clientX, e.touches[0].clientY);
    }, {passive: false});
    
    container.addEventListener('touchend', () => { 
        realMouse.active = false; 
        realMouse.x=-1000; 
        realMouse.vx=0; 
        realMouse.vy=0; 
    });

    // Reset Velocity if mouse stops moving but is still present
    setInterval(() => {
        if(realMouse.active) {
            realMouse.vx *= 0.1;
            realMouse.vy *= 0.1;
        }
    }, 100);


    // PROJECTION 
    function project(b, cx, cy) {
        const fov = 550; 
        let x = b.pos.x, y = b.pos.y, z = b.pos.z;
        if(window.glitchMode) { x+=(Math.random()-0.5)*15; y+=(Math.random()-0.5)*15; }
        
        const x1=x*Math.cos(rotationY)-z*Math.sin(rotationY);
        const z1=z*Math.cos(rotationY)+x*Math.sin(rotationY);
        const y2=y*Math.cos(rotationX)-z1*Math.sin(rotationX);
        const z2=z1*Math.cos(rotationX)+y*Math.sin(rotationX);
        
        const scale = fov / (fov + z2 + 500);
        return { x: cx + x1*scale, y: cy + y2*scale, z: z2, scale: scale, boid: b };
    }

    function animate() {
        // A. TRAILS 
        if(window.glitchMode && Math.random() > 0.8) {
            ctx.fillStyle = `rgba(50, 0, 0, 0.2)`; ctx.fillRect(0,0,width,height);
        } else {
            ctx.fillStyle = 'rgba(5, 5, 8, 0.25)'; 
            ctx.fillRect(0,0,width,height);
        }

        ctx.globalCompositeOperation = 'lighter';

        // B. STATE INTERPOLATION
        currentAtmosphere.separation = lerp(currentAtmosphere.separation, targetAtmosphere.separation, 0.05);
        currentAtmosphere.alignment = lerp(currentAtmosphere.alignment, targetAtmosphere.alignment, 0.05);
        currentAtmosphere.speedMod = lerp(currentAtmosphere.speedMod, targetAtmosphere.speedMod, 0.05);
        currentAtmosphere.chaos = lerp(currentAtmosphere.chaos, targetAtmosphere.chaos, 0.05);

        // Palette
        let targetSet = window.PALETTES[window.currentMood] || window.PALETTES["NEUTRAL"];
        if (window.glitchMode) targetSet = { pri:{r:255,g:255,b:255}, sec:{r:255,g:0,b:0}, conn:{r:100,g:0,b:0} };
        lerpRGB(window.curPalette.pri, targetSet.pri, 0.05);
        lerpRGB(window.curPalette.sec, targetSet.sec, 0.05);
        lerpRGB(window.curPalette.conn, targetSet.conn, 0.05);

        const cx = width/2;
        const cy = height*0.35;
        time += 0.01; 
        
        rotationY = Math.sin(time*0.1) * 0.15; 
        rotationX = Math.sin(time*0.15)*0.1;
        
        pulseTime += 0.02;
        if(digestionGlow > 0) digestionGlow *= 0.94;

        // C. PHYSICS
        boids.forEach(b => b.update(boids, realMouse, width, height));

        // D. TEXT INGESTION
        if(window.feedingActive && foodParticles.length > 0) {
             for(let i=foodParticles.length-1; i>=0; i--) {
                 let fp = foodParticles[i];
                 fp.y += fp.vy;
                 fp.x += fp.vx + Math.sin(time*3 + fp.offset)*1.0; 
                 
                 if(Math.abs(fp.y) < 150 && Math.abs(fp.x) < 300) {
                     if(boids.length < MAX_FLOCK) {
                         let newB = new Boid(fp.x, fp.y, 0, true);
                         newB.vel.y = -2; 
                         boids.push(newB);
                     }
                     digestionGlow += 0.1;
                     eatenFoodCount++;
                     foodParticles.splice(i, 1);
                 } else if (fp.y < -height*0.6) {
                     foodParticles.splice(i, 1);
                 }
             }
        }

        // E. RENDER
        const proj = boids.map(b => project(b, cx, cy));

        ctx.lineWidth = 0.8;
        
        // Connections
        for(let i=0; i<proj.length; i++) {
            let p1 = proj[i];
            if(p1.scale < 0) continue;
            
            for(let j=1; j<5; j++) {
                let p2 = proj[(i+j*3)%proj.length]; // Stride
                let dx = p1.x - p2.x; 
                let dy = p1.y - p2.y;
                let d = Math.sqrt(dx*dx + dy*dy);
                let maxD = 60 * p1.scale;

                if(d < maxD) {
                    let alpha = (1 - d/maxD) * 0.3 * p1.scale;
                    
                    if (window.activeWordMode && currentAtmosphere.chaos > 1.0) {
                        alpha = 0.6 * p1.scale;
                    }
                    // Panic creates brighter connections
                    if (p1.boid.panicMode > 0) alpha += 0.3;

                    let c = window.curPalette.conn;
                    ctx.strokeStyle = `rgba(${Math.floor(c.r)},${Math.floor(c.g)},${Math.floor(c.b)},${alpha})`;
                    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                }
            }

            // Dot
            let cObj = p1.boid.type === 'pri' ? window.curPalette.pri : window.curPalette.sec;
            let alpha = Math.min(1, p1.scale * 1.2);
            let rad = (p1.boid.type === 'pri' ? 2 : 1.2) * p1.scale;

            if(p1.boid.bornTime > 0) { 
                cObj = {r:255, g:255, b:255}; 
                alpha = 1; 
                rad *= 2;
            }
            // Flash if panicking
            if(p1.boid.panicMode > 0) {
                 cObj = {r:255, g:100, b:100}; 
                 rad *= 1.2;
            }
            
            ctx.fillStyle = `rgba(${Math.floor(cObj.r)},${Math.floor(cObj.g)},${Math.floor(cObj.b)},${alpha})`;
            ctx.beginPath(); ctx.arc(p1.x, p1.y, rad, 0, Math.PI*2); ctx.fill();
        }

        // Glow
        if(digestionGlow > 0.05) {
            let r = 100 + digestionGlow*150;
            let grg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            let c = window.curPalette.pri;
            grg.addColorStop(0, `rgba(${Math.floor(c.r)},${Math.floor(c.g)},${Math.floor(c.b)},${digestionGlow*0.3})`);
            grg.addColorStop(1, "transparent");
            ctx.fillStyle = grg;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
        }

        // UI Labels
        ctx.globalCompositeOperation = 'source-over';
        ctx.font = "10px monospace";
        indicesList.forEach((lbl, i) => {
            let idx = Math.floor((i/indicesList.length) * proj.length);
            let p = proj[idx];
            if(p && p.scale > 0.6) { 
                let c = window.curPalette.sec;
                ctx.fillStyle = `rgba(${Math.floor(c.r)},${Math.floor(c.g)},${Math.floor(c.b)},${0.6})`;
                ctx.fillText(lbl, p.x+10, p.y+4);
            }
        });

        // Food Text
        if(window.feedingActive && foodParticles.length > 0) {
            ctx.font = "bold 20px 'Courier New'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            for(let fp of foodParticles) {
                let x = cx + fp.x;
                let y = cy + fp.y;
                
                ctx.save();
                ctx.translate(x, y);
                let shimmer = 0.5 + Math.sin(time*20)*0.5;
                let c = window.curPalette.pri;
                ctx.fillStyle = `rgba(${Math.floor(c.r)},${Math.floor(c.g)},${Math.floor(c.b)},${0.8+shimmer*0.2})`;
                ctx.fillText(fp.char, 0, 0);
                ctx.restore();
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
};
