export const getPaginationData = (
  page: number,
  limit: number,
  totalItems: number
) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  
  return {
    skip: (safePage - 1) * limit,
    limit,
    pagination: {
      page: safePage,
      limit,
      total: totalItems,
      pages: totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    }
  };
};
