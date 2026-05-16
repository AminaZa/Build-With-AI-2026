import os
import json
import re
import time
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account
from dotenv import load_dotenv

load_dotenv()

GCP_PROJECT_ID = os.getenv('GCP_PROJECT_ID')
GCP_LOCATION = os.getenv('GCP_LOCATION', 'us-central1')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
CREDENTIALS_PATH = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

model = None
try:
    if not GCP_PROJECT_ID:
        print("WARNING: GCP_PROJECT_ID not set in environment.")
    elif not CREDENTIALS_PATH or not os.path.exists(CREDENTIALS_PATH):
        print(f"WARNING: GOOGLE_APPLICATION_CREDENTIALS missing or file not found: {CREDENTIALS_PATH}")
    else:
        credentials = service_account.Credentials.from_service_account_file(
            CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/cloud-platform'],
        )
        vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION, credentials=credentials)
        model = GenerativeModel(GEMINI_MODEL)
except Exception as e:
    print(f"WARNING: Failed to initialize Vertex AI: {e}")

DEMO_MODE = os.getenv('DEMO_MODE', 'False').lower() == 'true'

REQUIRED_KEYS = {
    'matching_plan': {'pairings', 'unmatched', 'summary'},
    'health_insight': {'insight', 'suggestedAction', 'suggestedTopic', 'urgency', 'predictedOutcome'},
    'agent_action': {'action', 'tier', 'description', 'aiReasoning', 'suggestedMeetingTopic', 'newMentorSuggestion'},
    'cross_programme': {'topMentors', 'successPatterns', 'failurePatterns', 'recommendations', 'carryOverSuggestions'},
}

DEMO_CACHE = {
    'matching_plan_success': {
        "pairings": [
            {
                "mentorId": "mentor_001",
                "startupId": "startup_001",
                "confidence": 0.94,
                "reasoning": "Dr. Aisha's 12 years in fintech align perfectly with PayFlex's payment infrastructure focus. She achieved 95% satisfaction with similar startups previously.",
                "risks": "At 2/3 capacity — manageable but monitor.",
                "historicalNote": "Mentored PayFlex briefly in Programme A with a health score of 91."
            }
        ],
        "unmatched": [],
        "summary": "Prioritized expertise-domain alignment with capacity balancing. Used historical data to optimize for fintech focus."
    },
    'health_insight_success': {
        "insight": "Relationship is steady. Weekly meetings paired with a 4.5/5 feedback average indicate a productive cadence with the mentor's expertise actively landing.",
        "suggestedAction": None,
        "suggestedTopic": "Series A fundraising milestones",
        "urgency": "low",
        "predictedOutcome": "Continued steady progress toward programme outcomes if current cadence is maintained."
    },
    'health_insight_atrisk': {
        "insight": "Engagement is dropping — meetings have fallen from weekly to roughly once every 3-4 weeks and feedback slipped from 4.0 to 3.2 over the past 3 weeks. Mentor is at 3/3 capacity, so this startup is getting less attention than the other two on the roster.",
        "suggestedAction": "Send a focused meeting agenda to both parties to maximize the shorter cadence.",
        "suggestedTopic": "Series A fundraising deck review",
        "urgency": "medium",
        "predictedOutcome": "Without focused agendas, health is likely to slip into the failing band (<40) within 4-6 weeks."
    },
    'health_insight_failed': {
        "insight": "Kumar has ghosted the startup. Meeting frequency has flatlined at 0 and feedback sentiment trajectory shows severe degradation over the past 3 weeks.",
        "suggestedAction": "Immediately propose mentor reassignment.",
        "suggestedTopic": None,
        "urgency": "critical",
        "predictedOutcome": "Startup MedTrack will disengage from the program without immediate intervention."
    },
    'agent_action_success': {
        "action": "reminder_sent",
        "tier": "auto",
        "description": "Sent routine weekly meeting reminder to keep established cadence on track.",
        "aiReasoning": "Health score is above 80 with a stable trend. Light-touch Tier 1 maintenance is the right move.",
        "suggestedMeetingTopic": None,
        "newMentorSuggestion": None
    },
    'agent_action_atrisk': {
        "action": "agenda_sent",
        "tier": "inform",
        "description": "Sent focused meeting agenda: 'Series A fundraising deck review' after detecting declining feedback (4.0 → 3.2) over the past 3 weeks.",
        "aiReasoning": "Health score is 58 with a declining trend and mentor at 3/3 capacity. Pre-set agendas correlate with ~40% higher satisfaction in at-risk relationships per historical pattern, so a Tier 2 intervention is appropriate.",
        "suggestedMeetingTopic": "Series A fundraising deck review",
        "newMentorSuggestion": None
    },
    'agent_action_failed': {
        "action": "reassign_proposed",
        "tier": "approve",
        "description": "Proposed mentor reassignment due to critical health score (< 40) and consistent ghosting.",
        "aiReasoning": "Calculated health metric is below 40. Sentiment trajectory and meeting frequency dictate an automated Tier 3 reassignment loop.",
        "suggestedMeetingTopic": None,
        "newMentorSuggestion": "mentor_004"
    },
    'cross_programme': {
        "topMentors": [
            {
                "mentorId": "mentor_001",
                "avgHealthScore": 95,
                "bestDomain": "fintech",
                "recommendation": "Strongly recommend for new programme — consistent high performer."
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
                "startupId": "startup_001",
                "reason": "Unfinished mentorship from Programme A — PayFlex still needs fundraising support."
            }
        ]
    }
}


