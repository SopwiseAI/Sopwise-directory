import "@testing-library/jest-dom/vitest"

// 补桩判断一律用 `typeof !== "function"`：jsdom 会挂上同名属性但值是 undefined，
// 用 `"x" in globalThis` 判会「属性存在」而漏掉补桩，运行时才炸 `is not a function`。

// jsdom 未实现 IntersectionObserver，测试中补一个空实现
if (typeof globalThis.IntersectionObserver !== "function") {
  class IntersectionObserverStub {
    root = null
    rootMargin = ""
    thresholds: number[] = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver
}

// jsdom 未实现 ResizeObserver，测试中补一个空实现
if (typeof globalThis.ResizeObserver !== "function") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

// jsdom 未实现 Element.scrollIntoView（二级栏用它把当前项滚入可视区），补一个空实现
if (typeof Element !== "undefined" && typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = () => {}
}

// jsdom 未实现 matchMedia，测试中补一个始终不匹配的实现
if (typeof globalThis.matchMedia !== "function") {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false
    }
  })) as unknown as typeof window.matchMedia
}
