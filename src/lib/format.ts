export const formatNumber = (n: number) => n.toLocaleString("en-US");

/** Impact Scores can have up to 2 decimals (e.g. 1.2 per run). */
export const formatScore = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

/** +100 / -50 / 0 for bonuses and penalties. */
export const formatSigned = (n: number) =>
  n > 0 ? `+${formatScore(n)}` : formatScore(n);
