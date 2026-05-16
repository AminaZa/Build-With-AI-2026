import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv('GEMINI_API_KEY')
if api_key and api_key != "your_api_key_here":
    genai.configure(api_key=api_key)
else:
    print("WARNING: Valid GEMINI_API_KEY not found in environment.")

model = genai.GenerativeModel('gemini-2.0-flash')
DEMO_MODE = os.getenv('DEMO_MODE', 'False').lower() == 'true'

DEMO_CACHE = {
    'matching_plan': {
        "pairings": [
            {
                "mentorId": "mentor_001",
                "startupId": "startup_015",
                "confidence": 0.94,
                "reasoning": "Dr. Aisha's 12 years in fintech align perfectly with PayFlex's payment infrastructure focus. She achieved 95% satisfaction with similar startups previously.",
                "risks": "At 2/3 capacity \u2014 manageable but monitor.",
                "historicalNote": "Mentored PayFlex briefly in Programme A with a health score of 91."
            }
        ],
        "unmatched": [],
        "summary": "Prioritized expertise-domain alignment with capacity balancing. Used historical data to optimize for fintech focus."
    },
    'health_insight': {
        "insight": "Meeting frequency dropped from weekly to biweekly since May 3, and the last feedback score was 2.1/5 \u2014 the lowest in this cohort. Historically, relationships with this pattern disengage within 14 days.",
        "suggestedAction": "Send focused agenda and suggest discussing immediate blockers.",
        "suggestedTopic": "Fundraising deck review and addressing payment gateway integration blockers.",
        "urgency": "critical",
        "predictedOutcome": "Relationship will likely fail if an intervention is not made."
    },
    'agent_action': {
        "action": "agenda_sent",
        "tier": "inform",
        "description": "Sent a focused meeting agenda based on startup's current needs (payment gateway issues).",
        "aiReasoning": "Meeting quality correlates with focused agendas. Since feedback dropped recently, a proactive agenda helps stabilize the engagement.",
        "suggestedMeetingTopic": "Payment Gateway and Fundraising Prep",
        "newMentorSuggestion": None
    },
    'cross_programme': {
        "topMentors": [
            {
                "mentorId": "mentor_001",
                "avgHealthScore": 95,
                "bestDomain": "fintech",
                "recommendation": "Strongly recommend for new programme \u2014 consistent high performer."
            }
        ],
        "successPatterns": [
            "Mentors with localized domain expertise matched with early-stage startups yielded a 40% higher retention rate.",
            "Bi-weekly meetings paired with asynchronous check-ins kept health scores >80."
        ],
        "failurePatterns": [
            "Startups assigned to mentors currently at max capacity (3/3) experienced a 50% drop in feedback scores."
        ],
        "recommendations": [
            "Prioritize matching Dr. Aisha Rahman to fintech startups needing payment infra support.",
            "Ensure no mentor takes more than 2 startups to maintain quality."
        ],
        "carryOverSuggestions": [
            {
                "mentorId": "mentor_001",
                "startupId": "startup_015",
                "reason": "Unfinished mentorship from Programme A \u2014 PayFlex still needs fundraising support."
            }
        ]
    }
}

def call_gemini_with_fallback(prompt: str, cache_key: str = None):
    if DEMO_MODE and cache_key and cache_key in DEMO_CACHE:
        print(f"[DEMO_MODE] Using cached response for {cache_key}")
        return DEMO_CACHE[cache_key]

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Clean up JSON if wrapped in markdown fences
        if text.startswith('```'):
            text = text.split('\n', 1)[1]
            text = text.rsplit('```', 1)[0]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Gemini API error: {e}")
        # Fallback to cache even if not in explicitly requested demo mode if API fails
        if cache_key and cache_key in DEMO_CACHE:
            print(f"[FALLBACK] Using cached response for {cache_key} due to API error")
            return DEMO_CACHE[cache_key]
        raise e

def generate_matching_plan(mentors, startups, goals, historical_data=None):
    prompt = f"""You are an ecosystem matching engine for an innovation programme.

Your job: create optimal mentor-startup pairings that maximize programme outcomes.

AVAILABLE MENTORS:
{json.dumps(mentors, indent=2)}

UNMATCHED STARTUPS:
{json.dumps(startups, indent=2)}

PROGRAMME GOALS:
{json.dumps(goals, indent=2)}

{"HISTORICAL DATA FROM PAST PROGRAMMES:" + json.dumps(historical_data, indent=2) if historical_data else "No historical data available \u2014 this is the first programme."}

RULES:
- Each mentor can be matched to at most their capacity limit
- Prioritize expertise alignment (mentor's expertise should match startup's domain)
- If historical data exists, factor in past performance (high satisfaction = prefer that mentor for similar startups)
- Flag risks explicitly (capacity stretched, domain mismatch, new mentor with no track record)
- If a mentor and startup worked together before and it went well, note this as a positive signal

Respond with ONLY valid JSON, no markdown fences, no explanation. Use this exact structure:
{{
  "pairings": [
    {{
      "mentorId": "mentor_001",
      "startupId": "startup_015",
      "confidence": 0.92,
      "reasoning": "2-3 sentence explanation of why this is a good match",
      "risks": "Any concerns or null if none",
      "historicalNote": "Any relevant past interaction or null"
    }}
  ],
  "unmatched": ["startup_ids that couldn't be matched and why"],
  "summary": "One paragraph overview of the matching strategy"
}}"""
    
    return call_gemini_with_fallback(prompt, cache_key='matching_plan')

