# @redactenv/patterns

Curated regex catalog of common secret formats. Plug into `@redactenv/core` rules.

```bash
npm install @redactenv/patterns
```

## Usage

```ts
import { createRedactor } from '@redactenv/core';
import { patterns, highConfidencePatterns, allPatterns } from '@redactenv/patterns';

createRedactor({
  rules: [
    patterns.stripeLive,
    patterns.githubToken,
    ...highConfidencePatterns,  // every confidence:'high' rule
  ],
});
```

## Catalog

| Key | Matches | Confidence |
|---|---|---|
| `awsAccessKey` | `AKIA…` / `ASIA…` 20-char IDs | high |
| `awsSecretKey` | 40-char base64-ish (high false-positive) | medium |
| `stripeLive` | `sk_live_` / `rk_live_` / `pk_live_` | high |
| `stripeTest` | `sk_test_` / `rk_test_` / `pk_test_` | high |
| `githubToken` | `ghp_` / `ghs_` / `gho_` / `ghu_` / `ghr_` | high |
| `openaiKey` | `sk-…` / `sk-proj-…` | high |
| `anthropicKey` | `sk-ant-…` | high |
| `googleApiKey` | `AIza…` 39 chars | high |
| `slackToken` | `xoxb-` / `xoxp-` / `xoxa-` / `xoxr-` / `xoxs-` | high |
| `jwt` | `eyJ…\.…\.…` | high |
| `privateKey` | `-----BEGIN … PRIVATE KEY-----` blocks | high |
| `bearerHeader` | `Bearer <token>` 20+ chars | medium |

Use `allPatterns` for everything (includes medium). Use `highConfidencePatterns` to skip noisy medium-confidence patterns.

## Override action per pattern

```ts
{ ...patterns.stripeLive, action: 'hash' }
```

License: MIT
