/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace Vi {
    type JestAssertion<T = unknown> = jest.Matchers<void, T>;
  }
}

export {};
