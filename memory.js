// ============================================
// MEMORY MODULE (memory.js) - WITH DEBUGGING
// ============================================

window.processMemoryChat = async function(userText, apiKey, model, history = []) {
    const appsScriptUrl = localStorage.getItem("symbiosis_apps_script_url");
    
    // Format history
    const historyText = history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");

    // 1. SYNTHESIZER STEP
    const synthPrompt = `
    CONTEXT:
    ${historyText}
    
    CURRENT INPUT: "${userText}"
    
    TASK:
    1. ENTITIES: Identify people/places. Resolve pronouns (e.g. "He" -> "Brandon").
    2. TOPICS: Broad categories (Identity, Preference, Location, Relationship).
    3. FACT: Extract NEW info to save. 
       - If it's a QUESTION or just CHAT, return null.
       - If it's a statement/fact, summarize it.
    
    Return JSON only: { "entities": "...", "topics": "...", "new_fact": "..." (or null) }
    `;

    console.log("🧠 1. Synthesizing Input..."); // DEBUG

    let synthData = { entities: "", topics: "", new_fact: null };
    let retrievedContext = "";

    try {
        const synthReq = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": window.location.href, "X-Title": "Symbiosis" },
            body: JSON.stringify({ "model": model, "messages": [{ "role": "system", "content": synthPrompt }] })
        });
        const synthRes = await synthReq.json();
        let raw = synthRes.choices[0].message.content;
        const fb = raw.indexOf('{'), lb = raw.lastIndexOf('}');
        if (fb !== -1 && lb !== -1) raw = raw.substring(fb, lb + 1);
        synthData = JSON.parse(raw);

        // DEBUG: SHOW WHAT THE AI DECIDED
        console.log("🧠 AI DECISION:", synthData);
        if (!synthData.new_fact) {
            console.log("❌ AI decided NOT to save this (Not a fact).");
        } else {
            console.log("✅ AI identified a new fact:", synthData.new_fact);
        }

    } catch (e) { console.error("Synthesizer failed", e); }

    // 2. RETRIEVAL STEP
    if (appsScriptUrl && (synthData.entities || synthData.topics)) {
        console.log("🔍 2. Searching Google Sheet for:", synthData.entities, synthData.topics); // DEBUG
        try {
            const keywords = [];
            if(synthData.entities) keywords.push(...synthData.entities.split(',').map(s=>s.trim()));
            if(synthData.topics) keywords.push(...synthData.topics.split(',').map(s=>s.trim()));
            
            const memReq = await fetch(appsScriptUrl, {
                method: "POST",
                body: JSON.stringify({ action: "retrieve", keywords: keywords })
            });
            const memRes = await memReq.json();
            if(memRes.memories && memRes.memories.length > 0) {
                console.log("📂 Memories Found:", memRes.memories); // DEBUG
                retrievedContext = "MEMORIES FOUND:\n" + memRes.memories.join("\n");
            } else {
                console.log("📂 No relevant memories found."); // DEBUG
            }
        } catch (e) { console.error("Memory Retrieval failed", e); }
    }

    // 3. FINAL GENERATION STEP
    const finalSystemPrompt = `
    You are Arvin's digital symbiote. 
    ${retrievedContext}
    
    CONVERSATION HISTORY:
    ${historyText}
    
    User: "${userText}"
    1. Answer briefly (max 2 sentences).
    2. Provide 8 UPPERCASE, One-word keywords.
    3. Choose MOOD: [NEUTRAL, AFFECTIONATE, CRYPTIC, WARNING, JOYFUL, CURIOUS, SAD].
    Return JSON: { "response": "...", "keywords": [...], "mood": "..." }
    `;

    const finalReq = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": window.location.href, "X-Title": "Symbiosis" },
        body: JSON.stringify({ "model": model, "messages": [{ "role": "user", "content": finalSystemPrompt }] })
    });
    
    // 4. STORAGE STEP (Async)
    if (appsScriptUrl && synthData.new_fact) {
        console.log("💾 4. Saving to Sheet..."); // DEBUG
        fetch(appsScriptUrl, {
            method: "POST",
            mode: 'no-cors', 
            body: JSON.stringify({ 
                action: "store", 
                entities: synthData.entities, 
                topics: synthData.topics, 
                fact: synthData.new_fact 
            })
        })
        .then(() => console.log("✅ Save Request Sent."))
        .catch(e => console.error("❌ Save failed", e));
    }

    return await finalReq.json();
}