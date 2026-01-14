// ============================================
// VISUALS MODULE (visuals.js) - ELASTIC SWARM OVERHAUL
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

// --- ALPHABET DEFINITIONS (Preserved) ---
const alphabetChords = {
    'A': [{x:0.5, y:0.2}, {x:0.2, y:0.8}, {x:0.8, y:0.8}],
    'E': [{x:0.2, y:0.2}, {x:0.2, y:0.8}, {x:0.8, y:0.2}, {x:0.8, y:0.5}, {x:0.8, y:0.8}],
    'I': [{x:0.5, y:0.2}, {x:0.5, y:0.8}, {x:0.3, y:0.2}, {x:0.7, y:0.2}, {x:0.3, y:0.8}, {x:0.7, y:0.8}],
    'O': [{x:0.5, y:0.2}, {x:0.2, y:0.5}, {x:0.5, y:0.8}, {x:0.8, y:0.5}],
    'U': [{x:0.2, y:0.2}, {x:0.2, y:0.8}, {x:0.5, y:0.9}, {x:0.8, y:0.8}, {x:0.8, y:0.2}],
    'B': [{x:0.2,y:0.2},{x:0.2,y:0.8},{x:0.5,y:0.35},{x:0.5,y:0.65},{x:0.8,y:0.2},{x:0.8,y:0.8}],
    'C': [{x:0.8,y:0.2},{x:0.2,y:0.5},{x:0.8,y:0.8}],
    'D': [{x:0.2,y:0.2},{x:0.2,y:0.8},{x:0.8,y:0.5}],
    'F': [{x:0.2,y:0.2},{x:0.2,y:0.8},{x:0.8,y:0.2},{x:0.6,y:0.5}],
    'G': [{x:0.8,y:0.2},{x:0.2,y:0.5},{x:0.8,y:0.8},{x:0.8,y:0.5},{x:0.6,y:0.5}],
    'H': [{x:0.2,y:0.2},{x:0.2,y:0.8},{x:0.8,y:0.2},{x:0.8,y:0.8},{x:0.5,y:0.5}],
    'J': [{x:0.8,y:0.2},{x:0.8,y:0.8},{x:0.5,y:0.9},{x:0.2,y:0.8}],
    'K': [{x:0.2,y:0.2},{x:0.2,y:0.8},{x:0.8,y:0.2},{x:0.8,y:0.8},{x:0.2,y:0.5}],
    'L': [{x:0.2,y:0.2},{x:0.2,y:0.8},{x:0.8,y:0.8}],
    'M': [{x:0.2,y:0.8},{x:0.2,y:0.2},{x:0.5,y:0.5},{x:0.8,y:0.2},{x:0.8,y:0.8}],
    'N': [{x:0.2,y:0.8},{x:0.2,y:0.2},{x:0.8,y:0.8},{x:0.8,y:0.2}],
    'P': [{x:0.2,y:0.8},{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.8,y:0.5},{x:0.2,y:0.5}],
    'Q': [{x:0.5,y:0.2},{x:0.2,y:0.5},{x:0.5,y:0.8},{x:0.8,y:0.5},{x:0.8,y:0.8}],
    'R': [{x:0.2,y:0.8},{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.8,y:0.5},{x:0.2,y:0.5},{x:0.8,y:0.8}],
    'S': [{x:0.8,y:0.2},{x:0.2,y:0.25},{x:0.8,y:0.75},{x:0.2,y:0.8}],
    'T': [{x:0.5,y:0.2},{x:0.5,y:0.8},{x:0.2,y:0.2},{x:0.8,y:0.2}],
    'V': [{x:0.2,y:0.2},{x:0.5,y:0.8},{x:0.8,y:0.2}],
    'W': [{x:0.2,y:0.2},{x:0.2,y:0.8},{x:0.5,y:0.5},{x:0.8,y:0.8},{x:0.8,y:0.2}],
    'X': [{x:0.2,y:0.2},{x:0.8,y:0.8},{x:0.5,y:0.5},{x:0.8,y:0.2},{x:0.2,y:0.8}],
    'Y': [{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.5,y:0.5},{x:0.5,y:0.8}],
    'Z': [{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.2,y:0.8},{x:0.8,y:0.8}],
    '0': [{x:0.5,y:0.1},{x:0.1,y:0.5},{x:0.5,y:0.9},{x:0.9,y:0.5},{x:0.5,y:0.5}],
    '1': [{x:0.5,y:0.1},{x:0.5,y:0.9},{x:0.3,y:0.9},{x:0.7,y:0.9}],
    '2': [{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.8,y:0.5},{x:0.2,y:0.5},{x:0.2,y:0.8},{x:0.8,y:0.8}],
    '3': [{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.5,y:0.5},{x:0.8,y:0.8},{x:0.2,y:0.8}],
    '4': [{x:0.2,y:0.2},{x:0.2,y:0.5},{x:0.8,y:0.5},{x:0.8,y:0.2},{x:0.8,y:0.8}],
    '5': [{x:0.8,y:0.2},{x:0.2,y:0.2},{x:0.2,y:0.5},{x:0.8,y:0.5},{x:0.8,y:0.8},{x:0.2,y:0.8}],
    '6': [{x:0.8,y:0.2},{x:0.2,y:0.5},{x:0.2,y:0.8},{x:0.8,y:0.8},{x:0.8,y:0.5}],
    '7': [{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.5,y:0.8}],
    '8': [{x:0.5,y:0.3},{x:0.5,y:0.7},{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.2,y:0.5},{x:0.8,y:0.5},{x:0.2,y:0.8},{x:0.8,y:0.8}],
    '9': [{x:0.5,y:0.5},{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.8,y:0.5},{x:0.2,y:0.8}],
    '.': [{x:0.5,y:0.8},{x:0.5,y:0.9}],
    ',': [{x:0.5,y:0.8},{x:0.4,y:0.95}],
    '!': [{x:0.5,y:0.2},{x:0.5,y:0.6},{x:0.5,y:0.9}],
    '?': [{x:0.2,y:0.2},{x:0.8,y:0.2},{x:0.8,y:0.5},{x:0.5,y:0.6},{x:0.5,y:0.9}],
    '-': [{x:0.2,y:0.5},{x:0.8,y:0.5}],
    '_': [{x:0.1,y:0.9},{x:0.9,y:0.9}],
    ' ': [{x:0.5,y:0.5},{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}],
    ':': [{x:0.5,y:0.3},{x:0.5,y:0.7}],
    ';': [{x:0.5,y:0.3},{x:0.5,y:0.7},{x:0.4,y:0.8}],
    '\'':[{x:0.5,y:0.2},{x:0.5,y:0.3}],
    '"': [{x:0.4,y:0.2},{x:0.6,y:0.2}],
    '/': [{x:0.8,y:0.2},{x:0.2,y:0.8}],
    '\\':[{x:0.2,y:0.2},{x:0.8,y:0.8}],
    '(': [{x:0.6,y:0.2},{x:0.4,y:0.5},{x:0.6,y:0.8}],
    ')': [{x:0.4,y:0.2},{x:0.6,y:0.5},{x:0.4,y:0.8}],
    '@': [{x:0.5,y:0.5},{x:0.8,y:0.5},{x:0.8,y:0.2},{x:0.2,y:0.2},{x:0.2,y:0.8},{x:0.6,y:0.8}],
};

