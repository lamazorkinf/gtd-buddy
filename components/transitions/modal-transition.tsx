"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { modernTheme } from "@/lib/theme"

interface ModalTransitionProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  headerAction?: React.ReactNode
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween" as const,
      ease: "easeOut" as const,
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      type: "tween" as const,
      ease: "easeIn" as const,
      duration: 0.15,
    },
  },
}

export default function ModalTransition({ isOpen, onClose, children, title, headerAction }: ModalTransitionProps) {
  const [mounted, setMounted] = useState(false)
  const portalRootRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
    // Intentar obtener o crear un elemento portal en el body
    let portalRoot = document.getElementById("modal-portal-root")
    if (!portalRoot) {
      portalRoot = document.createElement("div")
      portalRoot.setAttribute("id", "modal-portal-root")
      document.body.appendChild(portalRoot)
    }
    portalRootRef.current = portalRoot

    return () => {
      // Limpiar el portal si este componente lo creó y ya no hay modales
      // Esto es opcional y depende de si quieres un único portal para toda la app
      // o uno por instancia de modal (lo cual es menos eficiente)
      // if (portalRootRef.current && portalRootRef.current.childElementCount === 0) {
      //   portalRootRef.current.remove();
      // }
    }
  }, [])

  useEffect(() => {
    const body = document.body
    if (isOpen) {
      body.style.overflow = "hidden"
    } else {
      body.style.overflow = ""
    }
    // Asegurarse de limpiar el overflow si el componente se desmonta mientras está abierto
    return () => {
      body.style.overflow = ""
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4" // z-index alto
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          transition={{ duration: 0.2 }}
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content Wrapper */}
          <motion.div
            className="relative w-full max-w-2xl z-10 backdrop-blur-xl bg-white/40 border border-white/50 rounded-2xl shadow-2xl shadow-purple-200/50 modal-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>

            {/* Title */}
            {title && (
              <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                <h2 className={`text-lg font-semibold leading-none tracking-tight ${modernTheme.colors.primaryText}`}>
                  {title}
                </h2>
                {headerAction && <div className="ml-4">{headerAction}</div>}
              </div>
            )}

            {/* Contenido scrolleable del modal - removido overflow hidden para permitir que los popovers se muestren */}
            <div className="max-h-[85vh] overflow-y-auto overflow-x-visible">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (!mounted || !portalRootRef.current) {
    return null // No renderizar nada en el servidor o antes de que el portal esté listo
  }

  return createPortal(modalContent, portalRootRef.current)
}
