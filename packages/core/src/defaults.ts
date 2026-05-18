/**
 * Env keys that are conventionally NOT secrets. Skipped during env
 * snapshotting so the redactor doesn't replace common configuration
 * strings like "development" or "/usr/bin" appearing in responses.
 *
 * Glob supported: trailing `*` matches a prefix.
 */
export const DEFAULT_ALLOW_ENV_KEYS: string[] = [
  // Node / runtime
  'NODE_ENV',
  'NODE_OPTIONS',
  'NODE_VERSION',
  'NODE_PATH',
  // HTTP server config
  'PORT',
  'HOST',
  'HOSTNAME',
  // Logging
  'LOG_LEVEL',
  'LOG_FORMAT',
  'DEBUG',
  // OS / shell
  'PATH',
  'HOME',
  'USER',
  'SHELL',
  'PWD',
  'LANG',
  'LC_*',
  'TZ',
  'TERM',
  'EDITOR',
  // npm / package manager
  'npm_*',
  'PNPM_*',
  'YARN_*',
  // Next.js public + framework-known non-secret
  'NEXT_PUBLIC_*',
  'NEXT_RUNTIME',
  'NEXT_TELEMETRY_DISABLED',
  '__NEXT_*',
  // Vercel metadata (NOT VERCEL_*_TOKEN; those have explicit token suffix)
  'VERCEL',
  'VERCEL_ENV',
  'VERCEL_URL',
  'VERCEL_REGION',
  'VERCEL_GIT_*',
  // AWS region (region != credential)
  'AWS_REGION',
  'AWS_DEFAULT_REGION',
  'AWS_EXECUTION_ENV',
  'AWS_LAMBDA_FUNCTION_NAME',
  'AWS_LAMBDA_FUNCTION_VERSION',
  'AWS_LAMBDA_FUNCTION_MEMORY_SIZE',
  // CI metadata
  'CI',
  'GITHUB_ACTIONS',
  'GITHUB_REF',
  'GITHUB_SHA',
  'GITHUB_REPOSITORY',
  'GITHUB_WORKFLOW',
  'GITHUB_RUN_*',
  'GITLAB_CI',
  'CIRCLECI',
  // Cloud Run / GCP non-secret metadata
  'K_SERVICE',
  'K_REVISION',
  'K_CONFIGURATION',
  'GOOGLE_CLOUD_PROJECT',
];

/**
 * Minimum length for an env value to be considered a candidate secret.
 * Short values (`true`, `production`, `3000`) cause false positives.
 */
export const DEFAULT_MIN_SECRET_LENGTH = 12;
