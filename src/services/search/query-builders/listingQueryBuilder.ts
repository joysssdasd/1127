import { ListingPayload } from '../../../shared/contracts/listing';
import { ListingSearchResult } from '../../../shared/contracts/search';

interface ScoreItem extends ListingSearchResult {
  score: number;
}

function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().trim();
}

export function buildSearchResults(keyword: string, listings: ListingPayload[]): ListingSearchResult[] {
  const normalized = normalizeKeyword(keyword);
  const results: ScoreItem[] = listings.map((listing) => {
    const title = listing.title.toLowerCase();
    const description = listing.description.toLowerCase();
    const keywords = listing.keywords.map((k) => k.toLowerCase());
    const matchesTitle = title.includes(normalized) ? 1 : 0;
    const matchesDescription = description.includes(normalized) ? 0.5 : 0;
    const matchesKeywords = keywords.some((k) => k.includes(normalized)) ? 0.7 : 0;
    const dealScore = listing.totalDeals * 0.3;
    const recencyScore = Math.max(0, 1 - (Date.now() - listing.createdAt.getTime()) / (72 * 60 * 60 * 1000));
    const remainingScore = listing.remainingViews / listing.viewLimit;

    return {
      id: listing.id,
      title: listing.title,
      price: listing.price,
      totalDeals: listing.totalDeals,
      remainingViews: listing.remainingViews,
      score: matchesTitle + matchesDescription + matchesKeywords + dealScore + recencyScore + remainingScore,
    };
  });

  return results
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...rest }) => rest);
}