def _extract_json(text: str):
    text = text.strip()
    fence_match = re.match(r'^```(?:json)?\s*\n?(.*?)\n?```\s*$', text, re.DOTALL)
    if fence_match:
        text = fence_match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start = text.find('{')
    if start == -1:
        raise ValueError("No JSON object found in model output")
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        c = text[i]
        if escape:
            escape = False
            continue
        if c == '\\':
            escape = True
            continue
        if c == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return json.loads(text[start:i + 1])
    raise ValueError("Unbalanced JSON in model output")


def _validate(parsed, schema_family: str):
    expected = REQUIRED_KEYS.get(schema_family)
    if not expected:
        return parsed
    if not isinstance(parsed, dict):
        raise ValueError(f"Expected JSON object for {schema_family}, got {type(parsed).__name__}")
    missing = expected - set(parsed.keys())
    if missing:
        raise ValueError(f"Model output missing required keys for {schema_family}: {sorted(missing)}")
    return parsed


def call_gemini_with_fallback(prompt: str, cache_key: str = None, schema_family: str = None, retries: int = 1):
    if DEMO_MODE and cache_key and cache_key in DEMO_CACHE:
        print(f"[DEMO_MODE] Using cached response for {cache_key}")
        return DEMO_CACHE[cache_key]

    if model is None:
        if cache_key and cache_key in DEMO_CACHE:
            print(f"[FALLBACK] Vertex AI not initialized; using cached {cache_key}")
            return DEMO_CACHE[cache_key]
        raise RuntimeError("Vertex AI model not initialized. Check GOOGLE_APPLICATION_CREDENTIALS and GCP_PROJECT_ID.")

    last_err = None
    for attempt in range(retries + 1):
        try:
            response = model.generate_content(prompt)
            parsed = _extract_json(response.text)
            if schema_family:
                _validate(parsed, schema_family)
            return parsed
        except Exception as e:
            last_err = e
            print(f"Vertex AI error (attempt {attempt + 1}/{retries + 1}): {e}")
            if attempt < retries:
                time.sleep(0.5)

    if cache_key and cache_key in DEMO_CACHE:
        print(f"[FALLBACK] Using cached response for {cache_key} due to API error")
        return DEMO_CACHE[cache_key]
    raise last_err


def _compute_tier(linkage_data: dict, llm_tier: str = None) -> str:
    health = linkage_data.get('healthScore', 100)
    trend = linkage_data.get('healthTrend', 'stable')
    if health < 40:
        return 'approve'
    if health < 70 or trend == 'declining':
        return 'inform'
    return llm_tier if llm_tier in {'auto', 'inform', 'approve'} else 'auto'


def generate_matching_plan(mentors, startups, goals, historical_data=None):
    cache_key = 'matching_plan_success'
    prompt = f"""You are an ecosystem matching engine for an innovation programme.

Your job: create optimal mentor-startup pairings that maximize programme outcomes.

AVAILABLE MENTORS:
{json.dumps(mentors, indent=2)}

UNMATCHED STARTUPS:
{json.dumps(startups, indent=2)}

PROGRAMME GOALS:
{json.dumps(goals, indent=2)}

{"HISTORICAL DATA FROM PAST PROGRAMMES:" + json.dumps(historical_data, indent=2) if historical_data else "No historical data available — this is the first programme."}

RULES:
- Each mentor can be matched to at most their capacity limit
- Prioritize expertise alignment (mentor's expertise should match startup's domain)
- DIVERSITY GUARDRAIL: Avoid concentrating more than 2 startups on a single mentor even if capacity allows 3. If a mentor must take a 3rd, flag it in 'risks' and lower confidence. Surface newer mentors (no historicalScore) where their expertise fits, with a note that they're a cold-start pick.
- ECOSYSTEM CONFLICT-OF-INTEREST GUARDRAIL: If a mentor is already assigned to a startup in the exact same domain/niche, flag a warning in the 'risks' field and lower the matching confidence score.
- If historical data exists, factor in past performance (high satisfaction = prefer that mentor for similar startups)
- Flag risks explicitly (capacity stretched, domain mismatch, new mentor with no track record)
- If a mentor and startup worked together before and it went well, note this as a positive signal

IMPORTANT: Return ONLY a raw JSON object. Do not include any markdown formatting, no ```json blocks, no leading conversational text, and no trailing text. Your entire response must be parseable by json.loads(). Use this exact structure:
{{
  "pairings": [
    {{
      "mentorId": "mentor_001",
      "startupId": "startup_001",
      "confidence": 0.92,
      "reasoning": "2-3 sentence explanation of why this is a good match",
      "risks": "Any concerns or null if none",
      "historicalNote": "Any relevant past interaction or null"
    }}
  ],
  "unmatched": ["startup_ids that couldn't be matched and why"],
  "summary": "One paragraph overview of the matching strategy"
}}"""

    return call_gemini_with_fallback(prompt, cache_key=cache_key, schema_family='matching_plan')


