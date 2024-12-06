"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-2 w-full"> 
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm text-muted-foreground">
                  {description}
                </ToastDescription>
              )}
              <div className="flex items-center justify-between w-full"> 
                {action}
                <ToastClose />
              </div>
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}