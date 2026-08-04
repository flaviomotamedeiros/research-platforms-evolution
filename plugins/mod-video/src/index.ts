import type { ContentModulePlugin, RenderedContent } from '@rpe/plugin-sdk'

interface VideoPayload {
  ytId: string
  note?: string
}

/**
 * mod_video — embedded video content module.
 * Stores a JSON payload { ytId, note } and renders a privacy-enhanced
 * YouTube embed. The core knows nothing about YouTube: it only receives
 * an embed URL through the RenderedContent contract.
 */
export const modVideo: ContentModulePlugin = {
  metadata: {
    id: 'mod_video',
    name: 'Video',
    version: '1.0.0',
    requires: '1.0.0',
    description: 'Embedded video lesson via privacy-enhanced player.',
    author: 'research-platforms-evolution',
  },
  displayName: 'Video',
  icon: '🎬',
  render(stored: string): RenderedContent {
    let payload: VideoPayload
    try {
      payload = JSON.parse(stored) as VideoPayload
    } catch {
      // legacy/plain id fallback — never throw on malformed input
      payload = { ytId: stored }
    }
    return {
      medium: 'embed',
      embedUrl: `https://www.youtube-nocookie.com/embed/${payload.ytId}`,
      note: payload.note,
    }
  },
}
