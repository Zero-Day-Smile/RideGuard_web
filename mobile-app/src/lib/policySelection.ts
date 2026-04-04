const SELECTED_POLICY_KEY = "rideguard-selected-policy-id";

export function getSelectedPolicyId(): number | null {
  const raw = localStorage.getItem(SELECTED_POLICY_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function setSelectedPolicyId(policyId: number): void {
  localStorage.setItem(SELECTED_POLICY_KEY, String(policyId));
}
