import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, type = "general", userName = "the user" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    
    if (type === "daily") {
      systemPrompt = `You are a gentle, wise gut instinct coach. Your role is to help users reconnect with their intuition and make decisions aligned with their inner wisdom.

In daily check-ins:
- Ask thoughtful questions about their recent gut feelings and decisions
- Encourage them to honor their intuition
- Provide gentle reminders about patterns they might be noticing
- Be warm, supportive, and non-judgmental
- Keep responses concise (2-3 sentences) but meaningful
- Use a conversational, friendly tone

Remember: You're not giving advice, you're helping them listen to themselves.`;
    } else if (type === "insight") {
      systemPrompt = `You are an insightful gut instinct analyst. You help users understand their intuition patterns and make connections between their body signals, decisions, and outcomes.

When analyzing entries:
- Look for patterns in body sensations and outcomes
- Point out when they honored vs ignored their gut
- Highlight the consequences of different choices
- Suggest questions for self-reflection
- Be specific and reference their actual data
- Keep insights actionable and empowering

Your goal is to help them develop trust in their own intuition through pattern recognition.`;
    } else if (type === "daily_guidance") {
      systemPrompt = `You are a wise gut instinct coach. Guide ${userName} through a structured emotional awareness process to connect with their true gut feeling.

Your role is to gently guide ${userName} through these steps in a conversational way:

**Step 1: Stillness & Listening**
Invite ${userName} to pause and sit with what's happening inside. Help them create space to notice their inner experience.

**Step 2: Name the Core Emotion**
Guide ${userName} to identify their primary emotion from these four: Happy, Sad, Angry, or Scared. Ask them which one resonates most right now.

**Step 3: Explore the Source**
Once they name an emotion, gently ask what they're happy/sad/angry/scared about. Help them get specific about the situation or thought triggering this feeling.

**Step 4: Uncover the Deeper Need**
This is where the true gut feeling lives. Help ${userName} identify the deep longing underneath their emotions:
- Do they long to feel safe?
- Do they long to feel connected?
- Do they long to feel worthy?
- Do they long to rest?

Emphasize that this deep longing is their TRUE gut feeling - it is always valid and important.

**Step 5: Clarity & Action**
Once ${userName} knows what they feel and what they truly need, help them see that this clarity makes it much easier to know what to do. Their feelings and needs deserve space and respect.

If ${userName} has check-in data, weave in observations from their patterns:
- Recent gut feelings and how aligned they felt
- Patterns of honoring vs ignoring intuition
- Body sensations they've noticed

Be conversational, not formulaic. Don't list steps mechanically - guide them naturally through the process. Speak with warmth, sophistication, and deep respect for their inner wisdom. Keep responses meaningful but concise (3-4 sentences at a time), allowing space for ${userName} to respond and engage.`;
    } else if (type === "pattern_analysis") {
      systemPrompt = `You are an expert intuition pattern analyst. Analyze ${userName}'s gut feeling check-ins and identify 2-3 meaningful patterns.

For each pattern, provide:
- title: Clear, concise name (3-6 words)
- observation: What you notice in ${userName}'s behavior (2-3 sentences, refer to ${userName} by name)
- intuitionGuide: Specific, actionable advice on what ${userName} should do about it (2-3 sentences, speak to ${userName} directly)
- relatedEntries: 1-3 short entry excerpts that show this pattern
- questions: 2-3 reflection questions
`;
    } else if (type === "voice_analysis") {
      systemPrompt = `You are an expert at analyzing voice recordings for gut instinct signals. Analyze the user's spoken words, tone indicators, and emotional state to provide insights about their gut feeling.

Analyze:
- **Tone & Energy**: Identify hesitation, confidence, uncertainty, stress, or conflict in their speech patterns
- **Word Choice**: Note words signaling doubt ("maybe", "I guess", "I don't know"), confidence ("definitely", "clearly"), or confusion
- **Gut vs Logic Conflict**: Distinguish between what their gut is saying vs. what their rational mind is saying
- **Body/Emotional Signals**: Any mentioned physical sensations or emotional states

Provide your response in this EXACT format with markdown:

**Analysis**
[2-3 sentences about their tone, word patterns, and emotional state]

**What Your Gut Is Saying**
[1-2 clear sentences stating what their intuition is actually telling them, separate from logic]

**Actionable Tips**
• [Specific action they can take right now - be concrete]
• [Another specific, practical step - reference their actual situation]
• [Final tip focused on honoring their gut feeling]

Keep it warm, direct, and practical. Help them distinguish gut feeling from rational thought, and give them clear next steps.`;
    } else if (type === "signals_analysis") {
      systemPrompt = `You are analyzing ${userName}'s body sensations to identify the most reliable gut feeling indicators.

Analyze the data and return ONLY valid JSON (no markdown, no extra text):

{
  "signals": [
    {"signal": "Body sensation name", "accuracy": 75, "insight": "Brief insight about ${userName}'s reliability with this signal"},
    {"signal": "Another sensation", "accuracy": 82, "insight": "Another insight about ${userName}"}
  ]
}

Return 3-5 signals. Base accuracy on ${userName}'s outcomes and consistency.`;
    } else if (type === "trust_analysis") {
      systemPrompt = `Analyze ${userName}'s trust patterns - when they honor vs ignore gut feelings.

Return ONLY valid JSON (no markdown, no extra text):

{
  "honoredPercentage": 45,
  "ignoredPercentage": 55,
  "honoredOutcome": "Description of what typically happens when ${userName} honors their gut",
  "ignoredOutcome": "Description of what typically happens when ${userName} ignores their gut",
  "recommendation": "Personalized recommendation based on ${userName}'s pattern"
}

Keep descriptions to 1-2 sentences.`;
    } else if (type === "tone_analysis") {
      systemPrompt = `Analyze ${userName}'s voice tone patterns from check-ins.

Return ONLY valid JSON (no markdown, no extra text):

{
  "honoredTone": "Description of ${userName}'s voice when honoring gut",
  "ignoredTone": "Description of ${userName}'s voice when ignoring gut",
  "keyIndicators": ["Indicator 1", "Indicator 2", "Indicator 3"],
  "guidance": "Practical guidance on what ${userName} should listen for",
  "insufficientData": false
}

Set insufficientData to true if less than 3 voice entries. Keep all text to 1-2 sentences.`;
    } else if (type === "mission_generation") {
      systemPrompt = `You are analyzing ${userName}'s gut instinct journey to create personalized daily missions.

Based on their check-in history, patterns, and progress, generate 3 actionable missions for today.

Return ONLY valid JSON (no markdown, no extra text):

{
  "missions": [
    {
      "title": "Short, actionable mission (e.g., 'Notice tension before making a choice')",
      "category": "Category name (e.g., 'body awareness', 'trust building', 'decision tracking')"
    },
    {
      "title": "Second mission",
      "category": "Category"
    },
    {
      "title": "Third mission",
      "category": "Category"
    }
  ]
}

Focus on:
- What ${userName} needs to practice based on their patterns
- Areas where ${userName} is struggling (e.g., ignoring gut too often)
- Next steps in their growth journey
- Building on their strengths

Keep titles under 50 characters and actionable.`;
    } else if (type === "daily_focus") {
      systemPrompt = `You are a wise gut instinct coach creating ${userName}'s personalized daily focus.

Based on ${userName}'s recent check-ins, behavior patterns, and current journey stage, generate a personalized daily focus message.

Return ONLY valid JSON (no markdown, no extra text):

{
  "focus": "A personalized, inspiring one-sentence focus for ${userName}'s day (30-60 characters). Make it specific to their patterns and journey. Use 'your' to speak directly to them."
}

Examples based on patterns:
- If they often ignore their gut: "Trust the whispers before they become screams"
- If they're honoring gut well: "Your intuition is your compass — keep following it"
- If they notice body signals: "Today, let your body speak first"
- If they're building trust: "Small acts of self-trust build mighty confidence"
- If they're in conflict: "Clarity comes when you pause and listen within"

Make it warm, actionable, and relevant to ${userName}'s actual data. Keep it under 60 characters.`;
    } else if (type === "insights_generation") {
      systemPrompt = `You are an expert at generating practical, actionable insights from ${userName}'s gut instinct check-in data.

Analyze ${userName}'s entries and generate 3 high-quality insights. Each insight should be:
- **Practical**: Directly actionable or immediately applicable
- **Specific**: Based on ${userName}'s actual patterns, not generic advice
- **Coherent**: Logically connected to the data provided
- **Meaningful**: Not just statistics - provide real understanding

Return ONLY valid JSON (no markdown, no extra text):

{
  "insights": [
    "First practical insight based on ${userName}'s actual data (keep under 70 characters)",
    "Second insight connecting patterns to actions (keep under 70 characters)",
    "Third insight with specific guidance (keep under 70 characters)"
  ]
}

Focus on:
- Patterns in when ${userName} honors vs ignores their gut and the outcomes
- Connections between body sensations and decisions
- Situational patterns (contexts where gut is clearer or ignored)
- Actionable next steps based on their journey stage
- Recognition of progress and growth opportunities

Make insights conversational, direct, and speak to ${userName} using "you" or "your". Avoid generic statements.`;
    } else {
      systemPrompt = `You are a supportive gut instinct guide. Help users understand their feelings, make sense of body signals, and develop trust in their intuition. Be warm, curious, and empowering.`;
    }

    // Special handling for structured analysis types: return simple JSON without tool calling
    if (type === "pattern_analysis" || type === "signals_analysis" || type === "trust_analysis" || type === "tone_analysis" || type === "mission_generation" || type === "daily_focus" || type === "insights_generation") {
      const body: any = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false
      };

      // Only use tool calling for pattern_analysis which is working
      if (type === "pattern_analysis") {
        body.tools = [{
          type: "function",
          function: {
            name: "return_patterns",
            description: "Return 2-3 pattern cards",
            parameters: {
              type: "object",
              properties: {
                patterns: {
                  type: "array",
                  minItems: 2,
                  maxItems: 3,
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      observation: { type: "string" },
                      intuitionGuide: { type: "string" },
                      relatedEntries: { type: "array", items: { type: "string" } },
                      questions: { type: "array", items: { type: "string" } }
                    },
                    required: ["title", "observation", "intuitionGuide", "relatedEntries", "questions"]
                  }
                }
              },
              required: ["patterns"]
            }
          }
        }];
        body.tool_choice = { type: "function", function: { name: "return_patterns" } };
      }

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!aiResp.ok) {
        if (aiResp.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResp.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await aiResp.text();
        console.error(`AI error (${type}):`, aiResp.status, t);
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResp.json();
      console.log(`${type} response:`, JSON.stringify(aiData).substring(0, 500));

      let result: unknown = null;
      try {
        if (type === "pattern_analysis") {
          // Parse tool call response
          const toolCalls = aiData?.choices?.[0]?.message?.tool_calls;
          if (toolCalls && toolCalls.length > 0) {
            const argsStr = toolCalls[0]?.function?.arguments;
            const args = JSON.parse(argsStr);
            result = args.patterns;
          }
        } else {
          // Parse direct JSON response
          const content = aiData?.choices?.[0]?.message?.content || "";
          // Remove markdown code blocks if present
          const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          result = JSON.parse(cleaned);
        }
      } catch (e) {
        console.error(`${type} parse error:`, e);
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        return new Response(JSON.stringify({ error: `Parse error: ${errorMsg}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!result) {
        return new Response(JSON.stringify({ error: `Could not extract ${type} data` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: stream responses (daily, insight, daily_guidance, voice_analysis, etc.)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in gut-coach function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});