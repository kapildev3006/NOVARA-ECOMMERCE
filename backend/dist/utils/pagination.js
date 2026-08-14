"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationData = void 0;
const getPaginationData = (page, limit, totalItems) => {
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
exports.getPaginationData = getPaginationData;
