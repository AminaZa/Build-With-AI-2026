import ai_engine
import json

def test_all():
    print("=== Testing generate_matching_plan ===")
    res_match = ai_engine.generate_matching_plan([], [], {})
    print(json.dumps(res_match, indent=2))
    
    print("\n=== Testing generate_health_insight (Failed Scenario) ===")
    res_insight = ai_engine.generate_health_insight({'startupId': 'startup_002', 'mentorId': 'mentor_002'})
    print(json.dumps(res_insight, indent=2))
    
    print("\n=== Testing decide_agent_action (Failed Scenario) ===")
    res_action = ai_engine.decide_agent_action({'startupId': 'startup_002', 'mentorId': 'mentor_002'})
    print(json.dumps(res_action, indent=2))
    
    print("\n=== Testing generate_cross_programme_insights ===")
    res_cross = ai_engine.generate_cross_programme_insights([], {}, {})
    print(json.dumps(res_cross, indent=2))

if __name__ == "__main__":
    test_all()