def generate_health_insight(linkage_data):
    health = linkage_data.get('healthScore', 100)
    if health < 40:
        cache_key = 'health_insight_failed'
    elif health < 70:
        cache_key = 'health_insight_atrisk'
    else:
        cache_key = 'health_insight_success'

    prompt = f"""You are an AI relationship analyst for an innovation ecosystem.

Analyze this mentor-startup relationship and provide insights.

RELATIONSHIP DATA:
{json.dumps(linkage_data, indent=2)}

CONTEXT:
- meetingFrequency is meetings per week (1.0 = weekly, 0.5 = biweekly, 0 = no meetings)
- feedbackAvg is on a 1-5 scale (5 = excellent)
- healthScore is 0-100 (>70 = healthy, 40-70 = at risk, <40 = failing)
- SENTIMENT TRAJECTORY ANALYSIS: Inspect the textual feedback array chronologically. If the tone is degrading over time, automatically escalate the 'urgency' field to 'high' or 'critical'.
- healthTrend shows direction over the past 2 weeks

IMPORTANT: Return ONLY a raw JSON object. Do not include any markdown formatting, no ```json blocks, no leading conversational text, and no trailing text. Your entire response must be parseable by json.loads().
{{
  "insight": "2-3 sentence plain-english explanation of what's happening in this relationship. Be specific — reference actual numbers. Don't be generic.",
  "suggestedAction": "One specific action the agent should take, or null if relationship is healthy",
  "suggestedTopic": "If a meeting topic would help, suggest one based on the startup's needs, or null",
  "urgency": "low | medium | high | critical",
  "predictedOutcome": "What will happen in 2 weeks if nothing changes"
}}"""

    return call_gemini_with_fallback(prompt, cache_key=cache_key, schema_family='health_insight')


def decide_agent_action(linkage_data):
    health = linkage_data.get('healthScore', 100)
    if health < 40:
        cache_key = 'agent_action_failed'
    elif health < 70:
        cache_key = 'agent_action_atrisk'
    else:
        cache_key = 'agent_action_success'

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

DECISION GUIDELINES:
- If the relationship is healthy (score >70, stable/improving trend), prefer "do_nothing" or a Tier 1 maintenance action.
- For routine maintenance (reminders, topics), use Tier 1.
- For declining or at-risk relationships, lean towards Tier 2 interventions.
- For critical relationships (health <40), propose Tier 3 reassign_proposed and suggest an alternative mentor ID in 'newMentorSuggestion'.
- Always cite specific data points (meetingFrequency, feedbackAvg, healthScore) in your reasoning.

IMPORTANT: Return ONLY a raw JSON object. Do not include any markdown formatting, no ```json blocks, no leading conversational text, and no trailing text. Your entire response must be parseable by json.loads().
{{
  "action": "the action type or do_nothing",
  "tier": "auto | inform | approve",
  "description": "What the agent will do, written as a past-tense activity log entry (e.g. 'Sent meeting reminder with topic suggestion')",
  "aiReasoning": "2-3 sentences explaining why, citing specific numbers from the linkage data",
  "suggestedMeetingTopic": "If relevant, a specific meeting topic, otherwise null",
  "newMentorSuggestion": "If action is reassign_proposed, suggest a replacement mentor type, otherwise null"
}}"""

    result = call_gemini_with_fallback(prompt, cache_key=cache_key, schema_family='agent_action')
    result['tier'] = _compute_tier(linkage_data, result.get('tier'))
    return result


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

IMPORTANT: Return ONLY a raw JSON object. Do not include any markdown formatting, no ```json blocks, no leading conversational text, and no trailing text. Your entire response must be parseable by json.loads().
{{
  "topMentors": [
    {{
      "mentorId": "...",
      "avgHealthScore": 90,
      "bestDomain": "fintech",
      "recommendation": "Strongly recommend for new programme — consistent high performer"
    }}
  ],
  "successPatterns": ["Pattern 1 description", "Pattern 2 description"],
  "failurePatterns": ["Pattern 1 description"],
  "recommendations": ["Specific recommendation for new programme"],
  "carryOverSuggestions": [
    {{
      "mentorId": "...",
      "startupId": "...",
      "reason": "Unfinished mentorship from Programme A — startup still needs fundraising support"
    }}
  ]
}}"""

    return call_gemini_with_fallback(prompt, cache_key='cross_programme', schema_family='cross_programme')
