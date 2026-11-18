// In-memory store for PA#2. The seed is fixed by Appendix A of
// docs/contract/spending-cap.md; tests rely on it, so change both together.

export type PlanStatus = 'saved' | 'needs-revalidation';

export interface Member {
  userId: number;
  capVnd: number | null;
  updatedAt: string | null;
}

export interface Group {
  id: number;
  totalVnd: number;
  members: Map<number, Member>;
}

export interface Plan {
  id: number;
  groupId: number;
  status: PlanStatus;
  costPerMemberVnd: Map<number, number>;
}

export interface Store {
  users: Set<number>;
  groups: Map<number, Group>;
  plans: Map<number, Plan>;
}

function group(id: number, totalVnd: number, memberIds: number[]): Group {
  const members = new Map<number, Member>();
  for (const userId of memberIds) {
    members.set(userId, { userId, capVnd: null, updatedAt: null });
  }
  return { id, totalVnd, members };
}

function plan(id: number, groupId: number, costs: Record<number, number>): Plan {
  const costPerMemberVnd = new Map<number, number>();
  for (const [userId, cost] of Object.entries(costs)) {
    costPerMemberVnd.set(Number(userId), cost);
  }
  return { id, groupId, status: 'saved', costPerMemberVnd };
}

export function createStore(): Store {
  return {
    users: new Set([1, 2, 3, 4, 5, 6]),
    groups: new Map([
      [1, group(1, 4_000_000, [1, 2, 3, 4])],
      [2, group(2, 2_000_000, [5])],
    ]),
    plans: new Map([
      [1, plan(1, 1, { 1: 900_000, 2: 950_000, 3: 800_000, 4: 700_000 })],
      [2, plan(2, 1, { 1: 600_000, 2: 600_000, 3: 600_000, 4: 600_000 })],
      [3, plan(3, 2, { 5: 1_500_000 })],
    ]),
  };
}