// --- FOOD SYSTEM ---
window.spawnFoodText = (text) => {
    foodParticles = [];
    eatenFoodCount = 0;
    const chars = text.split('');
    totalFoodCount = chars.length;
    window.feedingActive = true;
    
    // Bloat organism based on text length
    if(text.length > 5) {
        bloatFactor = 1.0 + (Math.min(text.length, 50) * 0.008);
    }

    const canvas = document.getElementById('symbiosisCanvas');
    const width = canvas.width;
    const height = canvas.height;

    // Start lower for "Rising" effect
    const startY = height + 100; 
    const spread = Math.min(width * 0.9, chars.length * 40); 
    const startX = (width - spread) / 2;

    chars.forEach((char, i) => {
        foodParticles.push({
            char: char,
            x: startX + (i * (spread / chars.length)) + (Math.random()-0.5)*50, 
            y: startY + (Math.random() * 150),
            vx: (Math.random() - 0.5) * 2,  
            vy: -5 - Math.random() * 5, // Fast upward velocity
            drag: 0.98,
            swirlPhase: Math.random() * Math.PI * 2
        });
    });
};

// --- AUDIO/SPEAKING TRIGGER ---
window.speak = function(text) {
    window.feedingActive = false; eatenFoodCount = 0; totalFoodCount = 0;
    window.initAudio(); window.startBreathStream();
    
    // UI SUBTITLES
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
        
        // Subtitle Scroll
        const spanCenter = spans[wordIndex].offsetLeft + (spans[wordIndex].offsetWidth / 2);
        subtitleTrack.style.transform = `translateX(${-spanCenter}px)`;
        
        const chars = words[wordIndex].split('');
        let charIndex = 0;
        
        function playNextChar() {
            if (charIndex >= chars.length) { wordIndex++; setTimeout(playNextWord, 150 * speedMod); return; }
            const char = chars[charIndex].toUpperCase();
            
            // TRIGGERS VISUAL SHAPE
            window.activeChord = alphabetChords[char] || [{x:0.5, y:0.5}];
            
            // TRIGGERS AUDIO FORMANT
            window.morphMouthShape(char);
            window.currentIntensity = 1.5; setTimeout(() => { window.currentIntensity = 1.0; }, 50);
            
            charIndex++; 
            setTimeout(playNextChar, 80 * speedMod);
        }
        playNextChar();
    }
    playNextWord();
};

