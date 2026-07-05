import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App.tsx';

describe('App shell', () => {
  it('renders inside the SoribashiProvider with the starter theme', () => {
    render(<App />);
    expect(screen.getByTestId('starter-main')).toBeInTheDocument();
  });
});