def generate_health_insight(linkage_data):
    prompt = f"""You are an AI relationship analyst for an innovation ecosystem.

Analyze this mentor-startup relationship and provide insights.

RELATIONSHIP DATA:
{json.dumps(linkage_data, indent=2)}

CONTEXT:
- meetingFrequency is meetings per week (1.0 = weekly, 0.5 = biweekly, 0 = no meetings)
- feedbackAvg is on a 1-5 scale (5 = excellent)
- healthScore is 0-100 (>70 = healthy, 40-70 = at risk, <40 = failing)
- healthTrend shows direction over the past 2 weeks

Respond with ONLY valid JSON, no markdown fences:
{{
  "insight": "2-3 sentence plain-english explanation of what's happening in this relationship. Be specific \u2014 reference actual numbers. Don't be generic.",
  "suggestedAction": "One specific action the agent should take, or null if relationship is healthy",
  "suggestedTopic": "If a meeting topic would help, suggest one based on the startup's needs, or null",
  "urgency": "low | medium | high | critical",
  "predictedOutcome": "What will happen in 2 weeks if nothing changes"
}}"""
    
    return call_gemini_with_fallback(prompt, cache_key='health_insight')

def decide_agent_action(linkage_data):
    prompt = f"""You are an autonomous relationship agent managing one mentor-startup linkage in an innovation ecosystem.

YOUR LINKAGE:
{json.dumps(linkage_data, indent=2)}

AVAILABLE ACTIONS AND THEIR TIERS:
Tier 1 (auto-execute, no human approval):
- reminder_sent: Send a meeting reminder
- topic_suggested: Suggest a discussion topic for next meeting
- health_updated: Update the health score based on new signals

Tier 2 (execute and inform admin):
- nudge_sent: Send an engagement nudge to the less-active party
- agenda_sent: Send a focused meeting agenda based on startup's current needs
- cadence_adjusted: Suggest changing meeting frequency

Tier 3 (propose and wait for admin approval):
- reassign_proposed: Propose replacing the mentor
- relationship_paused: Propose pausing the relationship
- escalated: Escalate to admin with a concern that doesn't fit other categories

DECISION RULES:
- If the relationship is healthy (score >70, stable/improving trend), prefer "do_nothing"
- For routine maintenance (reminders, topics), use Tier 1
- For interventions that change the relationship dynamic, use Tier 2
- For irreversible or high-impact changes, use Tier 3
- Always explain your reasoning with specific data points
- Be proactive, not reactive \u2014 act before problems become crises

Respond with ONLY valid JSON, no markdown fences:
{{
  "action": "the action type or do_nothing",
  "tier": "auto | inform | approve",
  "description": "What the agent will do, written as a past-tense activity log entry (e.g. 'Sent meeting reminder with topic suggestion')",
  "aiReasoning": "2-3 sentences explaining why, citing specific numbers from the linkage data",
  "suggestedMeetingTopic": "If relevant, a specific meeting topic, otherwise null",
  "newMentorSuggestion": "If action is reassign_proposed, suggest a replacement mentor type, otherwise null"
}}"""
    
    return call_gemini_with_fallback(prompt, cache_key='agent_action')

def generate_cross_programme_insights(completed_linkages, mentor_stats, new_programme):
    prompt = f"""You are an ecosystem intelligence engine. A new programme is starting and you need to provide intelligence from past programmes.

COMPLETED PROGRAMME DATA:
{json.dumps(completed_linkages, indent=2)}

MENTOR PERFORMANCE SUMMARY:
{json.dumps(mentor_stats, indent=2)}

NEW PROGRAMME DETAILS:
{json.dumps(new_programme, indent=2)}

Analyze the historical data and provide:
1. Which mentors performed best and in what domains
2. What matching patterns led to high satisfaction (>80 health score)
3. What patterns led to failures (<40 health score)
4. Specific recommendations for the new programme
5. Any mentors who should NOT be re-used (poor track record)

Respond with ONLY valid JSON, no markdown fences:
{{
  "topMentors": [
    {{
      "mentorId": "...",
      "avgHealthScore": 90,
      "bestDomain": "fintech",
      "recommendation": "Strongly recommend for new programme \u2014 consistent high performer"
    }}
  ],
  "successPatterns": ["Pattern 1 description", "Pattern 2 description"],
  "failurePatterns": ["Pattern 1 description"],
  "recommendations": ["Specific recommendation for new programme"],
  "carryOverSuggestions": [
    {{
      "mentorId": "...",
      "startupId": "...",
      "reason": "Unfinished mentorship from Programme A \u2014 startup still needs fundraising support"
    }}
  ]
}}"""
    
    return call_gemini_with_fallback(prompt, cache_key='cross_programme')
