"use client"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/** 通用下拉菜单（基于 @base-ui/react/menu），Portal + 定位 + 键盘导航由原语提供。 */

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({ className, ...props }: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" className={cn("outline-none", className)} {...props} />
  )
}

function DropdownMenuContent({
  className,
  side = "bottom",
  align = "end",
  sideOffset = 6,
  alignOffset = 0,
  children,
  ...props
}: MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 max-h-(--available-height) min-w-[10rem] origin-(--transform-origin) overflow-y-auto overflow-x-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

function DropdownMenuRadioItem({ className, children, ...props }: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-md py-1.5 pl-2 pr-8 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[checked]:font-medium data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuRadioItemIndicator({ className, ...props }: MenuPrimitive.RadioItemIndicator.Props) {
  return (
    <MenuPrimitive.RadioItemIndicator
      data-slot="dropdown-menu-radio-item-indicator"
      className={cn(
        "pointer-events-none absolute right-2 top-1/2 inline-flex size-4 -translate-y-1/2 items-center justify-center",
        className
      )}
      {...props}
    >
      <Check className="size-4" />
    </MenuPrimitive.RadioItemIndicator>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRadioItemIndicator
}
