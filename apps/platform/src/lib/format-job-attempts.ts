function toDisplayMaxAttempts(maxAttempts: number) {
  return maxAttempts > 0 ? maxAttempts : 1;
}

function attemptNoun(count: number) {
  return count === 1 ? "attempt" : "attempts";
}

export function formatJobAttemptsValue(
  attemptsMade: number,
  maxAttempts?: number,
) {
  if (maxAttempts != null) {
    const max = toDisplayMaxAttempts(maxAttempts);
    return `${attemptsMade} / ${max}`;
  }

  return String(attemptsMade);
}

export function formatJobAttemptsLabel(
  attemptsMade: number,
  maxAttempts?: number,
) {
  if (maxAttempts != null) {
    const max = toDisplayMaxAttempts(maxAttempts);
    return `${attemptsMade}/${max} ${attemptNoun(max)}`;
  }

  return `${attemptsMade} ${attemptNoun(attemptsMade)}`;
}
