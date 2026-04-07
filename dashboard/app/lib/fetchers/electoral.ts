export async function fetchByElectionResults(): Promise<{
  recentByElections: number;
  labourLosses: number;
  formatted: string;
}> {
  const res = await fetch(
    "https://candidates.democracyclub.org.uk/api/next/ballots/?election_date_after=2026-01-01&election_type=by-election",
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) {
    return {
      recentByElections: 0,
      labourLosses: 0,
      formatted: "Unable to fetch by-election data",
    };
  }

  const data = await res.json();
  const count = data.count || 0;

  return {
    recentByElections: count,
    labourLosses: 0,
    formatted: `${count} by-elections tracked in 2026`,
  };
}
