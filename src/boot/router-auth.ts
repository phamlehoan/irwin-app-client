import { defineBoot } from '#q-app/wrappers';
import { useAuthStore } from 'stores/auth';

export default defineBoot(({ router }) => {
  const auth = useAuthStore();

  router.beforeEach(async (to) => {
    if (!auth.bootstrapped) {
      await auth.restoreSession();
    }

    const publicRoute = to.meta.public === true;
    const isLoginRoute = to.path === '/login';

    if (isLoginRoute && auth.isAuthenticated) {
      const r = to.query.redirect;
      const parsed = typeof r === 'string' ? r.trim() : '';
      const target =
        parsed.startsWith('/') &&
        !parsed.startsWith('//') &&
        parsed !== '/login' &&
        !parsed.startsWith('/login?')
          ? parsed
          : '/';
      return target;
    }

    if (publicRoute) {
      return true;
    }

    if (!auth.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }

    const need = to.meta.permission as string | undefined;
    if (need && !auth.hasPermission(need)) {
      return { path: '/' };
    }

    if (to.meta.adminWorkspace === true && !auth.canAdmin) {
      return { path: '/' };
    }

    return true;
  });
});
