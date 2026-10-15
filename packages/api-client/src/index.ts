export type ApiClientOptions = {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
};

export function createApiClient(options: ApiClientOptions) {
  const request = options.fetch ?? globalThis.fetch;
  return {
    async health(): Promise<{ status: string }> {
      const response = await request(`${options.baseUrl}/health`);
      if (!response.ok)
        throw new Error(`API health failed: ${response.status}`);
      return (await response.json()) as { status: string };
    },
  };
}
