import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

export type BreadcrumbItem = { label: string; to?: string };

export function useAppBreadcrumbs() {
  const route = useRoute();
  const { t } = useI18n();

  const items = computed((): BreadcrumbItem[] => {
    const meta = route.meta as {
      breadcrumbParent?: string;
      breadcrumbTitle?: string;
    };
    const out: BreadcrumbItem[] = [
      { label: t('app.product_name_short'), to: '/' },
    ];
    if (meta.breadcrumbParent) {
      out.push({ label: t(meta.breadcrumbParent) });
    }
    if (meta.breadcrumbTitle) {
      out.push({ label: t(meta.breadcrumbTitle) });
    } else if (route.path === '/' || route.path === '') {
      out.push({ label: t('app.nav_dashboard') });
    }
    return out;
  });

  return { items };
}
