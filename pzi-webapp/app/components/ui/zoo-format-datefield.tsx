"use client"

import { ChangeEvent, useState } from "react"
import {
  composeRenderProps,
  Input as AriaInput,
  TextField as AriaTextField,
  TextFieldProps as AriaTextFieldProps,
  ValidationResult as AriaValidationResult
} from "react-aria-components"

import { cn } from "@/lib/utils"
import { FieldError, fieldGroupVariants, Label } from "./field"

interface ZooFormatDateInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  variant?: "default" | "ghost"
  isDisabled?: boolean
  isReadOnly?: boolean
  isRequired?: boolean
  className?: string
}

function ZooFormatDateInput({
  value = "",
  onChange,
  placeholder = "YYYY/MM/DD",
  variant = "default",
  isDisabled,
  isReadOnly,
  isRequired,
  className,
  ...props
}: ZooFormatDateInputProps) {
  // Handles user input and formats it according to the yyyy/mm/dd pattern
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value

    // Remove any non-numeric and non-slash characters
    input = input.replace(/[^\d/]/g, '')

    // Format the input according to yyyy/mm/dd pattern
    let formattedInput = input

    // Handle slashes automatically
    if (input.length > 0) {
      // Remove any existing slashes
      const digitsOnly = input.replace(/\//g, '')

      // Re-add slashes in the correct positions
      if (digitsOnly.length > 4) {
        formattedInput = digitsOnly.slice(0, 4) + '/' + digitsOnly.slice(4)
      }

      if (digitsOnly.length > 6) {
        formattedInput = formattedInput.slice(0, 7) + '/' + digitsOnly.slice(6)
      }

      // Cap the length at 10 characters (yyyy/mm/dd)
      if (formattedInput.length > 10) {
        formattedInput = formattedInput.slice(0, 10)
      }
    }

    if (onChange) {
      onChange(formattedInput)
    }
  }

  // Custom validation for partial dates
  const validateDate = (value: string): boolean => {
    if (!value) return true // Empty is valid if not required

    // Valid patterns: yyyy, yyyy/mm, yyyy/mm/dd
    const regexPatterns = [
      /^\d{4}$/, // yyyy
      /^\d{4}\/\d{1,2}$/, // yyyy/m or yyyy/mm
      /^\d{4}\/\d{1,2}\/\d{1,2}$/, // yyyy/mm/dd or yyyy/m/d variations
    ]

    return regexPatterns.some(regex => regex.test(value))
  }

  const isValid = validateDate(value)

  return (
    <AriaInput
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={isDisabled}
      readOnly={isReadOnly}
      required={isRequired}
      className={composeRenderProps(className, (className) =>
        cn(
          "flex h-8 w-full rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
          /* Disabled */
          "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
          /* Focused */
          "data-[focused]:outline-none data-[focused]:ring-2 data-[focused]:ring-ring data-[focused]:ring-offset-2",
          /* Resets */
          "focus-visible:outline-none",
          className
        )
      )}
      {...props}
    />
  )
}

interface ZooFormatDateFieldProps extends Omit<AriaTextFieldProps, "children"> {
  label?: string
  description?: string
  errorMessage?: string | ((validation: AriaValidationResult) => string)
  defaultValue?: string
  name?: string,
  placeholder?: string
}

function ZooFormatDateField({
  label,
  description,
  errorMessage,
  className,
  defaultValue = "",
  name,
  placeholder = "YYYY/MM/DD",
  ...props
}: ZooFormatDateFieldProps) {
  const [value, setValue] = useState(defaultValue)

  return (
    <AriaTextField
      name={name}
      className={composeRenderProps(className, (className) =>
        cn("", className)
      )}
      {...props}
    >
      {label && <Label>{label}</Label>}
      <ZooFormatDateInput
        value={value}
        onChange={setValue}
        placeholder={placeholder}
      />
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <FieldError>{errorMessage}</FieldError>
      <input type="hidden" name={name} value={value} />
    </AriaTextField>
  )
}

export { ZooFormatDateField, ZooFormatDateInput }
export type { ZooFormatDateFieldProps, ZooFormatDateInputProps }
