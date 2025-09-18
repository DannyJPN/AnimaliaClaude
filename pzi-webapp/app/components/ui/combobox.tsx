"use client"

import { ChevronsUpDown, LoaderCircle } from "lucide-react"
import {
  ComboBox as AriaComboBox,
  ComboBoxProps as AriaComboBoxProps,
  Input as AriaInput,
  InputProps as AriaInputProps,
  ListBox as AriaListBox,
  ListBoxProps as AriaListBoxProps,
  PopoverProps as AriaPopoverProps,
  ValidationResult as AriaValidationResult,
  composeRenderProps,
  Text,
} from "react-aria-components"

import { cn } from "@/lib/utils"

import { Button } from "./button"
import { FieldError, FieldGroup, Label } from "./field"
import {
  ListBoxCollection,
  ListBoxHeader,
  ListBoxItem,
  ListBoxSection,
} from "./list-box"
import { Popover } from "./popover"

const Combobox = AriaComboBox

const ComboboxItem = ListBoxItem

const ComboboxHeader = ListBoxHeader

const ComboboxSection = ListBoxSection

const ComboboxCollection = ListBoxCollection

const ComboboxInput = ({ className, ...props }: AriaInputProps) => (
  <AriaInput
    className={composeRenderProps(className, (className) =>
      cn(
        "flex h-8 w-full bg-background px-2 py-2 outline-none text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
        /* Disabled */
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )
    )}
    {...props}
  />
)

const ComboboxPopover = ({ className, ...props }: AriaPopoverProps) => (
  <Popover
    className={composeRenderProps(className, (className) =>
      cn("w-[calc(var(--trigger-width)+4px)]", className)
    )}
    {...props}
  />
)

const ComboboxListBox = <T extends object>({
  className,
  ...props
}: AriaListBoxProps<T>) => (
  <AriaListBox
    className={composeRenderProps(className, (className) =>
      cn(
        "max-h-[inherit] overflow-auto p-1 outline-none [clip-path:inset(0_0_0_0_round_calc(var(--radius)-2px))]",
        className
      )
    )}
    {...props}
  />
)

interface JollyComboBoxProps<T extends object>
  extends Omit<AriaComboBoxProps<T>, "children"> {
  label?: string
  description?: string | null
  errorMessage?: string | ((validation: AriaValidationResult) => string)
  children: React.ReactNode | ((item: T) => React.ReactNode),
  isLoading: boolean,
  isDisabled?: boolean,
  placeholder?: string
}

// NOTE: Code was modified to add 'loading' support for asunc controls
function JollyComboBox<T extends object>({
  label,
  description,
  errorMessage,
  className,
  children,
  isLoading,
  isDisabled = false,
  placeholder,
  ...props
}: JollyComboBoxProps<T>) {
  return (
    <Combobox
      className={composeRenderProps(className, (className) =>
        cn("", className)
      )}
      {...props}
      isDisabled={isDisabled}
    >
      <Label>{label}</Label>
      <FieldGroup className="p-0">
        <ComboboxInput placeholder={placeholder} />
        <Button variant="ghost" size="icon" className="mr-1 size-5 p-1">
          {!isLoading && (<ChevronsUpDown aria-hidden="true" className="size-4 opacity-50" />)}
          {isLoading && (<LoaderCircle aria-hidden="true" className="size-4 opacity-50" />)}
        </Button>
      </FieldGroup>
      {description && (
        <Text className="text-sm text-muted-foreground" slot="description">
          {description}
        </Text>
      )}
      <FieldError>{errorMessage}</FieldError>
      <ComboboxPopover>
        <ComboboxListBox>{children}</ComboboxListBox>
      </ComboboxPopover>
    </Combobox>
  )
}

export {
  ComboboxSection,
  Combobox,
  ComboboxListBox,
  ComboboxInput,
  ComboboxCollection,
  ComboboxItem,
  ComboboxHeader,
  ComboboxPopover,
  JollyComboBox,
}
export type { JollyComboBoxProps }
