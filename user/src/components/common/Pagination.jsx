// src/components/common/Pagination.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
// Không cần FiChevronLeft, FiChevronRight, FiMoreHorizontal nữa vì Bootstrap Pagination có thể xử lý hoặc dùng text
import { classNames } from '../../utils/helpers'; // Vẫn có thể hữu ích cho className prop

const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  siblings = 1,
  className = '',
}) => {
  const { t } = useTranslation();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1 || totalItems === 0) {
    return null;
  }

  const DOTS = '...';

  const range = (start, end) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  const paginationRange = () => {
    const totalPageNumbersDisplayed = siblings * 2 + 3 + 2;

    if (totalPageNumbersDisplayed >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblings, 1);
    const rightSiblingIndex = Math.min(currentPage + siblings, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblings; // firstPage + currentPage + rightSiblings + 1*DOTS + lastPage
      if (leftItemCount >= totalPages -1) return range(1, totalPages); // Nếu quá gần, hiển thị hết
      const leftRange = range(1, leftItemCount);
      return [...leftRange, DOTS, lastPageIndex];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightItemCount = 3 + 2 * siblings; // lastPage + currentPage + leftSiblings + 1*DOTS + firstPage
        if (rightItemCount >= totalPages -1) return range(1, totalPages);
        const rightRange = range(totalPages - rightItemCount + 1, totalPages);
        return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      // Kiểm tra nếu DOTS và middleRange quá gần first/last page
      let finalRange = [firstPageIndex];
      if (leftSiblingIndex > 2) finalRange.push(DOTS); else if (leftSiblingIndex === 2) finalRange.push(2);

      finalRange = finalRange.concat(middleRange);

      if (rightSiblingIndex < totalPages - 1) finalRange.push(DOTS); else if (rightSiblingIndex === totalPages -1 ) finalRange.push(totalPages-1);

      if (!finalRange.includes(lastPageIndex)) finalRange.push(lastPageIndex);

      // Loại bỏ các số trùng lặp do logic gộp, ví dụ nếu firstPage/lastPage có trong middleRange
      return [...new Set(finalRange)];
    }
    return range(1, totalPages); // Fallback, nên được xử lý bởi các điều kiện trên
  };

  const pageNumbers = paginationRange();

  const handlePageClick = (pageNumberOrDots) => {
    if (typeof pageNumberOrDots === 'number') {
      onPageChange(pageNumberOrDots);
    }
  };

  // Font chữ sẽ được kế thừa từ body hoặc các class text của Bootstrap
  return (
    <nav className={classNames("d-flex flex-column flex-sm-row align-items-center justify-content-between print-hidden", className)} aria-label={t('pagination.ariaLabel', "Pagination")}>
      <div className="mb-3 mb-sm-0"> {/* Thêm margin bottom cho mobile */}
        <p className="small text-muted mb-0"> {/* small và text-muted của Bootstrap */}
          {t('pagination.showing', 'Showing')}
          <span className="fw-semibold mx-1">{(currentPage - 1) * itemsPerPage + 1}</span>
          {t('pagination.to', 'to')}
          <span className="fw-semibold mx-1">{Math.min(currentPage * itemsPerPage, totalItems)}</span>
          {t('pagination.of', 'of')}
          <span className="fw-semibold mx-1">{totalItems}</span>
          {t('pagination.results', 'results')}
        </p>
      </div>
      {/* Sử dụng ul.pagination của Bootstrap */}
      <ul className="pagination mb-0"> {/* mb-0 để loại bỏ margin bottom mặc định */}
        <li className={classNames("page-item", { 'disabled': currentPage === 1 })}>
          <button
            className="page-link"
            onClick={() => handlePageClick(currentPage - 1)}
            aria-label={t('pagination.previous', "Previous page")}
            disabled={currentPage === 1} // Thêm disabled prop cho button
          >
            {t('pagination.prevWord', "Previous")}
          </button>
        </li>

        {pageNumbers.map((page, index) =>
          page === DOTS ? (
            <li key={`<span class="math-inline">\{page\}\-</span>{index}`} className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          ) : (
            <li key={page} className={classNames("page-item", { 'active': page === currentPage })}>
              <button
                className="page-link"
                onClick={() => handlePageClick(page)}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            </li>
          )
        )}

        <li className={classNames("page-item", { 'disabled': currentPage === totalPages })}>
          <button
            className="page-link"
            onClick={() => handlePageClick(currentPage + 1)}
            aria-label={t('pagination.next', "Next page")}
            disabled={currentPage === totalPages} // Thêm disabled prop cho button
          >
            {t('pagination.nextWord', "Next")}
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;