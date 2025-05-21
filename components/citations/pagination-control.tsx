'use client';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type Props = {
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  setCurrentPage: (page: number) => void;
};

export function PaginationControls({
  currentPage,
  hasNext,
  hasPrev,
  setCurrentPage,
}: Props) {
  // Dynamically estimate totalPages based on currentPage and hasNext
  const totalPages = hasNext ? currentPage + 1 : currentPage;

  if (totalPages <= 1) return null;

  const maxVisiblePages = 3;
  const pageNumbers = [];

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            className={
              hasPrev ? 'cursor-pointer' : 'pointer-events-none opacity-50'
            }
          />
        </PaginationItem>

        {startPage > 1 && (
          <>
            <PaginationItem>
              <PaginationLink onClick={() => setCurrentPage(1)}>
                1
              </PaginationLink>
            </PaginationItem>
            {startPage > 2 && (
              <PaginationItem>
                <span className="flex size-10 items-center justify-center">
                  ...
                </span>
              </PaginationItem>
            )}
          </>
        )}

        {pageNumbers.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={() => setCurrentPage(page)}
              isActive={currentPage === page}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <PaginationItem>
                <span className="flex size-10 items-center justify-center">
                  ...
                </span>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            onClick={() =>
              currentPage < totalPages && setCurrentPage(currentPage + 1)
            }
            className={
              hasNext ? 'cursor-pointer' : 'pointer-events-none opacity-50'
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
