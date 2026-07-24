export type D1Result<T = unknown> = {
  success: boolean;
  results?: T[];
  meta?: {
    changes?: number;
  };
};

export type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T = Record<string, unknown>>(
    columnName?: string,
  ) => Promise<T | null>;
  run: <T = unknown>() => Promise<D1Result<T>>;
  all: <T = Record<string, unknown>>() => Promise<D1Result<T>>;
};

export type D1Database = {
  prepare: (query: string) => D1PreparedStatement;
  batch: <T = unknown>(
    statements: D1PreparedStatement[],
  ) => Promise<D1Result<T>[]>;
};

export type RuntimeEnv = {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  FORM_DB?: D1Database;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_PRIVATE_KEY?: string;
  GOOGLE_SPREADSHEET_ID?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
  RATE_LIMIT_SECRET?: string;
  FORM_TOKEN_SECRET?: string;
};

export type FunctionContext = {
  request: Request;
  env: RuntimeEnv;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
};
