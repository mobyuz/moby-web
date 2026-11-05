import type { components } from "./schema";

export type Model<Name extends keyof components["schemas"]> = components["schemas"][Name];
type TokenPair = Model<"TokenPair">;

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly authChallenge = false) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonBody(body: unknown, method = "POST"): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function apiResponse(path: string, init: RequestInit = {}): Promise<Response> {
  const timeout = AbortSignal.timeout(30_000);
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError(timeout.aborted ? "The API request timed out." : "Could not reach the Moby API.", 0);
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === "object" && "message" in body && typeof body.message === "string"
      ? body.message
      : `The Moby API returned HTTP ${response.status}.`;
    throw new ApiError(message, response.status, response.headers.get("WWW-Authenticate") === "Bearer");
  }
  return response;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  return (await apiResponse(path, init)).json();
}

export class BrowserSession {
  private tokens: TokenPair | null;
  private expiresAt: number;
  private refreshFlight?: Promise<TokenPair>;
  private signingOut = false;
  private readonly controller = new AbortController();

  constructor(tokens: TokenPair, private readonly onEnd: () => void) {
    this.tokens = tokens;
    this.expiresAt = Date.now() + tokens.expires_in * 1000;
  }

  get installationId() {
    return this.requireTokens().installation_id;
  }

  private requireTokens() {
    if (!this.tokens || this.signingOut) throw new ApiError("Your session ended. Sign in again.", 401);
    return this.tokens;
  }

  end() {
    this.tokens = null;
    this.controller.abort();
    this.onEnd();
  }

  private refresh(previous: TokenPair): Promise<TokenPair> {
    const current = this.requireTokens();
    if (current !== previous) return Promise.resolve(current);

    this.refreshFlight ??= apiJson<TokenPair>("/v1/auth/refresh", {
      ...jsonBody({ refresh_token: current.refresh_token } satisfies Model<"Refresh">),
      signal: this.controller.signal,
    }).then((tokens) => {
      if (!this.tokens) throw new ApiError("Your session ended. Sign in again.", 401);
      this.tokens = tokens;
      this.expiresAt = Date.now() + tokens.expires_in * 1000;
      return tokens;
    }).catch((error: unknown) => {
      this.end();
      throw error;
    }).finally(() => {
      this.refreshFlight = undefined;
    });
    return this.refreshFlight;
  }

  async request(path: string, init: RequestInit = {}): Promise<Response> {
    let tokens = this.requireTokens();
    if (this.expiresAt <= Date.now() + 15_000) tokens = await this.refresh(tokens);
    this.requireTokens();
    const headers = new Headers(init.headers);
    const signal = init.signal
      ? AbortSignal.any([init.signal, this.controller.signal])
      : this.controller.signal;
    const send = (accessToken: string) => {
      headers.set("Authorization", `Bearer ${accessToken}`);
      return apiResponse(path, { ...init, headers, signal });
    };
    try {
      return await send(tokens.access_token);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401 && error.authChallenge) || signal.aborted) throw error;
      const refreshed = await this.refresh(tokens);
      try {
        return await send(refreshed.access_token);
      } catch (retryError) {
        if (retryError instanceof ApiError && retryError.status === 401 && retryError.authChallenge) this.end();
        throw retryError;
      }
    }
  }

  async json<T>(path: string, init?: RequestInit): Promise<T> {
    return (await this.request(path, init)).json();
  }

  async signOut() {
    this.signingOut = true;
    try {
      await this.refreshFlight?.catch(() => undefined);
      if (this.tokens) {
        await apiResponse("/v1/auth/logout", jsonBody({
          refresh_token: this.tokens.refresh_token,
        } satisfies Model<"Refresh">));
      }
    } finally {
      this.end();
    }
  }
}
