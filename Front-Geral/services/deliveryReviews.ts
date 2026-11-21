import { getItem, setItem } from './storage';

export type DeliveryDecision = 'approved' | 'rejected';

export type DeliveryReview = {
  id: string;
  stageId: number;
  projectId: number;
  projectName: string;
  stageName: string;
  freelancerName: string | null;
  decision: DeliveryDecision;
  comment: string | null;
  decidedAt: string;
  decidedBy: string | null;
};

const STORAGE_KEY = 'gestor.deliveryReviews';

function readReviews(): DeliveryReview[] {
  const raw = getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as DeliveryReview[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReviews(reviews: DeliveryReview[]) {
  setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function listDeliveryReviews(): DeliveryReview[] {
  return readReviews().sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
}

export function saveDeliveryReview(
  review: Omit<DeliveryReview, 'id' | 'decidedAt'> & { decidedAt?: string },
): DeliveryReview {
  const entry: DeliveryReview = {
    ...review,
    id: `${review.stageId}-${Date.now()}`,
    decidedAt: review.decidedAt ?? new Date().toISOString(),
  };
  const reviews = readReviews();
  reviews.unshift(entry);
  writeReviews(reviews);
  return entry;
}
