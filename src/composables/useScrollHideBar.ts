import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue';

const SCROLL_THRESHOLD = 10;
const TOP_ALWAYS_SHOW = 16;

export function useScrollHideBar(enabled: Ref<boolean>) {
  const visible = ref(true);
  let lastY = 0;
  let ticking = false;

  function getScrollTop(): number {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  function updateVisibility(y: number) {
    if (!enabled.value) {
      visible.value = true;
      return;
    }
    if (y <= TOP_ALWAYS_SHOW) {
      visible.value = true;
    } else if (y > lastY + SCROLL_THRESHOLD) {
      visible.value = false;
    } else if (y < lastY - SCROLL_THRESHOLD) {
      visible.value = true;
    }
    lastY = y;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateVisibility(getScrollTop());
      ticking = false;
    });
  }

  function onScrollCapture(event: Event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target === document.documentElement || target === document.body) return;
    if (!target.classList.contains('q-page') && !target.classList.contains('q-scrollarea__container')) {
      return;
    }
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateVisibility(target.scrollTop);
      ticking = false;
    });
  }

  function reset() {
    visible.value = true;
    lastY = getScrollTop();
  }

  watch(enabled, (on) => {
    if (!on) reset();
  });

  onMounted(() => {
    lastY = getScrollTop();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScrollCapture, { passive: true, capture: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('scroll', onScrollCapture, true);
  });

  return { visible, reset };
}
