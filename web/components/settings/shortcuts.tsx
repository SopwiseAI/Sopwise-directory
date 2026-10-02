const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ["/"], description: "聚焦顶部搜索框" },
  { keys: ["Enter"], description: "在搜索框中执行搜索" },
  { keys: ["Esc"], description: "清空搜索内容 / 关闭搜索框" }
]

/** 全站键盘快捷键速查。 */
export function Shortcuts() {
  return (
    <dl className="divide-y divide-border rounded-lg border bg-card">
      {SHORTCUTS.map((shortcut) => (
        <div key={shortcut.description} className="flex items-center justify-between gap-4 px-4 py-2.5">
          <dt className="text-xs text-muted-foreground">{shortcut.description}</dt>
          <dd className="flex shrink-0 items-center gap-1">
            {shortcut.keys.map((key) => (
              <kbd key={key} className="kbd">
                {key}
              </kbd>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  )
}
