// ============================================
// VISUALS MODULE (visuals.js) - ADAPTED SWARM
// ============================================

let foodParticles = []; 
window.feedingActive = false;
let totalFoodCount = 0;
let eatenFoodCount = 0;
let bloatFactor = 1.0; 
let pulseTime = 0;     
let digestionGlow = 0; 

// Global Access to Palette
window.curPalette = { pri: {r:255, g:115, b:0}, sec: {r:200, g:100, b:50}, conn: {r:255, g:160, b:0} };

let indicesList=["SYSTEM", "LOCKED", "SECURE", "AUTH", "REQUIRED", "WAIT", "KEY", "VOID"];
window.updateKeywords = (newList) => {
    if(newList && newList.length > 0) indicesList = newList;
};

// ... (Keep existing Alphabet Chords from original code) ...
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
            
            window.activeChord = alphabetChords[char] || [{x:0.5, y:0.5},{x:Math.random(),y:Math.random()}];
            
            window.morphMouthShape(char);
            window.currentIntensity = 1.5; setTimeout(() => { window.currentIntensity = 1.0; }, 50);
            
            charIndex++; 
            setTimeout(playNextChar, 80 * speedMod);
        }
        playNextChar();
    }
    playNextWord();
};

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

    // 1. REPLACED POINT CLASS WITH FLOCKING PARTICLE
    class Particle { 
        constructor(type) { 
            this.x = (Math.random()-0.5)*100; 
            this.y = (Math.random()-0.5)*100; 
            this.z = (Math.random()-0.5)*100; 
            this.vx = (Math.random()-0.5)*2;
            this.vy = (Math.random()-0.5)*2;
            this.vz = (Math.random()-0.5)*2;
            this.type = type; // "public" or "private"
        } 
    }

    const numPoints = 180; // Total swarm size
    const particles = [];
    
    // Create mix of particles to maintain dual-color aesthetic
    for(let i=0; i<numPoints; i++) {
        particles.push(new Particle(i % 2 === 0 ? 'public' : 'private'));
    }
    
    let rotationX=0, rotationY=0, realMouse={x:-1000,y:-1000};
    window.activeChord = [];
    window.currentIntensity = 1.0;

    container.addEventListener('mousemove', e => {
        const r = container.getBoundingClientRect(); realMouse.x=e.clientX-r.left; realMouse.y=e.clientY-r.top;
    });
    container.addEventListener('touchmove', e => {
        const r = container.getBoundingClientRect(); realMouse.x=e.touches[0].clientX-r.left; realMouse.y=e.touches[0].clientY-r.top;
    });
    container.addEventListener('touchend', () => { realMouse.x=-1000; realMouse.y=-1000; });

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

    // 2. NEW FLOCKING LOGIC (Replacing generatePaths)
    function updateFlocking(time) {
        const breath = 1 + Math.sin(time * 2) * 0.05;
        let scale = Math.min(width, height) * 0.35 * breath * bloatFactor;
        if(bloatFactor > 1.0) bloatFactor -= 0.001;
        if(digestionGlow > 0) digestionGlow *= 0.92;
        if(digestionGlow < 0.01) digestionGlow = 0;

        const centerForce = 0.003;
        const neighborDist = 60;
        
        for(let i=0; i<numPoints; i++) {
            let p = particles[i];
            
            // Forces
            let sepX=0, sepY=0, sepZ=0;
            let aliX=0, aliY=0, aliZ=0;
            let cohX=0, cohY=0, cohZ=0;
            let count = 0;

            // Simple O(N^2) flocking is fine for <200 particles
            for(let j=0; j<numPoints; j++) {
                if(i===j) continue;
                let other = particles[j];
                let dx = p.x - other.x;
                let dy = p.y - other.y;
                let dz = p.z - other.z;
                let d = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (d < neighborDist) {
                    // Separation
                    sepX += dx / d; sepY += dy / d; sepZ += dz / d;
                    // Alignment
                    aliX += other.vx; aliY += other.vy; aliZ += other.vz;
                    // Cohesion
                    cohX += other.x; cohY += other.y; cohZ += other.z;
                    count++;
                }
            }

            if(count > 0) {
                // Cohesion is relative to position
                cohX = (cohX/count) - p.x;
                cohY = (cohY/count) - p.y;
                cohZ = (cohZ/count) - p.z;
                
                // Alignment average
                aliX /= count; aliY /= count; aliZ /= count;
            }

            // Apply Flocking Rules
            p.vx += (sepX * 1.5 + aliX * 0.8 + cohX * 0.5) * 0.02;
            p.vy += (sepY * 1.5 + aliY * 0.8 + cohY * 0.5) * 0.02;
            p.vz += (sepZ * 1.5 + aliZ * 0.8 + cohZ * 0.5) * 0.02;

            // Global Center Attraction (Keeps the swarm together like the original sphere)
            p.vx += (-p.x) * centerForce;
            p.vy += (-p.y) * centerForce;
            p.vz += (-p.z) * centerForce;

            // 3. TARGETING (Replaces Spring Target)
            // If Speaking, pull to activeChord shapes
            if(window.activeChord && window.activeChord.length > 0) {
                // Determine target point based on index
                let targetIdx = Math.floor((i / numPoints) * window.activeChord.length);
                let tPt = window.activeChord[targetIdx];
                // Map 0..1 to Screen Space approx
                let tx = (tPt.x - 0.5) * scale * 2.5;
                let ty = (tPt.y - 0.5) * scale * 2.5;
                
                // Strong Pull
                p.vx += (tx - p.x) * 0.1;
                p.vy += (ty - p.y) * 0.1;
                p.vz += (0 - p.z) * 0.1; // Flatten z
                
                // Dampen velocity for cleaner shapes
                p.vx *= 0.85; p.vy *= 0.85; p.vz *= 0.85;
            } 
            // If Feeding, swarm food
            else if(window.feedingActive && foodParticles.length > 0 && i % 3 === 0) {
                 // Some particles break formation to eat
                 let nearest = foodParticles[0];
                 // (Simple check for first particle for chaos factor)
                 let tx = nearest.x - (width/2); // Local space
                 let ty = nearest.y - (height*0.35);
                 p.vx += (tx - p.x) * 0.04;
                 p.vy += (ty - p.y) * 0.04;
            }

            // Damping / Friction
            p.vx *= 0.94; p.vy *= 0.94; p.vz *= 0.94;
            
            // Move
            p.x += p.vx; p.y += p.vy; p.z += p.vz;
        }
    }

    function project(p,cx,cy) {
        const fov=400;
        let x = p.x, y = p.y, z = p.z;
        if(window.glitchMode) { x += (Math.random()-0.5)*10; y += (Math.random()-0.5)*10; }
        const x1=x*Math.cos(rotationY)-z*Math.sin(rotationY), z1=z*Math.cos(rotationY)+x*Math.sin(rotationY);
        const y2=y*Math.cos(rotationX)-z1*Math.sin(rotationX), z2=z1*Math.cos(rotationX)+y*Math.sin(rotationX);
        const scale=fov/(fov+z2+400); return {x:cx+x1*scale, y:cy+y2*scale, z:z2, type: p.type};
    }

    // 4. ADAPTED PHYSICS (Mouse Interaction)
    function applyInteraction(p, forces) {
        let r = 220;
        forces.forEach(f => {
            const dx=p.x-f.x, dy=p.y-f.y, dist=Math.sqrt(dx*dx+dy*dy);
            if(dist<r) {
                // Original repulsion logic, applied to velocity
                const push=((r-dist)/r)**2 * (5.0 * window.currentIntensity);
                const a=Math.atan2(dy,dx); 
                p.vx += Math.cos(a)*push * 0.5; // Mild push to boid
                p.vy += Math.sin(a)*push * 0.5;
            }
        });
    }

    let time=0;
    function animate() {
        if(window.glitchMode && Math.random() > 0.7) {
            ctx.fillStyle = `rgba(${Math.random()*50}, 0, 0, 0.1)`;
            ctx.fillRect(0,0,width,height);
            ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
        } else { ctx.clearRect(0,0,width,height); }
        
        ctx.setTransform(1,0,0,1,0,0);
        ctx.globalCompositeOperation='lighter'; // PRESERVED: This is key to the original look
        
        updateColorLogic();
        const cx=width/2, cy=height * 0.35;
        rotationY+=0.002; rotationX=Math.sin(time*0.5)*0.2; time+=0.01;
        
        pulseTime += 0.02; 
        let pulseRadius = (pulseTime * 50) % 600; 

        // Update Physics
        updateFlocking(time);
        
        // Project Points
        const proj = particles.map(p => {
             // 2D projection
             const pr = project(p,cx,cy);
             // Interaction (Mouse) - mapped roughly to 2D
             if(realMouse.x > -100) {
                 const dx = pr.x - realMouse.x;
                 const dy = pr.y - realMouse.y;
                 const d = Math.sqrt(dx*dx + dy*dy);
                 if(d < 150) {
                      const force = (150-d)/150;
                      const ang = Math.atan2(dy, dx);
                      p.vx += Math.cos(ang) * force * 2.0;
                      p.vy += Math.sin(ang) * force * 2.0;
                 }
             }
             return pr;
        });

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

        // 5. RENDER - Maintaining the "Mesh" look using proximity
        ctx.lineWidth=1;
        
        // Connect nearby points to form the "Murmuration Mesh"
        for(let i=0; i<proj.length; i++) {
            let p1 = proj[i];
            if(p1.z > -200) {
                // Optimization: Check next few neighbors (since array is random mix, this is random connections)
                // In a real spatial hash this is faster, but for 180 points, nested loop is fine
                for(let j=i+1; j<proj.length; j++) {
                    let p2 = proj[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    // Connection Distance Threshold (Dynamic based on depth)
                    if(dist < 70) { 
                        ctx.beginPath(); 
                        
                        // PRESERVED: The Pulse Logic
                        let centerDist = Math.sqrt(Math.pow(p1.x - cx, 2) + Math.pow(p1.y - cy, 2));
                        let pulseBright = 0;
                        if (Math.abs(centerDist - pulseRadius) < 50) { pulseBright = 0.5 * (1 - (Math.abs(centerDist - pulseRadius)/50)); }
                        
                        const alpha = ((1-dist/70)*0.4 + pulseBright) * 0.8;
                        
                        // Use connection color
                        const r = Math.floor(window.curPalette.conn.r);
                        const g = Math.floor(window.curPalette.conn.g);
                        const b = Math.floor(window.curPalette.conn.b);
                        ctx.strokeStyle=`rgba(${r},${g},${b},${Math.min(1, alpha)})`;
                        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                    }
                }
            }
        }

        // Draw Nodes (The Particles themselves)
        proj.forEach(p => {
             const colObj = p.type === 'public' ? window.curPalette.pri : window.curPalette.sec;
             const r = Math.floor(colObj.r);
             const g = Math.floor(colObj.g);
             const b = Math.floor(colObj.b);
             ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
             ctx.beginPath();
             ctx.fillRect(p.x, p.y, 2, 2); // Preserved strict pixel aesthetic
        });

        ctx.globalCompositeOperation='source-over'; ctx.font="11px monospace"; ctx.textAlign="left";
        
        indicesList.forEach((lbl, i) => {
            const p = proj[Math.floor((i/indicesList.length)*numPoints)];
            if(p && p.z>-300) {
                const r = Math.floor(window.curPalette.sec.r);
                const g = Math.floor(window.curPalette.sec.g);
                const b = Math.floor(window.curPalette.sec.b);
                ctx.fillStyle=`rgba(${r},${g},${b},0.8)`;
                ctx.fillText(lbl, p.x+10, p.y+4); ctx.fillRect(p.x-1,p.y-1,2,2);
            }
        });

        if(window.feedingActive && foodParticles.length > 0) {
            ctx.font = "bold 20px 'Courier New'";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const absorptionRadius = 90 * bloatFactor; 

            for (let i = foodParticles.length - 1; i >= 0; i--) {
                let fp = foodParticles[i];
                const dx = cx - fp.x; const dy = cy - fp.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                fp.vx += Math.sin(time * 3 + fp.offset) * 0.15; fp.vy += Math.cos(time * 2 + fp.offset) * 0.15;
                let pullStrength = 0;
                if (dist > 300) pullStrength = 0.15; else if (dist > 150) pullStrength = 0.4; else pullStrength = 1.2;                   
                fp.vx += (dx / dist) * pullStrength; fp.vy += (dy / dist) * pullStrength;
                if (dist > 50) { const swirlForce = 0.25; fp.vx += -(dy / dist) * swirlForce * fp.swirlDir; fp.vy += (dx / dist) * swirlForce * fp.swirlDir; }
                fp.vx *= fp.friction; fp.vy *= fp.friction; fp.x += fp.vx; fp.y += fp.vy;
                let scale = 1; let alpha = 1; let colorLerp = 0; 

                if (dist < absorptionRadius) {
                    scale = dist / absorptionRadius; alpha = Math.pow(scale, 0.5); colorLerp = 1 - scale; 
                    if (dist < 10 || scale < 0.1) {
                        foodParticles.splice(i, 1); eatenFoodCount++; 
                        digestionGlow = Math.min(digestionGlow + 0.3, 1.5);
                        continue; 
                    }
                }
                const drawScale = scale * (1 + Math.sin(time * 15 + fp.offset)*0.15);
                ctx.save(); ctx.translate(fp.x, fp.y); ctx.scale(drawScale, drawScale);
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
