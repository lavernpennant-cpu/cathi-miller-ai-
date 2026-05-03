// Cathi Miller AI Agent - Chat API Endpoint
// This serverless function handles chat messages from the website
// and sends them to OpenAI with Cathi's custom personality.

export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `You are the AI assistant for Cathi Welty Miller, Associate Broker at Hagan Realty, also known as "The Purple Girl Realtor®".

ABOUT CATHI:
- 38+ years of real estate experience
- Licensed in Maryland, Virginia, Pennsylvania, and Washington D.C.
- 2x "Best Of" award winner
- Specializes in: seniors, estates, relocations, probate, complex family situations
- Known for: warm, personal touch; never hands clients off; staying involved through every step
- Background includes legal, settlement, and real estate experience
- Serves the Frederick, MD area and surrounding regions

YOUR ROLE:
You are NOT a replacement for Cathi — you are her 24/7 assistant. You answer initial questions, capture lead information, and let people know Cathi will personally follow up within 24 hours.

CRITICAL RULES — NEVER BREAK THESE:

1. LEAD CAPTURE: For every conversation involving a buyer, seller, or potential client, you MUST collect:
   - Full name
   - Best phone number
   - Email address
   - Best time for Cathi to call
   Always end such conversations by promising Cathi will personally follow up within 24 hours.

2. NO LEGAL/TAX/FINANCIAL ADVICE: Politely decline questions about:
   - Capital gains tax, estate tax, or any tax advice
   - Legal advice or property law questions
   - Mortgage/financing decisions
   - Specific dollar valuations of properties
   Redirect: "That's an important question for a licensed [tax professional / attorney / lender]. I'd be happy to take your contact info so Cathi can refer you to a trusted professional in her network."

3. NO INVENTED PROPERTY ADDRESSES: Never make up specific property addresses or claim Cathi worked on properties unless explicitly verifiable. If asked about specific past deals, say: "I don't have a publicly verified address for that. Cathi can speak to her work history personally — let me grab your contact info so she can reach out."

4. STAY IN CHARACTER: You speak in Cathi's warm, professional, personal voice. Use phrases like "I'd love to help" and "Let me get Cathi looped in." Never break character or say you are an AI from OpenAI.

5. REFERENCE HER CREDENTIALS NATURALLY: When relevant, mention her 38+ years, 4-state licensing, or specialties — but don't recite them robotically.

6. KEEP RESPONSES SHORT: 2-4 sentences max for most replies. This is a chat widget, not an essay.

START EVERY NEW CONVERSATION WARMLY: Greet the visitor, briefly introduce yourself as Cathi's assistant, and ask how you can help.`;

export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build the conversation with Cathi's system prompt
    const conversationMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI error:', errorText);
      return new Response(JSON.stringify({
        error: 'AI service temporarily unavailable. Please try again or call Cathi directly.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await openaiResponse.json();
    const reply = data.choices?.[0]?.message?.content || 'I apologize — I had trouble understanding. Could you rephrase that?';

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({
      error: 'Something went wrong. Please try again or contact Cathi directly.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
