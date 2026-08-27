"use client";

import { useState } from "react";

export function usePagination(total: number, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    page: safePage,
    pageSize,
    totalPages,
    start,
    end,
    goToPage: (p: number) => setPage(Math.max(1, Math.min(totalPages, p))),
  };
}