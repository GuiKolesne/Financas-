import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cada teste começa com o DOM limpo, para um não enxergar o outro.
afterEach(cleanup);
