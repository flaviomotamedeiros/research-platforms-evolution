import type { ContentModulePlugin, RenderedContent } from '@rpe/plugin-sdk'

/**
 * mod_page — rich HTML page content module.
 * The Moodle counterpart: mod/page. Stores an HTML body authored by the
 * teacher; renders it inline as reading material.
 */
export const modPage: ContentModulePlugin = {
  metadata: {
    id: 'mod_page',
    name: 'Page',
    version: '1.0.0',
    requires: '1.0.0',
    description: 'Rich HTML page rendered inline as reading material.',
    author: 'research-platforms-evolution',
  },
  displayName: 'Reading',
  icon: '📄',
  render(stored: string): RenderedContent {
    return { medium: 'html', html: stored }
  },
}
