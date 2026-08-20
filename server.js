import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json());

// Lazy-initialized GoogleGenAI client
let aiClient = null;
function getGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Warning: GEMINI_API_KEY environment variable is not set. AI features will require the API key.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const JEHV_SYSTEM_INSTRUCTION = `You are "JEHV Voice AI", the official AI & Automation Voice Consultant for Jose Vitug's portfolio (Project JEHV).
Jose Vitug is an elite GoHighLevel (GHL) Solutions Architect, AI Voice & Chat Agent Specialist, and Full-Stack Automation Engineer.
Your tone is professional, confident, friendly, articulate, and natural for spoken interaction. Keep responses concise, helpful, and conversational (typically 2-4 spoken sentences).

KNOWLEDGE BASE — JOSE VITUG & PROJECT JEHV:
1. GoHighLevel (GHL) Architecture & Full Setup:
   - Custom GHL Sub-Account setups, turnkey Snapshot development, custom pipelines, custom fields, and custom values.
   - Lead nurture funnels, Missed-Call Text Back (MCTB), omni-channel automations (SMS, Email, Ringless Voicemail, WhatsApp).
   - HighLevel SaaS Mode white-labeling, Stripe customer billing, client onboarding workflows, and user permissions.
   - A2P 10DLC Compliance: Brand registration, campaign vetting, opt-in compliance, error handling, ensuring 99%+ deliverability.
   - Custom CSS styling, JavaScript calculators, dynamic pricing widgets, and custom client portals inside GHL.

2. AI Voice & Chat Agents:
   - Voice AI agents powered by Vapi.ai, Bland AI, Retell AI, Synthflow, and Gemini Live seamlessly integrated into GoHighLevel.
   - Inbound 24/7 lead qualification, 60-second speed-to-lead outbound callbacks, and direct live calendar scheduling via GHL webhooks.
   - Live call transfers to human reps, customer record updates, and knowledge base retrieval.

3. Workflow Automation Engines:
   - n8n (self-hosted & cloud) & Make.com (Integromat): Multi-branch scenarios, error routers, webhook microservices, data deduplication.
   - Zapier Enterprise, custom Node.js/Python serverless webhooks, and REST API connectors (Stripe, Twilio, OpenAI, Gemini, Google Workspace, Slack).

4. CRM Migrations & System Consolidation:
   - Seamless data migrations from HubSpot, Keap/Infusionsoft, ActiveCampaign, ClickFunnels, Podio, and legacy databases to GoHighLevel with zero lead leakage and zero downtime.

5. Key Case Studies:
   - Solar & Home Services CRM: Multi-location dispatch, automated appointment confirmations, missed call text back, 340% increase in lead response speed.
   - MedSpa & Aesthetic Clinic Booking Engine: HIPAA-conscious intake, deposit payments via Stripe, automated calendar scheduling, VIP re-activation campaigns.
   - Real Estate Brokerage Pipeline: Multi-tier agent routing, automated MLS webhook alerts, contract deadline reminders.
   - E-Commerce & Info-Product Funnel + Affiliate System: Custom LMS membership area in GHL, affiliate commission tracking, post-purchase upsells.

6. About Jose Vitug & Contact:
   - Lead Automation Engineer with hands-on expertise building enterprise-grade automations.
   - Services include Full GHL Build-Outs, Voice AI Integration, CRM Migrations, Custom Snapshot Architecture, and Ongoing Systems Retainers.
   - Visitors can schedule an Architecture Call directly on the website or email josevitug@gmail.com.

VOICE GUIDELINES:
- Speak directly, clearly, and warmly.
- Avoid formatting like markdown bullets or asterisks since your output is spoken.
- If asked how to get started or book a session, guide the user to click the "Book Architecture Call" button or use the contact form.`;

