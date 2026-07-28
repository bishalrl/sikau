type EbookPriceFields = {
  priceNpr: number;
  listPriceNpr?: number | null;
  promoEndsAt?: Date | string | null;
  isFree?: boolean;
};

export function isEbookPromoActive(promoEndsAt?: Date | string | null) {
  if (!promoEndsAt) return false;
  const end = promoEndsAt instanceof Date ? promoEndsAt : new Date(promoEndsAt);
  return !Number.isNaN(end.getTime()) && end.getTime() > Date.now();
}

/** Sale price charged at checkout; list price shown struck-through while promo is active. */
export function getEbookDisplayPricing(ebook: EbookPriceFields) {
  if (ebook.isFree || ebook.priceNpr <= 0) {
    return { price: 0, listPrice: null as number | null, promoActive: false };
  }

  const promoActive = isEbookPromoActive(ebook.promoEndsAt);
  const list = ebook.listPriceNpr ?? null;
  const showList =
    promoActive && list != null && list > ebook.priceNpr ? list : null;

  return {
    price: ebook.priceNpr,
    listPrice: showList,
    promoActive: promoActive && showList != null,
  };
}

export function formatPromoEndsLabel(promoEndsAt: Date | string) {
  const end = promoEndsAt instanceof Date ? promoEndsAt : new Date(promoEndsAt);
  return end.toLocaleString("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
