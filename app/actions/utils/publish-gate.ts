import { PUBLISH_BLOCK_MESSAGES, type PublishBlock } from '@/src/lib/entitlements';

export type PublishErrorCode = PublishBlock | 'CHECK_FAILED';

export type PublishErrorResult = { error?: string; code?: PublishErrorCode };

/** Sivun sisällön templateId; null jos sisältö ei ole pohjapohjainen. */
export function templateIdOf(content: unknown): string | null {
  if (!content || typeof content !== 'object') return null;
  const id = (content as { templateId?: unknown }).templateId;
  return typeof id === 'string' && id ? id : null;
}

export function publishBlockError(code: PublishErrorCode): PublishErrorResult {
  return {
    code,
    error:
      code === 'CHECK_FAILED'
        ? 'Julkaisuoikeuden tarkistus epäonnistui. Yritä hetken päästä uudelleen.'
        : PUBLISH_BLOCK_MESSAGES[code],
  };
}
