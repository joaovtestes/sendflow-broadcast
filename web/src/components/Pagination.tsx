import { useEffect, useState } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface PaginationProps {
  page?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  onPageChange?: (page: number) => void;
  showPages?: number;
  disabled?: boolean;
  className?: string;
}

export default function Pagination({
  page = 1,
  totalPages = 1,
  hasNextPage = false,
  onPageChange = () => {},
  showPages = 5,
  disabled = false,
  className = "",
}: PaginationProps) {
  const [inputPage, setInputPage] = useState(String(page));

  const showDots = totalPages > showPages;

  const dotAtRight = page - 1 <= totalPages - page;

  const minRight = showPages - 1;
  const maxLeft = totalPages - (showPages - 2);

  const initialPage = dotAtRight
    ? page > minRight
      ? page - (showPages - 2)
      : 1
    : page > maxLeft
      ? maxLeft
      : page;

  const intervalToShow = showDots
    ? [
        initialPage,
        initialPage + showPages - 2 > totalPages
          ? totalPages
          : initialPage + showPages - 2,
      ]
    : [1, totalPages];

  const [prevPage, setPrevPage] = useState(page);
  if (prevPage !== page) {
    setPrevPage(page);
    setInputPage(String(page));
  }

  // Navega para a página digitada após 600ms
  useEffect(() => {
    const timeout = setTimeout(() => {
      const pageNumber = Number(inputPage);

      if (
        inputPage !== "" &&
        pageNumber !== page &&
        pageNumber >= 1 &&
        pageNumber <= totalPages
      ) {
        onPageChange(pageNumber);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [inputPage, page, totalPages, onPageChange]);

  const pages = Array.from(
    {
      length: intervalToShow[1] - intervalToShow[0] + 1,
    },
    (_, index) => intervalToShow[0] + index,
  );

  return (
    <div className={`flex items-center justify-center py-4 ${className}`}>
      <ul className="flex items-center gap-0.5">
        {page !== 1 && (
          <li>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(page - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowBackIcon className="w-4" />
            </button>
          </li>
        )}

        {!dotAtRight && showDots && (
          <>
            <li>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                1
              </button>
            </li>

            <li>
              <span className="flex h-10 w-10 items-center justify-center text-gray-500">
                ...
              </span>
            </li>
          </>
        )}

        {pages.map((pageNumber) => (
          <li key={pageNumber}>
            {pageNumber === page ? (
              <input
                type="text"
                inputMode="numeric"
                value={inputPage}
                disabled={disabled}
                onChange={(event) => {
                  const value = event.target.value;

                  if (/^\d*$/.test(value)) {
                    setInputPage(value);
                  }
                }}
                className="h-10 w-12 rounded-lg border border-gray-300 text-center text-sm font-medium outline-none focus:border-blue-500 disabled:opacity-50"
              />
            ) : (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(pageNumber)}
                className="flex h-10 min-w-10 items-center justify-center rounded-lg p-1 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {pageNumber}
              </button>
            )}
          </li>
        ))}

        {dotAtRight && showDots && (
          <>
            <li>
              <span className="flex h-10 w-10 items-center justify-center text-gray-500">
                ...
              </span>
            </li>

            <li>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(totalPages)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {totalPages}
              </button>
            </li>
          </>
        )}

        {page !== totalPages && (
          <li>
            <button
              type="button"
              disabled={disabled || !hasNextPage}
              onClick={() => onPageChange(page + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowForwardIcon className="w-4" />
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
