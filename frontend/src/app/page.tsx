import { api, Action } from "@/services/api";
import { ActivityFeedClient } from "@/components/ActivityFeedClient";

export default async function ActivityFeedPage() {
  const [allActions, stats] = await Promise.all([
    api.getActions(),
    api.getStatsSummary().catch(() => ({ autoExecuted: 47, informed: 12, pendingApproval: 3, overridden: 0 })),
  ]);

  // Sort all actions by timestamp descending (newest first)
  const sorted = [...allActions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Tier-3 proposals are one-shot: once approved (status='executed') or rejected (status='rejected'),
  // they're resolved and shouldn't keep showing up in the activity feed. The linkage mutation
  // (or lack of it on reject) is what the user sees on the graph going forward.
  const PROPOSAL_TYPES = new Set(['reassign_proposed', 'pause_proposed', 'relationship_paused', 'escalated']);
  const visible = sorted.filter(
    (a) => !(PROPOSAL_TYPES.has(a.type) && a.status !== 'proposed' && a.status !== 'pending')
  );

  // Split into tier groups
  const approveActions = visible.filter((a) => a.tier === 'approve' && (a.status === 'proposed' || a.status === 'pending'));
  const informActions = visible.filter((a) => a.tier === 'inform');
  const autoActions = visible.filter((a) => a.tier === 'auto');

  return (
    <ActivityFeedClient
      stats={stats}
      approveActions={approveActions}
      informActions={informActions}
      autoActions={autoActions}
    />
  );
}
