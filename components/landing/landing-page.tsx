"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Zap, Brain, BarChart, ArrowRight, LogIn, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

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
    <div className="min-h-screen gtd-gradient-bg text-gray-800 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-24 md:py-40 text-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gtd-clarity-500 via-gtd-action-400 to-gtd-focus-400 opacity-90"></div>
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

        <div className="container mx-auto px-6 relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-8 font-heading drop-shadow-lg"
          >
            Domina tu Productividad con <span className="block mt-2">GTD Buddy</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto drop-shadow-sm"
          >
            Tu mente libre, tu sistema claro. Captura. Decide. Avanza.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-6"
          >
            <Link href="/auth?tab=signup" passHref>
              <Button
                size="lg"
                className="gtd-gradient-action hover:from-gtd-action-600 hover:to-gtd-action-800 text-white text-lg px-10 py-7 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 gtd-transition w-full sm:w-auto"
              >
                ⚡ Comienza Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth?tab=signin" passHref>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-purple-600 hover:bg-white hover:text-purple-600 text-lg px-10 py-7 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Iniciar Sesión
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* What is GTD Section */}
      <section id="what-is-gtd" className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 font-heading"
          >
            ¿Qué es el Método <span className="text-purple-600">Getting Things Done?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-700 mb-16 max-w-3xl mx-auto text-center"
          >
            GTD es un sistema de gestión de la productividad creado por David Allen. Se basa en mover las tareas de tu
            mente a un sistema externo confiable, permitiéndote enfocarte en la acción en lugar de recordar qué tienes
            que hacer.
          </motion.p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {gtdBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="text-center shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl overflow-hidden h-full flex flex-col">
                  <CardHeader className={`p-8 ${benefit.bgColor} flex-shrink-0`}>
                    <div className="mx-auto bg-white rounded-full p-4 w-fit mb-5 shadow-md">{benefit.icon}</div>
                    <CardTitle className="text-2xl font-semibold text-gray-800 min-h-[4rem] flex items-center justify-center leading-tight">
                      {benefit.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex-grow flex items-center">
                    <p className="text-gray-600 text-md">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Advantages Section */}
      <section id="advantages" className="py-20 md:py-28 bg-gray-100">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-center mb-16 font-heading"
          >
            Ventajas de <span className="text-pink-500">GTD Buddy</span>
          </motion.h2>
          <div className="max-w-3xl mx-auto">
            <ul className="space-y-6">
              {appAdvantages.map((advantage, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex-shrink-0 p-2 bg-purple-100 rounded-full mr-4">{advantage.icon}</div>
                  <span className="text-lg text-gray-700">{advantage.text}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-16 font-heading"
          >
            Un Precio Simple para <span className="text-red-500">Transformar tu Productividad</span>
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
          >
            <Card className="max-w-md mx-auto shadow-2xl rounded-2xl overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all duration-300 group">
              <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 p-10 text-white">
                <CardTitle className="text-4xl font-bold font-heading mb-2">Plan Pro</CardTitle>
                <p className="text-6xl font-extrabold mb-2">
                  $2.500 <span className="text-2xl font-normal">ARS / mes</span>
                </p>
                <p className="text-purple-100 text-lg">Todas las funcionalidades incluidas.</p>
              </div>
              <CardContent className="p-8 bg-white">
                <ul className="space-y-4 text-left mb-10 text-gray-700">
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
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl py-7 rounded-xl shadow-md hover:shadow-lg transform group-hover:scale-105 transition-all duration-300"
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
      <footer className="py-12 bg-purple-600 text-white text-center">
        <div className="container mx-auto px-6">
          <p className="text-lg">
            &copy; {new Date().getFullYear()}{" "}
            <a href="https://luoda.ar" target="_blank" rel="noopener noreferrer" className="text-pink-500">
              Luoda
            </a>
            . Todos los derechos reservados.
          </p>
          <p className="text-md mt-2">
            Construido con <span className="text-pink-400 animate-pulse">♥</span> para ayudarte a ser más productivo.
          </p>
        </div>
      </footer>
    </div>
  )
}
