import type { ContentModulePlugin, RenderedContent } from '@rpe/plugin-sdk'

/**
 * mod_url — external link content module.
 * The Moodle counterpart: mod/url. Stores an external URL and presents it
 * as a link opened in a new tab.
 */
export const modUrl: ContentModulePlugin = {
  metadata: {
    id: 'mod_url',
    name: 'External URL',
    version: '1.0.0',
    requires: '1.0.0',
    description: 'External resource opened in a new tab.',
    author: 'research-platforms-evolution',
  },
  displayName: 'Link',
  icon: '🔗',
  render(stored: string): RenderedContent {
    return { medium: 'link', url: stored }
  },
}
