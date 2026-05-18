import { createDefaultRedactor } from '@redactenv/patterns';
import { redactenv } from './index.js';

const { redactor } = createDefaultRedactor();

export const middleware = redactenv({ redactor });
export const errorHandler = redactenv.errorHandler({ redactor });
export { redactor };

export default middleware;
