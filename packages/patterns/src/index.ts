import type { PatternRule } from '@redactenv/core';

export const patterns = {
  awsAccessKey: {
    name: 'aws-access-key',
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    confidence: 'high',
  } satisfies PatternRule,

  awsSecretKey: {
    name: 'aws-secret-key',
    // 40-char base64-ish; medium confidence (high false-positive without context)
    pattern: /\b(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])\b/g,
    confidence: 'medium',
  } satisfies PatternRule,

  stripeLive: {
    name: 'stripe-live',
    pattern: /\b(?:sk|rk|pk)_live_[A-Za-z0-9]{24,}\b/g,
    confidence: 'high',
  } satisfies PatternRule,

  stripeTest: {
    name: 'stripe-test',
    pattern: /\b(?:sk|rk|pk)_test_[A-Za-z0-9]{24,}\b/g,
    confidence: 'high',
  } satisfies PatternRule,

  githubToken: {
    name: 'github-token',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
    confidence: 'high',
  } satisfies PatternRule,

  openaiKey: {
    name: 'openai-key',
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
    confidence: 'high',
  } satisfies PatternRule,

  anthropicKey: {
    name: 'anthropic-key',
    pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
    confidence: 'high',
  } satisfies PatternRule,

  googleApiKey: {
    name: 'google-api-key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    confidence: 'high',
  } satisfies PatternRule,

  slackToken: {
    name: 'slack-token',
    pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
    confidence: 'high',
  } satisfies PatternRule,

  jwt: {
    name: 'jwt',
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    confidence: 'high',
  } satisfies PatternRule,

  privateKey: {
    name: 'private-key-block',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP |ENCRYPTED )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |DSA |PGP |ENCRYPTED )?PRIVATE KEY-----/g,
    confidence: 'high',
  } satisfies PatternRule,

  bearerHeader: {
    name: 'bearer-token',
    pattern: /\bBearer\s+[A-Za-z0-9_\-.=]{20,}\b/g,
    confidence: 'medium',
  } satisfies PatternRule,
} as const;

export const highConfidencePatterns: PatternRule[] = Object.values(patterns).filter(
  (p) => p.confidence === 'high'
);

export const allPatterns: PatternRule[] = Object.values(patterns);
