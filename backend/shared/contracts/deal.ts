export interface PurchaseContactInput {
  postId: string;
  buyerId: string;
  sellerId: string;
  price: number;
}

export interface PurchaseContactResult {
  contactToken: string;
  confirmDeadline: Date;
  contact: string;
}

export interface ConfirmDealInput {
  contactViewId: string;
  buyerId: string;
  payload: string;
}

export interface DealServiceContract {
  purchaseContact(input: PurchaseContactInput): Promise<PurchaseContactResult>;
  confirmDeal(input: ConfirmDealInput): Promise<void>;
  remindPending(now?: Date): Promise<number>;
}
