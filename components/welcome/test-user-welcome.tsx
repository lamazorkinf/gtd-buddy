"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

interface TestUserWelcomeProps {
  isOpen: boolean
  onClose: (dontShowAgain?: boolean) => void
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 200,
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

export default function TestUserWelcome({ isOpen, onClose }: TestUserWelcomeProps) {
  const { user } = useAuth()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose(true) // Siempre cambia showMessage a false al cerrar con Escape
      }
    }
    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-12" // Ajustado aquí para padding vertical
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop con gradiente GTD */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-gtd-clarity-900/95 via-gtd-action-900/95 to-gtd-focus-900/95 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Content */}
            <motion.div
              className="relative w-full max-w-2xl z-[10000]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="bg-white/95 backdrop-blur-sm border-2 border-gtd-clarity-200 shadow-2xl">
                {/* Header con botón de cerrar */}
                <div className="flex justify-end p-4 pb-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onClose(true)}
                    className="text-gtd-neutral-500 hover:text-gtd-neutral-700 hover:bg-gtd-neutral-100 rounded-full h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <CardContent className="px-8 pb-8 pt-2">
                  {/* Título */}
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-gtd-clarity-600 via-gtd-action-500 to-gtd-focus-500 bg-clip-text text-transparent mb-2">
                      ¡Hola {user?.firstName || "amigo/a"}! Gracias por estar acá! 🙌
                    </h1>
                  </div>

                  {/* Contenido del mensaje */}
                  <div className="space-y-4 text-gtd-neutral-700 leading-relaxed">
                    <p>
                      Quiero darte las gracias de corazón por estar probando esta app. Si hoy la estás viendo es porque
                      confío plenamente en vos: sé que sos de esas personas que siempre me bancaron y apoyaron en este
                      camino.
                    </p>

                    <p>
                      Esta etapa es clave para el proyecto y tu mirada, tus comentarios y tu tiempo valen oro para mí.
                      Más allá de los errores o cosas a mejorar que encuentres, lo que más valoro es tu honestidad y el
                      hecho de que te tomes unos minutos para ayudarme a crecer.
                    </p>

                    <p>
                      Sin gente como vos, que me acompaña y me motiva, esto no tendría sentido. Así que te agradezco
                      infinitamente que seas parte de esto desde el principio.
                    </p>

                    <p>
                      ¡Espero que disfrutes la experiencia y te sientas parte del proceso! Si ves algo para mejorar,
                      decímelo sin filtro: cada aporte tuyo suma muchísimo.
                    </p>

                    <p className="font-medium text-gtd-clarity-700">
                      Abrazo grande y, una vez más, <strong>GRACIAS</strong> por estar.
                    </p>
                  </div>

                  {/* Botón único */}
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => onClose(true)}
                      className="bg-gradient-to-r from-gtd-clarity-500 via-gtd-action-500 to-gtd-focus-500 hover:from-gtd-clarity-600 hover:via-gtd-action-600 hover:to-gtd-focus-600 text-white font-medium px-8 py-2 rounded-lg transition-all duration-200"
                    >
                      ¡Empecemos! 🚀
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
