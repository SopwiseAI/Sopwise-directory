import "@testing-library/jest-dom/vitest"

// jsdom 未实现 IntersectionObserver，测试中补一个空实现
if (!("IntersectionObserver" in globalThis)) {
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
