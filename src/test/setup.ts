import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do window.location
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'localhost',
    pathname: '/',
    search: '',
  },
  writable: true,
});
