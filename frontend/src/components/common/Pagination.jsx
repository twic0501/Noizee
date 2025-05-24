// src/components/common/Pagination.jsx
import React from 'react';
import { Pagination as BootstrapPagination } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'; // << IMPORT

const DOTS = '...';

const range = (start, end) => {
  let length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1 }) {
  const { t } = useTranslation(); // << SỬ DỤNG HOOK

  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (pageNumber) => {
    if (typeof pageNumber === 'number' && pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  const paginationRange = () => {
    const totalPageNumbers = siblingCount + 5; 

    if (totalPages <= totalPageNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

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
    return range(1, totalPages);
  };

  const pageNumbers = paginationRange();

  return (
    <div className="d-flex justify-content-center mt-4 pagination-container">
      <BootstrapPagination>
        <BootstrapPagination.Prev
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label={t('pagination.previousPage')} // Dịch aria-label
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
              aria-label={t('pagination.goToPage', { pageNumber: pageNumber })} // Dịch aria-label
              aria-current={pageNumber === currentPage ? "page" : undefined}
            >
              {pageNumber}
            </BootstrapPagination.Item>
          );
        })}
        <BootstrapPagination.Next
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label={t('pagination.nextPage')} // Dịch aria-label
        />
      </BootstrapPagination>
    </div>
  );
}
export default Pagination;