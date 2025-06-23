"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"

interface ModalTransitionProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 200,
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
}

export default function ModalTransition({ isOpen, onClose, children }: ModalTransitionProps) {
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" // Más oscuro para mejor contraste
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content Wrapper */}
          <motion.div
            className="relative w-full max-w-2xl z-10 bg-white rounded-xl shadow-2xl modal-content"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Contenido scrolleable del modal */}
            <div className="max-h-[85vh] overflow-y-auto">{children}</div>
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
