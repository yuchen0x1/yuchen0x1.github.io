import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
afterEach(cleanup);
Object.defineProperty(window, 'matchMedia', {value: vi.fn((q:string)=>({matches:q.includes('reduced-motion'),media:q,addEventListener:vi.fn(),removeEventListener:vi.fn()}))});
HTMLElement.prototype.scrollIntoView = vi.fn();
