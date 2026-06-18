import { register } from 'register-service-worker';

// ready(), registered(), cached(), updatefound(), updated() — tham số: ServiceWorkerRegistration
// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // registrationOptions: { scope: './' },

  ready() {
    // Service worker sẵn sàng
  },

  registered() {
    // Đã đăng ký service worker
  },

  cached() {
    // Nội dung đã cache (offline)
  },

  updatefound() {
    // Có bản cập nhật mới đang tải
  },

  updated() {
    // Có bản mới: có thể gọi $q.notify nơi boot nếu cần
  },

  offline() {
    // Mất mạng — app dùng cache nếu có
  },

  error() {
    // Lỗi đăng ký service worker
  },
});
