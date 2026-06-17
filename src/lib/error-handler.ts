export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}

export function handleApiError(context: string, error: unknown): string {
  const message =
    error instanceof Error ? error.message :
    typeof error === "string" ? error :
    "An unexpected error occurred";
  logError(context, error);
  return message;
}
