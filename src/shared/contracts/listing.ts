export type ListingType = 'buy' | 'sell' | 'trade' | 'other';

export interface ListingPayload {
  title: string;
  price: number;
  tradeType: ListingType;
  description: string;
  keywords: string[];
  expiresAt: Date;
  remainingViews: number;
  status: 'active' | 'expired';
  viewLimit: number;
  totalDeals: number;
  userId: string;
  id: string;
  aiSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateListingInput {
  userId: string;
  title: string;
  description: string;
  price: number;
  tradeType: ListingType;
  keywords?: string[];
  aiAssist?: boolean;
}

export interface ListingServiceContract {
  publish(input: CreateListingInput): Promise<ListingPayload>;
  republish(id: string, userId: string): Promise<ListingPayload>;
  expireOverdue(now?: Date): Promise<number>;
}