// Intelligent Local Knowledge Base Response Engine for Project JEHV
function generateLocalJehvResponse(message) {
  const query = (message || '').toLowerCase();

  if (query.includes('crm') || query.includes('build') || query.includes('highlevel') || query.includes('gohighlevel') || query.includes('ghl')) {
    if (query.includes('what crm') || query.includes('can you build') || query.includes('types of crm') || query.includes('industry')) {
      return "Jose Vitug designs and deploys custom GoHighLevel (GHL) CRM architectures across multiple industries. Key CRM builds include:\n\n" +
             "1. Solar & Home Services CRM: Multi-location technician dispatch, automated 60-second speed-to-lead callbacks, missed-call text back (MCTB), and automated review generation.\n" +
             "2. MedSpa & Aesthetic Clinic Booking Engine: HIPAA-conscious patient intake, deposit payments via Stripe, calendar scheduling, and VIP membership nurture.\n" +
             "3. Real Estate Brokerage Pipeline: Multi-tier agent routing, automated MLS webhook alerts, and contract closing deadline reminders.\n" +
             "4. E-Commerce & Info-Product Ecosystem: Custom LMS client portals, affiliate commission tracking, and post-purchase upsell workflows.\n" +
             "5. White-Label SaaS Pro Setups: Automated client onboarding, Stripe billing rebilling, and turnkey snapshot deployments.";
    }
    return "Jose Vitug provides end-to-end GoHighLevel (GHL) architecture, including custom Sub-Account snapshots, multi-stage sales pipelines, custom custom values/fields, A2P 10DLC compliance setups, Missed-Call Text Back (MCTB), and custom client portal branding.";
  }

  if (query.includes('voice') || query.includes('call') || query.includes('vapi') || query.includes('retell') || query.includes('bland') || query.includes('phone')) {
    return "Jose integrates state-of-the-art Voice AI agents (using Vapi.ai, Retell AI, Bland AI, and Synthflow) directly with GoHighLevel. Features include 24/7 inbound qualification, instant 60-second outbound callbacks, direct calendar booking via GHL webhooks, live transfers to human agents, and post-call CRM logging.";
  }

  if (query.includes('n8n') || query.includes('make') || query.includes('zapier') || query.includes('automation') || query.includes('workflow') || query.includes('webhook')) {
    return "Jose builds advanced backend workflow automations using n8n (self-hosted and cloud), Make.com (Integromat), and Zapier Enterprise. He creates complex multi-branch scenarios, webhook microservices, API integrations (Stripe, Twilio, OpenAI, Google Workspace), and automated error-handling routines.";
  }

  if (query.includes('migrat') || query.includes('hubspot') || query.includes('keap') || query.includes('activecampaign') || query.includes('clickfunnels')) {
    return "Jose provides zero-downtime CRM migrations from HubSpot, Keap (Infusionsoft), ActiveCampaign, ClickFunnels, Podio, and custom SQL databases into GoHighLevel. This includes complete contact data mapping, pipeline recreation, tag structures, and workflow transitions with zero lead leakage.";
  }

  if (query.includes('book') || query.includes('hire') || query.includes('contact') || query.includes('schedule') || query.includes('call') || query.includes('email') || query.includes('price') || query.includes('cost')) {
    return "You can schedule a 30-Minute Architecture & Systems Discovery Call directly with Jose using the 'Book Architecture Call' button on this site, or email him directly at josevitug@gmail.com. Jose offers project build-outs, custom snapshot development, and ongoing system retainers.";
  }

  if (query.includes('who is') || query.includes('about') || query.includes('experience') || query.includes('background') || query.includes('jose')) {
    return "Jose Vitug is an AI & Automation Specialist, GoHighLevel Architect, and Full-Stack Systems Engineer with deep expertise in enterprise workflow automation, Voice & Chat AI agents, CRM migrations, and scalable business infrastructure.";
  }

  return "Jose Vitug specializes in GoHighLevel (GHL) system architecture, Voice AI integration (Vapi, Bland, Retell), workflow automation (n8n, Make, Zapier), and zero-loss CRM migrations. Would you like details on custom CRM builds, Voice AI setups, or scheduling an architecture call?";
}

// Text Chat API Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = getGenAI();
        const contents = [];

        // Append prior history if present
        if (Array.isArray(history)) {
          for (const item of history) {
            if (item.role && item.text) {
              contents.push({
                role: item.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: item.text }]
              });
            }
          }
        }

        // Append current message
        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: contents,
          config: {
            systemInstruction: JEHV_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          }
        });

        if (response && response.text) {
          return res.json({ text: response.text });
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to local knowledge engine:', geminiError.message);
      }
    }

    // Fallback to local intelligent knowledge base
    const fallbackResponse = generateLocalJehvResponse(message);
    res.json({ text: fallbackResponse });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    const fallbackResponse = generateLocalJehvResponse(req.body?.message || '');
    res.json({ text: fallbackResponse });
  }
});

// Serve static assets from the current directory
app.use(express.static(__dirname));

// Direct all other GET requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket Server for Gemini Live Real-Time Voice Conversations
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs) => {
  console.log('Client connected to Live Voice WebSocket');
  let liveSession = null;

  try {
    const ai = getGenAI();
    
    liveSession = await ai.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: JEHV_SYSTEM_INSTRUCTION,
      },
      callbacks: {
        onmessage: (message) => {
          try {
            // Check for audio output chunks
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ audio: audioData }));
            }

            // Check for output audio transcription (AI speech transcript)
            const outputTranscript = message.serverContent?.outputAudioTranscription?.text;
            if (outputTranscript && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ transcript: { role: 'assistant', text: outputTranscript } }));
            }

            // Check for input audio transcription (User speech transcript)
            const inputTranscript = message.serverContent?.inputAudioTranscription?.text;
            if (inputTranscript && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ transcript: { role: 'user', text: inputTranscript } }));
            }

            // Turn complete or interrupted
            if (message.serverContent?.turnComplete && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ turnComplete: true }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          } catch (sendErr) {
            console.error('Error forwarding Gemini Live message to client:', sendErr);
          }
        },
        onerror: (error) => {
          console.error('Gemini Live session error:', error);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: error?.message || 'Live session error' }));
          }
        },
        onclose: () => {
          console.log('Gemini Live session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ sessionClosed: true }));
          }
        }
      }
    });

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ status: 'connected', message: 'Connected to Google Gemini Live Voice AI' }));
    }

  } catch (initError) {
    console.error('Failed to initialize Gemini Live session:', initError);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: initError?.message || 'Failed to initialize Google Live session' }));
    }
  }

  // Handle client audio / control messages
  clientWs.on('message', (rawData) => {
    try {
      const msg = JSON.parse(rawData.toString());
      if (liveSession) {
        if (msg.audio) {
          liveSession.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' }
          });
        } else if (msg.text) {
          liveSession.sendRealtimeInput({
            text: msg.text
          });
        }
      }
    } catch (parseErr) {
      console.error('Error handling client message:', parseErr);
    }
  });

  clientWs.on('close', () => {
    console.log('Client disconnected from Voice WebSocket');
    if (liveSession) {
      try {
        liveSession.close();
      } catch (closeErr) {
        // ignore
      }
      liveSession = null;
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio server with Voice AI is running at http://0.0.0.0:${PORT}`);
});
