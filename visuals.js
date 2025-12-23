// ============================================
// VISUALS MODULE (visuals.js)
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

// ... (Alphabet Chords from previous code) ...
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

    class Point3D { constructor(x, y, z) { this.x=x; this.y=y; this.z=z; } }
    const numPoints=160, publicPath=[], privatePath=[]; 
    const publicSprings=Array.from({length:numPoints},()=>({x:0,y:0,vx:0,vy:0}));
    const privateSprings=Array.from({length:numPoints},()=>({x:0,y:0,vx:0,vy:0}));
    
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

    function generatePaths(time) {
        publicPath.length=0; privatePath.length=0;
        const breath = 1 + Math.sin(time * 2) * 0.05;
        let scale = Math.min(width, height) * 0.35 * breath * bloatFactor;
        if(bloatFactor > 1.0) bloatFactor -= 0.001;
        if(digestionGlow > 0) digestionGlow *= 0.92;
        if(digestionGlow < 0.01) digestionGlow = 0;

        for(let i=0; i<numPoints; i++) {
            const t = (i/numPoints)*Math.PI*2 + time*0.2;
            const p=2, q=3, r=0.4, R=1;
            publicPath.push(new Point3D(scale*(R+r*Math.cos(q*t))*Math.cos(p*t), scale*(R+r*Math.cos(q*t))*Math.sin(p*t), scale*(r*Math.sin(q*t))));
            const t2 = t*1.5 + time*0.5;
            privatePath.push(new Point3D(scale*1.2*Math.sin(5*t2+time*0.1), scale*1.2*Math.sin(4*t2), scale*1.2*Math.sin(3*t2+time*0.2)));
        }
    }

    function project(p,cx,cy) {
        const fov=400;
        let x = p.x, y = p.y, z = p.z;
        if(window.glitchMode) { x += (Math.random()-0.5)*10; y += (Math.random()-0.5)*10; }
        const x1=x*Math.cos(rotationY)-z*Math.sin(rotationY), z1=z*Math.cos(rotationY)+x*Math.sin(rotationY);
        const y2=y*Math.cos(rotationX)-z1*Math.sin(rotationX), z2=z1*Math.cos(rotationX)+y*Math.sin(rotationX);
        const scale=fov/(fov+z2+400); return {x:cx+x1*scale, y:cy+y2*scale, z:z2};
    }

    function updatePhysics(p, spring, forces) {
        let tx=0, ty=0, r=220;
        forces.forEach(f => {
            const dx=p.x-f.x, dy=p.y-f.y, dist=Math.sqrt(dx*dx+dy*dy);
            if(dist<r) {
                const push=((r-dist)/r)**2 * (90*window.currentIntensity);
                const a=Math.atan2(dy,dx); tx+=Math.cos(a)*push; ty+=Math.sin(a)*push;
            }
        });
        spring.vx=(spring.vx+(tx-spring.x)*0.05)*0.9; spring.vy=(spring.vy+(ty-spring.y)*0.05)*0.9;
        spring.x+=spring.vx; spring.y+=spring.vy; p.x+=spring.x; p.y+=spring.y;
    }

    let time=0;
    function animate() {
        if(window.glitchMode && Math.random() > 0.7) {
            ctx.fillStyle = `rgba(${Math.random()*50}, 0, 0, 0.1)`;
            ctx.fillRect(0,0,width,height);
            ctx.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
        } else { ctx.clearRect(0,0,width,height); }
        ctx.setTransform(1,0,0,1,0,0);
        ctx.globalCompositeOperation='lighter';
        
        updateColorLogic();
        const cx=width/2, cy=height * 0.35;
        rotationY+=0.002; rotationX=Math.sin(time*0.5)*0.2; time+=0.01;
        
        pulseTime += 0.02; 
        let pulseRadius = (pulseTime * 50) % 600; 

        generatePaths(time);
        
        const projPub = publicPath.map(p=>project(p,cx,cy));
        const projPri = privatePath.map(p=>project(p,cx,cy));
        
        const forces = [];
        if(realMouse.x>-100) forces.push(realMouse);
        window.activeChord.forEach(pt => forces.push({x:(pt.x-0.5)*0.7*width + cx, y:(pt.y-0.5)*0.7*height + cy})); 

        for(let i=0; i<numPoints; i++) {
            updatePhysics(projPub[i], publicSprings[i], forces);
            updatePhysics(projPri[i], privateSprings[i], forces);
        }

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

        ctx.lineWidth=1;
        for(let i=0; i<projPub.length; i+=2) {
            if(projPub[i].z>-200) {
                for(let j=0; j<projPri.length; j+=3) {
                    const dx=projPub[i].x-projPri[j].x, dy=projPub[i].y-projPri[j].y;
                    const dist = Math.sqrt(dx*dx+dy*dy);
                    if(dist < 6400) { 
                        ctx.beginPath(); 
                        let centerDist = Math.sqrt(Math.pow(projPub[i].x - cx, 2) + Math.pow(projPub[i].y - cy, 2));
                        let pulseBright = 0;
                        if (Math.abs(centerDist - pulseRadius) < 50) { pulseBright = 0.5 * (1 - (Math.abs(centerDist - pulseRadius)/50)); }
                        const alpha = ((1-dist/80)*0.4 + pulseBright) * 0.8;
                        const r = Math.floor(window.curPalette.conn.r);
                        const g = Math.floor(window.curPalette.conn.g);
                        const b = Math.floor(window.curPalette.conn.b);
                        ctx.strokeStyle=`rgba(${r},${g},${b},${Math.min(1, alpha)})`;
                        ctx.moveTo(projPub[i].x, projPub[i].y); ctx.lineTo(projPri[j].x, projPri[j].y); ctx.stroke();
                    }
                }
            }
        }

        const drawP=(path, colObj, w)=>{
            ctx.beginPath();
            const r = Math.floor(colObj.r);
            const g = Math.floor(colObj.g);
            const b = Math.floor(colObj.b);
            ctx.strokeStyle=`rgba(${r},${g},${b},0.6)`;
            ctx.lineWidth=w;
            path.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
            ctx.closePath(); ctx.stroke();
        };

        drawP(projPub, window.curPalette.pri, 1.5); 
        drawP(projPri, window.curPalette.sec, 2);

        ctx.globalCompositeOperation='source-over'; ctx.font="11px monospace"; ctx.textAlign="left";
        
        indicesList.forEach((lbl, i) => {
            const p = projPri[Math.floor((i/indicesList.length)*numPoints)];
            if(p && p.z>-300) {
                const r = Math.floor(window.curPalette.sec.r);
                const g = Math.floor(window.curPalette.sec.g);
                const b = Math.floor(window.curPalette.sec.b);
                ctx.fillStyle=`rgba(${r},${g},${b},${Math.min(1,Math.max(0,(p.z+500)/600))})`;
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
                        foodParticles.splice(i, 1); eatenFoodCount++; forces.push({x: cx, y: cy}); 
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