import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageMeta } from '@/hooks/usePageMeta';

describe('usePageMeta hook', () => {
  beforeEach(() => {
    document.title = 'Initial Title';
    const existingMeta = document.querySelector('meta[name="description"]');
    if (existingMeta) {
      existingMeta.remove();
    }
  });

  it('updates document title with AgroDirect Hub suffix', () => {
    renderHook(() =>
      usePageMeta({
        title: 'Marketplace Feed',
      })
    );

    expect(document.title).toBe('Marketplace Feed | AgroDirect Hub');
  });

  it('creates and updates meta description tag', () => {
    renderHook(() =>
      usePageMeta({
        title: 'Commodity Reports',
        description: 'Live agricultural commodity intelligence reports.',
      })
    );

    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute('content')).toBe('Live agricultural commodity intelligence reports.');
  });

  it('updates existing meta description without creating duplicates', () => {
    const { rerender } = renderHook(
      ({ desc }) =>
        usePageMeta({
          title: 'Dynamic Page',
          description: desc,
        }),
      { initialProps: { desc: 'Initial Description' } }
    );

    expect(document.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Initial Description'
    );

    rerender({ desc: 'Updated Description' });

    expect(document.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Updated Description'
    );
  });
});
