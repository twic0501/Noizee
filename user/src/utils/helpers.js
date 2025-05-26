/**
 * Checks if a value is empty (null, undefined, empty string, empty array, or empty object).
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is empty, false otherwise.
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && value.constructor === Object && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Utility to conditionally join CSS class names.
 * @param  {...(string | null | undefined | {[className: string]: boolean})} args - Class names or objects.
 * @returns {string} A string of space-separated class names.
 */
export const classNames = (...args) => {
  const classes = [];
  for (const arg of args) {
    if (typeof arg === 'string' && arg) {
      classes.push(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      for (const key in arg) {
        if (Object.prototype.hasOwnProperty.call(arg, key) && arg[key]) {
          classes.push(key);
        }
      }
    }
  }
  return classes.join(' ');
};


/**
 * Smoothly scrolls to an element with the given ID or to the top of the page.
 * @param {string} [elementId] - The ID of the element to scroll to. If undefined, scrolls to top.
 */
export const smoothScrollTo = (elementId) => {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      });
    } else {
      console.warn(`Element with ID "${elementId}" not found for smooth scroll.`);
    }
  } else {
    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
};

/**
 * Delays execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Simple slugify function. For more robust slugification, consider a library.
 * @param {string} text
 * @returns {string}
 */
export const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
};

// Thêm các hàm helper khác nếu cần