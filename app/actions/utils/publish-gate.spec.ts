import { describe, expect, it } from 'vitest';
import { PUBLISH_BLOCK_MESSAGES } from '@/src/lib/entitlements';
import { publishBlockError, templateIdOf } from './publish-gate';

describe('templateIdOf', () => {
  it('lukee templateId:n sisällöstä', () => {
    expect(templateIdOf({ templateId: 'portfolio', sections: [] })).toBe('portfolio');
  });

  it.each([null, undefined, 'x', {}, { templateId: '' }, { templateId: 5 }])('palauttaa null: %j', (content) => {
    expect(templateIdOf(content)).toBeNull();
  });
});

describe('publishBlockError', () => {
  it('käyttää estokoodin viestiä', () => {
    expect(publishBlockError('PAYMENT_REQUIRED')).toEqual({
      code: 'PAYMENT_REQUIRED',
      error: PUBLISH_BLOCK_MESSAGES.PAYMENT_REQUIRED,
    });
  });

  it('tarkistusvirheelle oma viesti', () => {
    expect(publishBlockError('CHECK_FAILED').error).toMatch(/tarkistus epäonnistui/);
  });
});
