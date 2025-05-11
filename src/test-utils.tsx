import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

// Export everything from testing-library
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event';

// Re-export everything from jest-dom
import '@testing-library/jest-dom';

function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return rtlRender(ui, { ...options });
}

export { render };
