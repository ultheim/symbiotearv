// ============================================
// MEMORY MODULE (memory.js) - ALIAS AWARENESS
// ============================================

window.processMemoryChat = async function(userText, apiKey, model, history = []) {
    const appsScriptUrl = localStorage.getItem("symbiosis_apps_script_url");
    
    // Format history for the prompt
    const historyText = history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n");

    // 1. SYNTHESIZER STEP: Aliases & Strict Formatting
    const synthPrompt = `
    CONTEXT:
    ${historyText}
    
    CURRENT INPUT: "${userText}"
    
    TASK:
    1. ENTITIES: Return a comma-separated list of ALL people/places involved.
       - CRITICAL: You MUST include the name(s) of the subject in this list if the fact is about them, even if the user just said I, he, she, they, etc.

    2. TOPICS: Use standard keywords (Identity, Preference, Location, Relationship, History, Work).
       - Max 3 topics.

    3. FACT: Extract NEW long-term info as a standalone declarative sentence.
       - Write in the third person and always refer to their names (don't use he, she, they, etc).
       - CRITICAL: If it is a QUESTION, CHIT-CHAT, or NO NEW INFO, return the value null (not a string).
    
    Return JSON only: { "entities": "...", "topics": "...", "new_fact": "..." (or null) }
    `;

    console.log("🧠 1. Synthesizing Input..."); 

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

    } catch (e) { console.error("Synthesizer failed", e); }

    // 2. RETRIEVAL STEP (Google Sheets)
    if (appsScriptUrl && (synthData.entities || synthData.topics)) {
        console.log("🔍 2. Searching Google Sheet for:", synthData.entities, synthData.topics); 
        try {
            const keywords = [];
            // Split entities by comma to search for "Meidy" and "May" separately
            if(synthData.entities) keywords.push(...synthData.entities.split(',').map(s=>s.trim()));
            if(synthData.topics) keywords.push(...synthData.topics.split(',').map(s=>s.trim()));
            
            const memReq = await fetch(appsScriptUrl, {
                method: "POST",
                body: JSON.stringify({ action: "retrieve", keywords: keywords })
            });
            const memRes = await memReq.json();
            if(memRes.memories && memRes.memories.length > 0) {
                console.log("📂 Memories Found:", memRes.memories); 
                retrievedContext = "MEMORIES FOUND:\n" + memRes.memories.join("\n");
            } else {
                console.log("📂 No relevant memories found."); 
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
    
    // 4. STORAGE STEP (Async) - FIXED: Now checks if new_fact is "null" string
    // We check if new_fact exists AND is not the string "null"
    if (appsScriptUrl && synthData.new_fact && synthData.new_fact !== "null") {
        console.log("💾 4. Saving to Sheet..."); 
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
    } else {
        console.log("🛑 No new fact to save (Chit-chat/Question detected).");
    }

    return await finalReq.json();
}
