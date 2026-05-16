import ai_engine
import json
import os
from collections import defaultdict


def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def banner(title):
    print('\n' + '=' * 70)
    print(title)
    print('=' * 70)


def check(label, condition, detail=''):
    status = 'PASS' if condition else 'FAIL'
    print(f'  [{status}] {label}' + (f'  ({detail})' if detail else ''))
    return condition


def find_seed_dir():
    # Works whether this file is at repo root (post-merge) or in backend/ (pre-merge)
    here = os.path.dirname(os.path.abspath(__file__))
    for candidate in [os.path.join(here, 'seed_data'),
                      os.path.join(os.path.dirname(here), 'seed_data')]:
        if os.path.isdir(candidate):
            return candidate
    raise FileNotFoundError("Could not locate seed_data/ next to or above test_execution.py")


def main():
    seed_dir = find_seed_dir()
    actors = load_json(os.path.join(seed_dir, 'actors.json'))
    linkages = load_json(os.path.join(seed_dir, 'linkages.json'))
    programmes = load_json(os.path.join(seed_dir, 'programmes.json'))
    actions_log = load_json(os.path.join(seed_dir, 'actions.json'))

    actor_ids = {a['id'] for a in actors}
    mentors = [a for a in actors if a['type'] == 'mentor']
    startups = [a for a in actors if a['type'] == 'startup']

    # ---------- Structural integrity ----------
    banner('Seed data structural integrity')
    check(f'actors loaded: {len(actors)} (12 mentors + 20 startups + 4 partners expected)',
          len(mentors) == 12 and len(startups) == 20)
    check(f'linkages loaded: {len(linkages)}', len(linkages) > 0)
    check(f'programmes loaded: {len(programmes)}', len(programmes) == 2)
    check(f'action log entries: {len(actions_log)}', len(actions_log) > 0)

    bad_refs = []
    for l in linkages:
        if l['mentorId'] not in actor_ids:
            bad_refs.append(f"{l['id']} mentor {l['mentorId']}")
        if l['startupId'] not in actor_ids:
            bad_refs.append(f"{l['id']} startup {l['startupId']}")
    check('all linkages reference real actors', not bad_refs, '; '.join(bad_refs[:3]))

    bands = defaultdict(list)
    for l in linkages:
        if l.get('status') == 'completed':
            continue
        score = l.get('healthScore', 100)
        if score < 40:
            bands['failing'].append(l)
        elif score < 70:
            bands['atrisk'].append(l)
        else:
            bands['healthy'].append(l)
    print(f'  active linkage bands  healthy={len(bands["healthy"])}, '
          f'at-risk={len(bands["atrisk"])}, failing={len(bands["failing"])}')

    # ---------- Pick representatives ----------
    healthy = next(l for l in bands['healthy'] if l['id'] == 'link_B_01')
    atrisk = next(l for l in bands['atrisk'] if l['id'] == 'link_B_13')
    failing = next(l for l in bands['failing'] if l['id'] == 'link_B_20')

    # ---------- generate_health_insight ----------
    for label, link in [('healthy link_B_01', healthy),
                        ('at-risk link_B_13', atrisk),
                        ('failing link_B_20', failing)]:
        banner(f'generate_health_insight — {label}')
        res = ai_engine.generate_health_insight(link)
        print(json.dumps(res, indent=2))
        check('urgency in expected vocabulary',
              res['urgency'] in {'low', 'medium', 'high', 'critical'})
        check('insight non-empty', bool(res.get('insight')))

    # ---------- decide_agent_action ----------
    expected_tier = {'healthy link_B_01': 'auto',
                     'at-risk link_B_13': 'inform',
                     'failing link_B_20': 'approve'}
    for label, link in [('healthy link_B_01', healthy),
                        ('at-risk link_B_13', atrisk),
                        ('failing link_B_20', failing)]:
        banner(f'decide_agent_action — {label}')
        res = ai_engine.decide_agent_action(link)
        print(json.dumps(res, indent=2))
        check(f"tier == {expected_tier[label]} (deterministic override)",
              res['tier'] == expected_tier[label], f"got {res['tier']}")

    # ---------- generate_matching_plan ----------
    banner('generate_matching_plan — re-match the 3 paused startups')
    paused_startup_ids = [l['startupId'] for l in linkages if l.get('status') == 'paused']
    unmatched_startups = [s for s in startups if s['id'] in paused_startup_ids]
    candidate_mentors = [m for m in mentors if m.get('historicalScore')][:6]
    partners = [a for a in actors if a.get('type') == 'partner']
    goals = next(p['goals'] for p in programmes if p['id'] == 'prog_B')
    plan = ai_engine.generate_matching_plan(candidate_mentors, partners, unmatched_startups, goals)
    print(json.dumps(plan, indent=2))
    check('pairings list present', isinstance(plan.get('pairings'), list))
    check('summary non-empty', bool(plan.get('summary')))

    # ---------- generate_cross_programme_insights ----------
    banner('generate_cross_programme_insights — prog_A -> prog_B handoff')
    completed = [l for l in linkages if l.get('status') == 'completed']
    mentor_stats = defaultdict(lambda: {'count': 0, 'scoreSum': 0})
    for l in completed:
        s = mentor_stats[l['mentorId']]
        s['count'] += 1
        s['scoreSum'] += l.get('healthScore', 0)
    mentor_stats = {k: {'count': v['count'],
                        'avgScore': round(v['scoreSum'] / v['count'])}
                    for k, v in mentor_stats.items()}
    new_programme = next(p for p in programmes if p['id'] == 'prog_B')
    insights = ai_engine.generate_cross_programme_insights(completed, mentor_stats, new_programme)
    print(json.dumps(insights, indent=2))
    check('topMentors present', isinstance(insights.get('topMentors'), list))
    check('recommendations non-empty', bool(insights.get('recommendations')))

    print('\nDone.')


if __name__ == '__main__':
    main()
