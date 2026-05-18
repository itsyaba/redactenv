import { createDefaultRedactor } from '@redactenv/patterns';
import { installNext } from './index.js';

const { redactor } = createDefaultRedactor();
installNext({ redactor, rules: [] });

export { redactor };
