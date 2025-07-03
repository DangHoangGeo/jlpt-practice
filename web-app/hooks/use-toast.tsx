type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

// Simple hook without context for now
export function useToast() {
  const toast = ({ title, description, variant = "default" }: ToastProps) => {
    // Simple browser alert for now - you can replace with a proper toast library
    const message = [title, description].filter(Boolean).join(": ")
    if (variant === "destructive") {
      alert(`Error: ${message}`)
    } else {
      alert(message)
    }
  }

  return { toast }
}

// Empty provider for compatibility
export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  return <>{children}</>
}
