import { Fragment } from "react"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator } from "@/components/ui/item"

const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ["/"], description: "聚焦顶部搜索框" },
  { keys: ["Enter"], description: "在搜索框中执行搜索" },
  { keys: ["Esc"], description: "清空搜索内容 / 关闭搜索框" }
]

/** 全站键盘快捷键速查：Item 行 + 发丝分隔，不套卡片。 */
export function Shortcuts() {
  return (
    <ItemGroup className="gap-0">
      {SHORTCUTS.map((shortcut, index) => (
        <Fragment key={shortcut.description}>
          {index > 0 && <ItemSeparator />}
          <Item className="px-0 py-2">
            <ItemContent>
              <ItemDescription>{shortcut.description}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <KbdGroup>
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </KbdGroup>
            </ItemActions>
          </Item>
        </Fragment>
      ))}
    </ItemGroup>
  )
}
