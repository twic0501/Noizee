import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronLeft, FiChevronRight, FiMoreHorizontal } from 'react-icons/fi';
import { classNames } from '../../utils/helpers'; // Đảm bảo bạn đã tạo file này

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  siblings = 1, // Number of page links to show on each side of the current page
  className = '',
}) => {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1 || totalItems === 0) {
    return null; // Don't render pagination if not needed
  }

  const DOTS = '...';

  const range = (start, end) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  // Core pagination logic to determine page numbers to display
  const paginationRange = () => {
    const totalPageNumbersDisplayed = siblings * 2 + 3 + 2; // siblings + firstPage + lastPage + currentPage + 2*DOTS

    if (totalPageNumbersDisplayed >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblings, 1);
    const rightSiblingIndex = Math.min(currentPage + siblings, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2; // Adjusted for lastPage

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblings;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, lastPageIndex];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblings;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
    return []; // Should ideally not be reached if logic is correct
  };

  const pageNumbers = paginationRange();

  const handlePageClick = (pageNumberOrDots) => {
    if (typeof pageNumberOrDots === 'number') {
      onPageChange(pageNumberOrDots);
    }
    // Do nothing if DOTS is clicked
  };

  const baseButtonClasses = "min-w-[38px] h-9 px-3 py-1.5 inline-flex items-center justify-center text-sm font-medium border transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1";
  const defaultButtonClasses = "bg-white border-gray-300 text-gray-500 hover:bg-gray-100";
  const activeButtonClasses = "bg-indigo-50 border-indigo-500 text-indigo-600 z-10";
  const disabledButtonClasses = "opacity-50 cursor-not-allowed hover:bg-white";
  const dotsClasses = "min-w-[38px] h-9 px-3 py-1.5 inline-flex items-center justify-center text-sm font-medium border border-gray-300 text-gray-500 bg-white cursor-default";


  return (
    <nav className={classNames("flex items-center justify-between sm:px-0 print:hidden", className)} aria-label={t('pagination.ariaLabel', "Pagination")}>
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          {t('pagination.showing', 'Showing')}
          <span className="font-medium mx-1">{(currentPage - 1) * itemsPerPage + 1}</span>
          {t('pagination.to', 'to')}
          <span className="font-medium mx-1">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
          {t('pagination.of', 'of')}
          <span className="font-medium mx-1">{totalItems}</span>
          {t('pagination.results', 'results')}
        </p>
      </div>
      <div className="flex-1 flex justify-between sm:justify-end">
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={classNames(
            baseButtonClasses,
            "rounded-l-md",
            defaultButtonClasses,
            currentPage === 1 && disabledButtonClasses
          )}
          aria-label={t('pagination.previous', "Previous page")}
        >
          <FiChevronLeft className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline ml-1">{t('pagination.prevWord', "Previous")}</span>
        </button>

        <div className="hidden sm:flex -space-x-px">
          {pageNumbers.map((page, index) =>
            page === DOTS ? (
              <span
                key={`${page}-${index}`} // Unique key for DOTS
                className={dotsClasses}
              >
                <FiMoreHorizontal className="h-5 w-5" aria-hidden="true" />
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={classNames(
                  baseButtonClasses,
                  page === currentPage ? activeButtonClasses : defaultButtonClasses
                )}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={classNames(
            baseButtonClasses,
            "rounded-r-md",
            defaultButtonClasses,
            currentPage === totalPages && disabledButtonClasses
          )}
          aria-label={t('pagination.next', "Next page")}
        >
          <span className="hidden sm:inline mr-1">{t('pagination.nextWord', "Next")}</span>
          <FiChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;