// --- ANIMATION ENGINE ---
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

    // --- PARTICLE CLASS ---
    class Particle {
        constructor(type) {
            // Random start pos
            this.x = (Math.random()-0.5) * 300;
            this.y = (Math.random()-0.5) * 300;
            this.z = (Math.random()-0.5) * 300;
            
            // "Anchor" position (The Sphere Shape)
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 180 + Math.random() * 40;
            this.anchorX = r * Math.sin(phi) * Math.cos(theta);
            this.anchorY = r * Math.sin(phi) * Math.sin(theta);
            this.anchorZ = r * Math.cos(phi);
            
            this.vx = 0; this.vy = 0; this.vz = 0;
            this.type = type; // 'pri' or 'sec' for coloring
        }
    }

    const numPoints = 180;
    const particles = [];
    for(let i=0; i<numPoints; i++) particles.push(new Particle(i%2===0 ? 'pri' : 'sec'));

    let rotationX=0, rotationY=0;
    let time = 0;
    let realMouse = { x: -1000, y: -1000, active: false };

    // MOUSE TRACKING
    function handleMouse(cx, cy) {
        const rect = canvas.getBoundingClientRect();
        realMouse.x = cx - rect.left - (width/2);
        realMouse.y = cy - rect.top - (height*0.35);
        realMouse.active = true;
    }
    container.addEventListener('mousemove', e => handleMouse(e.clientX, e.clientY));
    container.addEventListener('touchmove', e => handleMouse(e.touches[0].clientX, e.touches[0].clientY));
    container.addEventListener('touchend', () => { realMouse.active = false; realMouse.x = -1000; });

    // COLOR LERPING
    function lerpRGB(curr, target, factor) {
        curr.r += (target.r - curr.r) * factor;
        curr.g += (target.g - curr.g) * factor;
        curr.b += (target.b - curr.b) * factor;
    }

    function updatePhysics() {
        const breath = 1 + Math.sin(time * 2.5) * 0.08;
        const scale = 0.8 * breath * bloatFactor;
        
        // Gradually return bloom to normal
        if(bloatFactor > 1.0) bloatFactor -= 0.002;
        if(digestionGlow > 0) digestionGlow *= 0.94;

        // Mouse Repulsion Calculations (Pre-calc for performance)
        let mouseVec = {x:0, y:0};
        let mouseActive = false;
        if (realMouse.active && realMouse.x > -900) {
            mouseActive = true;
        }

        particles.forEach((p, i) => {
            // 1. ANCHOR FORCE (The Form)
            // Default target is the sphere anchor
            let tx = p.anchorX * scale;
            let ty = p.anchorY * scale;
            let tz = p.anchorZ * scale;
            let strength = 0.02; // Elasticity

            // 2. SPEAKING OVERRIDE (Shape Shifting)
            if(window.activeChord && window.activeChord.length > 0) {
                // Determine which point of the letter this particle maps to
                const chordIdx = i % window.activeChord.length;
                const pt = window.activeChord[chordIdx];
                
                // Map 0..1 to Screen dimensions approx
                // We add Z-depth noise so it's a 3D cloud, not a flat 2D drawing
                tx = (pt.x - 0.5) * 350 * scale;
                ty = (pt.y - 0.5) * 350 * scale;
                tz = (Math.sin(i * 132.1) * 50); // Z-noise
                
                strength = 0.08; // Stronger pull when speaking
            }
            // 3. FEEDING OVERRIDE (Diving)
            else if(window.feedingActive && foodParticles.length > 0) {
                 // The swarm dives towards the average food position
                 // But we add noise so they don't all look identical
                 let foodTarget = foodParticles[0]; // Chase the leading food
                 if(foodTarget) {
                     let fx = foodTarget.x - (width/2);
                     let fy = foodTarget.y - (height*0.35);
                     
                     // If particle is close to food, orbit it
                     if(Math.abs(p.y - fy) < 100) {
                        tx = fx + Math.sin(time*5 + i)*50;
                        ty = fy + Math.cos(time*5 + i)*50;
                        strength = 0.05;
                     } else {
                         // Otherwise anchor drifts down
                         ty += 100;
                     }
                 }
            }

            // Spring Physics
            const ax = (tx - p.x) * strength;
            const ay = (ty - p.y) * strength;
            const az = (tz - p.z) * strength;

            p.vx += ax; p.vy += ay; p.vz += az;

            // 4. FLOCKING (Separation / Noise)
            // Cheap "nearby" check using index proximity (since array is randomized)
            // This gives 'organic' turbulence without O(N^2) cost
            let noise = Math.sin(time * 3 + i * 0.1) * 0.5;
            p.vx += noise; 
            p.vy += Math.cos(time * 2 + i)*0.5;

            // 5. MOUSE INTERACTION (Repulsion)
            if(mouseActive) {
                // Approximate 3D mouse pos by assuming mouse is at z=0 plane projected
                // Simple 2D distance check on the x/y plane relative to center
                let dx = p.x - realMouse.x;
                let dy = p.y - realMouse.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < 180) {
                    let force = (180 - dist) / 180;
                    let angle = Math.atan2(dy, dx);
                    // Violent push
                    p.vx += Math.cos(angle) * force * 15; 
                    p.vy += Math.sin(angle) * force * 15;
                    p.vz += force * 10; // Push back in Z too
                }
            }

            // Damping (Friction)
            p.vx *= 0.92; p.vy *= 0.92; p.vz *= 0.92;

            // Update Position
            p.x += p.vx; p.y += p.vy; p.z += p.vz;
        });
    }

    function project(p, cx, cy) {
        const fov = 450;
        // Rotation
        let x = p.x, y = p.y, z = p.z;
        
        // Glitch jitter
        if(window.glitchMode) { 
            x += (Math.random()-0.5)*15; 
            y += (Math.random()-0.5)*15; 
        }

        const x1 = x*Math.cos(rotationY) - z*Math.sin(rotationY);
        const z1 = z*Math.cos(rotationY) + x*Math.sin(rotationY);
        const y2 = y*Math.cos(rotationX) - z1*Math.sin(rotationX);
        const z2 = z1*Math.cos(rotationX) + y*Math.sin(rotationX);

        const scale = fov / (fov + z2 + 450);
        return {
            x: cx + x1 * scale,
            y: cy + y2 * scale,
            z: z2,
            scale: scale,
            type: p.type
        };
    }

    function animate() {
        // Clear
        if(window.glitchMode && Math.random()>0.8) {
            ctx.fillStyle = 'rgba(50,0,0,0.1)'; ctx.fillRect(0,0,width,height);
        } else {
            ctx.clearRect(0,0,width,height);
        }

        // Color Handling
        let targetSet = window.PALETTES[window.currentMood] || window.PALETTES["NEUTRAL"];
        if(window.glitchMode) targetSet = { pri:{r:255,g:255,b:255}, sec:{r:255,g:0,b:0}, conn:{r:100,g:0,b:0} };
        
        lerpRGB(window.curPalette.pri, targetSet.pri, 0.05);
        lerpRGB(window.curPalette.sec, targetSet.sec, 0.05);
        lerpRGB(window.curPalette.conn, targetSet.conn, 0.05);

        // Global transform
        const cx = width / 2;
        const cy = height * 0.35;
        
        rotationY += 0.003; 
        rotationX = Math.sin(time * 0.5) * 0.15;
        time += 0.015;
        pulseTime += 0.02;

        updatePhysics();
        
        // Project all points
        const projPoints = particles.map(p => project(p, cx, cy));

        // RENDER: LINES (The Web)
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineWidth = 1.2;

        const pulseRadius = (pulseTime * 60) % 600;

        // Optimization: Only connect if close in array (Spatial Hashing alternative)
        // Since array is random, index proximity != spatial proximity, 
        // BUT it creates a "chaotic web" which looks cool.
        // Let's do a semi-brute force on a subset to get better lines.
        
        for(let i=0; i<projPoints.length; i++) {
            let p1 = projPoints[i];
            if(p1.scale < 0) continue; // Behind camera clipping

            // Draw Node
            let cObj = p1.type === 'pri' ? window.curPalette.pri : window.curPalette.sec;
            let alpha = Math.min(1, p1.scale * 0.8);
            ctx.fillStyle = `rgba(${Math.floor(cObj.r)},${Math.floor(cObj.g)},${Math.floor(cObj.b)},${alpha})`;
            ctx.beginPath(); 
            ctx.arc(p1.x, p1.y, 2.5 * p1.scale, 0, Math.PI*2); 
            ctx.fill();

            // Draw Connections
            // Check nearest 15 neighbors in array for efficiency + randomness
            for(let j=1; j<=15; j++) {
                let p2 = projPoints[(i+j) % projPoints.length];
                
                let dx = p1.x - p2.x;
                let dy = p1.y - p2.y;
                let distSq = dx*dx + dy*dy;
                let maxDist = 80 * p1.scale;

                if(distSq < maxDist*maxDist) {
                    // Pulse Math
                    let centerDist = Math.sqrt(Math.pow(p1.x - cx, 2) + Math.pow(p1.y - cy, 2));
                    let ripple = 0;
                    if (Math.abs(centerDist - pulseRadius) < 40) { 
                        ripple = 0.6 * (1 - (Math.abs(centerDist - pulseRadius)/40)); 
                    }

                    let lineAlpha = (1 - (Math.sqrt(distSq)/maxDist)) * 0.3 + ripple;
                    let lc = window.curPalette.conn;
                    
                    ctx.strokeStyle = `rgba(${Math.floor(lc.r)},${Math.floor(lc.g)},${Math.floor(lc.b)},${lineAlpha})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        // BACKGROUND GLOW (Digestion)
        if(digestionGlow > 0.01) {
            const glowR = 100 + (digestionGlow * 150);
            const grg = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
            const gc = window.curPalette.pri;
            grg.addColorStop(0, `rgba(${gc.r},${gc.g},${gc.b},${digestionGlow * 0.3})`);
            grg.addColorStop(1, `rgba(${gc.r},${gc.g},${gc.b},0)`);
            ctx.fillStyle = grg;
            ctx.globalCompositeOperation = 'screen'; // Softer glow
            ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI*2); ctx.fill();
            ctx.globalCompositeOperation = 'lighter'; // Switch back
        }

        // UI LABELS
        ctx.globalCompositeOperation = 'source-over';
        ctx.font = "10px monospace";
        indicesList.forEach((lbl, i) => {
            // Attach to specific stable particles
            let idx = Math.floor((i/indicesList.length) * numPoints);
            let p = projPoints[idx];
            if(p && p.z > -100) {
                 ctx.fillStyle = `rgba(255,255,255,${p.scale})`;
                 ctx.fillText(lbl, p.x + 10, p.y);
                 // Little line
                 ctx.strokeStyle = `rgba(255,255,255,0.3)`;
                 ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x+8, p.y); ctx.stroke();
            }
        });

        // FOOD PARTICLES
        if(window.feedingActive && foodParticles.length > 0) {
            ctx.font = "bold 20px 'Courier New'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            for (let i = foodParticles.length - 1; i >= 0; i--) {
                let fp = foodParticles[i];
                
                // Physics
                fp.vy += 0.1; // Gravity? No, we want them sucked in.
                // Pull towards center
                let dx = cx - fp.x;
                let dy = cy - fp.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                // Gravity Well Force
                let force = 500 / (dist + 10); // Stronger as it gets closer
                fp.vx += (dx/dist) * force * 0.05;
                fp.vy += (dy/dist) * force * 0.05;

                fp.x += fp.vx;
                fp.y += fp.vy;
                
                // Check Collision (Eating)
                if(dist < 40) {
                    foodParticles.splice(i, 1);
                    eatenFoodCount++;
                    digestionGlow = Math.min(digestionGlow + 0.5, 2.0); // Flash!
                    continue;
                }

                // Render
                ctx.save();
                ctx.translate(fp.x, fp.y);
                let shimmer = 0.5 + Math.sin(time*20)*0.5;
                let c = window.curPalette.pri;
                ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.8 + shimmer*0.2})`;
                ctx.fillText(fp.char, 0, 0);
                ctx.restore();
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
}
