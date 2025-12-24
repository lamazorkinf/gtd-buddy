"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

// Declarar el tipo del web component para TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "agent-id": string
        },
        HTMLElement
      >
    }
  }
}

const AGENT_ID = "agent_3901kd6d6wj7f738zdc91ccckmfm"

export function BuddyWidget() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
        strategy="lazyOnload"
        async
      />
      <style jsx global>{`
        /* Estilos responsive para el widget de ElevenLabs */
        elevenlabs-convai {
          position: fixed !important;
          z-index: 9999 !important;
        }

        /* Desktop: esquina inferior derecha */
        @media (min-width: 768px) {
          elevenlabs-convai {
            bottom: 20px !important;
            right: 20px !important;
          }
        }

        /* Mobile: centrado en la parte inferior, más arriba para no tapar navegación */
        @media (max-width: 767px) {
          elevenlabs-convai {
            bottom: 80px !important;
            right: 16px !important;
          }

          /* Ajustar el tamaño del botón en móvil si es necesario */
          elevenlabs-convai::part(widget-button) {
            transform: scale(0.9);
          }
        }

        /* Tablet */
        @media (min-width: 768px) and (max-width: 1024px) {
          elevenlabs-convai {
            bottom: 24px !important;
            right: 24px !important;
          }
        }

        /* Evitar que tape el contenido cuando el modal está abierto */
        elevenlabs-convai[data-expanded="true"] {
          bottom: 0 !important;
          right: 0 !important;
        }

        /* Mobile landscape */
        @media (max-height: 500px) and (orientation: landscape) {
          elevenlabs-convai {
            bottom: 10px !important;
            right: 10px !important;
          }
        }
      `}</style>
      <elevenlabs-convai agent-id={AGENT_ID} />
    </>
  )
}
