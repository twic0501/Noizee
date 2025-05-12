// src/components/common/Pagination.jsx
import React from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';

const DOTS = '...';

const range = (start, end) => {
  let length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1, alwaysShowFirstAndLast = true }) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (pageNumber) => {
    if (typeof pageNumber === 'number' && pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  const paginationRange = () => {
    const totalPageNumbers = siblingCount + 5; // siblingCount on each side + firstPage + lastPage + currentPage + 2*DOTS

    /*
      Case 1:
      If the number of pages is less than the page numbers we want to show in our
      paginationComponent, we return the range [1..totalPages]
    */
    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    /*
      We do not want to show dots if there is only one position left
      after/before the left/right page count as that would lead to a change if our component
      economize on space by removing them.
    */
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, lastPageIndex];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
    // Default case, should not happen with logic above but as a fallback:
    return range(1, totalPages);
  };

  const pageNumbers = paginationRange();

  return (
    <div className="d-flex justify-content-center mt-4 pagination-container"> {/* CSS */}
      <BootstrapPagination>
        <BootstrapPagination.Prev
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
        />
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === DOTS) {
            return <BootstrapPagination.Ellipsis key={DOTS + index} disabled />;
          }
          return (
            <BootstrapPagination.Item
              key={pageNumber}
              active={pageNumber === currentPage}
              onClick={() => handlePageClick(pageNumber)}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={pageNumber === currentPage ? "page" : undefined}
            >
              {pageNumber}
            </BootstrapPagination.Item>
          );
        })}
        <BootstrapPagination.Next
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
        />
      </BootstrapPagination>
    </div>
  );
}
// Thêm CSS nếu cần cho .pagination-container
// ví dụ:
// .pagination-container .page-link { color: var(--color-dark); }
// .pagination-container .page-item.active .page-link { background-color: var(--color-dark); border-color: var(--color-dark); }
// .pagination-container .page-link:hover { color: var(--color-primary); }
export default Pagination;