"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Zap, Brain, BarChart, ArrowRight, LogIn, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { modernTheme } from "@/lib/theme"

const gtdBenefits = [
  {
    icon: <Zap className="h-10 w-10 text-purple-500" />,
    title: "Captura Todo",
    description: "Libera tu mente anotando todas tus tareas e ideas en un solo lugar.",
    bgColor: "bg-purple-100",
  },
  {
    icon: <Brain className="h-10 w-10 text-pink-500" />,
    title: "Clarifica y Organiza",
    description: "Procesa tus tareas, divídelas en acciones concretas y organízalas por contexto.",
    bgColor: "bg-pink-100",
  },
  {
    icon: <BarChart className="h-10 w-10 text-orange-500" />,
    title: "Revisa y Enfócate",
    description: "Revisa tus listas regularmente para mantener el control y enfocarte en lo importante.",
    bgColor: "bg-orange-100",
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-green-500" />,
    title: "Ejecuta con Confianza",
    description: "Aborda tus tareas sabiendo que estás trabajando en lo correcto en el momento adecuado.",
    bgColor: "bg-green-100",
  },
]

const appAdvantages = [
  {
    icon: <Sparkles className="h-6 w-6 text-purple-500" />,
    text: "Interfaz intuitiva y motivadora diseñada específicamente para GTD.",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-pink-500" />,
    text: "Categorías GTD predefinidas: Inbox, Próximas Acciones, Proyectos, etc.",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-orange-500" />,
    text: "Priorización y fechas límite para mantenerte al día.",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-green-500" />,
    text: "Sincronización en la nube para acceder a tus tareas desde cualquier lugar.",
  },
  {
    icon: <Sparkles className="h-6 w-6 text-blue-500" />,
    text: "Diseño responsive para usar en escritorio y móviles.",
  },
]

