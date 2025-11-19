import { CreateListingInput } from '../../shared/contracts/listing';

export function validateCreateListingInput(input: CreateListingInput): void {
  if (!input.title || input.title.length < 6 || input.title.length > 60) {
    throw new Error('title length invalid');
  }
  if (!input.description || input.description.length < 10 || input.description.length > 500) {
    throw new Error('description length invalid');
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error('price invalid');
  }
  if (!['buy', 'sell', 'trade', 'other'].includes(input.tradeType)) {
    throw new Error('trade type invalid');
  }
  if (input.keywords && input.keywords.length > 5) {
    throw new Error('keywords too many');
  }
}
