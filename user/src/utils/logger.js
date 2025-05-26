const IS_DEV = import.meta.env.DEV; // Vite provides this boolean

const logger = {
  debug: (...args) => {
    if (IS_DEV) {
      console.debug('%c[DEBUG]', 'color: gray; font-weight: bold;', ...args);
    }
  },
  info: (...args) => {
    if (IS_DEV) {
      console.info('%c[INFO]', 'color: blue; font-weight: bold;', ...args);
    }
  },
  warn: (...args) => {
    if (IS_DEV) {
      console.warn('%c[WARN]', 'color: orange; font-weight: bold;', ...args);
    }
  },
  error: (...args) => {
    // Log lỗi ra console ở cả dev và prod để dễ debug hơn từ console của người dùng
    console.error('%c[ERROR]', 'color: red; font-weight: bold;', ...args);
    // if (!IS_DEV) {
    //   // TODO: Gửi lỗi tới dịch vụ theo dõi lỗi (Sentry, LogRocket, etc.) trong môi trường production
    //   // ví dụ: Sentry.captureException(args[0] instanceof Error ? args[0] : new Error(String(args[0])), { extra: args.slice(1) });
    // }
  },
  log: (...args) => { // console.log thông thường
    if (IS_DEV) {
      console.log(...args);
    }
  },
};

export default logger;