export default function LandingPage() {
  return (
    <div className={`min-h-screen w-full ${modernTheme.colors.bg} overflow-x-hidden`}>
      {/* Hero Section */}
      <section className={`relative w-full py-24 md:py-40 text-center text-white overflow-hidden ${modernTheme.effects.glass}`}>
        <div className={`absolute inset-0 ${modernTheme.colors.primary} opacity-90`}></div>
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
      radial-gradient(at 40% 20%, hsla(215, 98%, 61%, 0.8) 0px, transparent 50%),
      radial-gradient(at 80% 0%, hsla(256, 96%, 68%, 0.8) 0px, transparent 50%),
      radial-gradient(at 0% 50%, hsla(343, 68%, 79%, 0.8) 0px, transparent 50%),
      radial-gradient(at 80% 50%, hsla(222, 67%, 73%, 0.8) 0px, transparent 50%),
      radial-gradient(at 0% 100%, hsla(355, 98%, 76%, 0.8) 0px, transparent 50%),
      radial-gradient(at 80% 100%, hsla(125, 98%, 72%, 0.8) 0px, transparent 50%)
    `,
            backgroundSize: "400% 400%",
          }}
        ></div>

        <div className="w-full px-6 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className={`text-5xl md:text-7xl ${modernTheme.typography.heading} mb-8 drop-shadow-lg`}
          >
            Domina tu Productividad con <span className="block mt-2">GTD Buddy</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto drop-shadow-sm"
          >
            Tu mente libre, tu sistema claro. Captura. Decide. Avanza.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row justify-center items-center gap-6"
          >
            <Link href="/auth?tab=signup" passHref>
              <Button
                size="lg"
                className={`text-white text-lg px-10 py-7 ${modernTheme.container.radius} ${modernTheme.typography.heading} ${modernTheme.container.shadow} hover:shadow-xl transform hover:-translate-y-1 ${modernTheme.effects.transition} w-full sm:w-auto bg-white ${modernTheme.colors.primaryText} hover:bg-white/90`}
              >
                Comienza Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth?tab=signin" passHref>
              <Button
                size="lg"
                variant="outline"
                className={`border-white text-white hover:bg-white ${modernTheme.colors.primaryText} text-lg px-10 py-7 ${modernTheme.container.radius} ${modernTheme.typography.heading} ${modernTheme.container.shadow} hover:shadow-xl transform hover:-translate-y-1 ${modernTheme.effects.transition} w-full sm:w-auto`}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Iniciar Sesión
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What is GTD Section */}
      <section id="what-is-gtd" className="w-full py-20 md:py-28">
        <div className="w-full px-6 max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`text-4xl md:text-5xl ${modernTheme.typography.heading} text-center mb-16`}
          >
            ¿Qué es el Método <span className={modernTheme.colors.primaryText}>Getting Things Done?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className={`text-lg ${modernTheme.colors.mutedForeground} mb-16 max-w-3xl mx-auto text-center`}
          >
            GTD es un sistema de gestión de la productividad creado por David Allen. Se basa en mover las tareas de tu
            mente a un sistema externo confiable, permitiéndote enfocarte en la acción en lugar de recordar qué tienes
            que hacer.
          </motion.p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {gtdBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, delay: index * 0.08, ease: "easeOut" }}
                className="h-full"
              >
                <Card className={`text-center ${modernTheme.container.shadow} hover:shadow-2xl ${modernTheme.effects.transition} ${modernTheme.container.radius} overflow-hidden h-full flex flex-col ${modernTheme.effects.glass} border ${modernTheme.colors.cardBorder}`}>
                  <CardHeader className={`p-8 ${benefit.bgColor} flex-shrink-0`}>
                    <div className={`mx-auto bg-white ${modernTheme.container.radius} p-4 w-fit mb-5 ${modernTheme.container.shadow}`}>{benefit.icon}</div>
                    <CardTitle className={`text-2xl ${modernTheme.typography.heading} ${modernTheme.colors.primaryText} min-h-[4rem] flex items-center justify-center leading-tight`}>
                      {benefit.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex-grow flex items-center">
                    <p className={`${modernTheme.colors.mutedForeground} text-md`}>{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Advantages Section */}
      <section id="advantages" className={`w-full py-20 md:py-28 ${modernTheme.effects.glass}`}>
        <div className="w-full px-6 max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`text-4xl md:text-5xl ${modernTheme.typography.heading} text-center mb-16`}
          >
            Ventajas de <span className={modernTheme.colors.primaryText}>GTD Buddy</span>
          </motion.h2>
          <div className="max-w-3xl mx-auto">
            <ul className="space-y-6">
              {appAdvantages.map((advantage, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
                  className={`flex items-start p-6 ${modernTheme.effects.glass} ${modernTheme.container.radius} ${modernTheme.container.shadow} hover:shadow-xl ${modernTheme.effects.transition} border ${modernTheme.colors.cardBorder}`}
                >
                  <div className={`flex-shrink-0 p-2 bg-purple-100 ${modernTheme.container.radius} mr-4`}>{advantage.icon}</div>
                  <span className={`text-lg ${modernTheme.colors.mutedForeground}`}>{advantage.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full py-20 md:py-28">
        <div className="w-full px-6 max-w-7xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`text-4xl md:text-5xl ${modernTheme.typography.heading} mb-16`}
          >
            Un Precio Simple para <span className={modernTheme.colors.primaryText}>Transformar tu Productividad</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className={`max-w-md mx-auto ${modernTheme.container.shadow} ${modernTheme.container.radius} overflow-hidden border-2 ${modernTheme.colors.cardBorder} hover:${modernTheme.effects.ring} ${modernTheme.effects.transition} group`}>
              <div className={`${modernTheme.colors.primary} p-10 text-white`}>
                <CardTitle className={`text-4xl ${modernTheme.typography.heading} mb-2`}>Plan Pro</CardTitle>
                <p className={`text-6xl ${modernTheme.typography.heading} mb-2`}>
                  $2.500 <span className="text-2xl font-normal">ARS / mes</span>
                </p>
                <p className="text-white/80 text-lg">Todas las funcionalidades incluidas.</p>
              </div>
              <CardContent className={`p-8 ${modernTheme.effects.glass}`}>
                <ul className={`space-y-4 text-left mb-10 ${modernTheme.colors.mutedForeground}`}>
                  {[
                    "Todas las categorías GTD",
                    "Tareas ilimitadas",
                    "Priorización y fechas límite",
                    "Sincronización en la nube",
                    "Acceso multi-dispositivo",
                    "Soporte prioritario (futuro)",
                    "Próximas funcionalidades Pro",
                  ].map((feature) => (
                    <li key={feature} className="flex items-center text-md">
                      <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth?tab=signup" passHref>
                  <Button
                    size="lg"
                    className={`w-full ${modernTheme.colors.primary} ${modernTheme.colors.primaryHover} text-white text-xl py-7 ${modernTheme.container.radius} ${modernTheme.container.shadow} hover:shadow-lg transform group-hover:scale-105 ${modernTheme.effects.transition}`}
                  >
                    Suscríbete Ahora
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`w-full py-12 ${modernTheme.colors.primary} text-white text-center`}>
        <div className="w-full px-6 max-w-7xl mx-auto">
          <p className="text-lg">
            &copy; {new Date().getFullYear()}{" "}
            <a href="https://luoda.ar" target="_blank" rel="noopener noreferrer" className="text-pink-200 hover:text-pink-100">
              Luoda
            </a>
            . Todos los derechos reservados.
          </p>
          <p className="text-md mt-2">
            Construido con <span className="text-pink-200 animate-pulse">♥</span> para ayudarte a ser más productivo.
          </p>
        </div>
      </footer>
    </div>
  )
}
