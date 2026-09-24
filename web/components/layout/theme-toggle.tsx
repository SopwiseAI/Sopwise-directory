"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ThemeMode = "light" | "dark" | "system";

function mediaDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const t = localStorage.getItem("theme");
  return t === "light" || t === "dark" || t === "system" ? t : "system";
}

function applyMetaThemeColor(dark: boolean) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0f1114" : "#fafafb");
}

function applyTheme(theme: ThemeMode) {
  const dark = theme === "dark" || (theme === "system" && mediaDark());
  document.documentElement.classList.toggle("dark", dark);
  applyMetaThemeColor(dark);
  localStorage.setItem("theme", theme);
}

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (e: StorageEvent) => {
    if (e.key === "theme") callback();
  };
  const mediaHandler = () => {
    // system 模式下跟随系统切换时同步浏览器主题色
    const t = localStorage.getItem("theme");
    if (t === "system") applyMetaThemeColor(media.matches);
    callback();
  };
  media.addEventListener("change", mediaHandler);
  window.addEventListener("storage", handler);
  return () => {
    media.removeEventListener("change", mediaHandler);
    window.removeEventListener("storage", handler);
  };
}

export function useTheme(): ThemeMode {
  return useSyncExternalStore(subscribe, getTheme, () => "system" as ThemeMode);
}

export function setTheme(theme: ThemeMode) {
  applyTheme(theme);
  window.dispatchEvent(new StorageEvent("storage", { key: "theme" }));
}

/** 单按钮循环切换（亮 ↔ 暗），折叠态使用 */
export default function ThemeToggle() {
  const theme = useTheme();
  const darkApplied = theme === "dark" || (theme === "system" && mediaDark());

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(darkApplied ? "light" : "dark")}
      aria-label={darkApplied ? "切换亮色模式" : "切换暗色模式"}
      title={darkApplied ? "切换亮色模式" : "切换暗色模式"}
    >
      {darkApplied ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}