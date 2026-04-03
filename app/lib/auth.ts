export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  configuredSecret: string | undefined
): boolean {
  if (!configuredSecret) {
    return false;
  }

  return authorizationHeader === `Bearer ${configuredSecret}`;
}
