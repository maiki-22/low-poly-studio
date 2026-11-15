'use client'

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  FiActivity,
  FiArrowUpRight,
  FiArrowRight,
  FiMapPin,
  FiGlobe,
  FiTrendingUp,
  FiDroplet,
  FiThermometer,
  FiWind,
  FiLayers,
  FiBarChart2,
  FiSearch,
  FiDatabase,
} from "react-icons/fi";
import { GiEarthAmerica } from "react-icons/gi";
import { PiEarThin } from "react-icons/pi";

// El globo usa WebGL/window, por eso se carga solo en el cliente
const EarthGlobe = dynamic(() => import("@/components/EarthGlobe"), {
  ssr: false,
  loading: () => <div className="h-[470px] w-[470px]" />,
});

export default function Page() {
  const router = useRouter();

  const variables = [
    {
      icon: <FiThermometer />,
      name: "Temperatura",
      description: "Variaciones térmicas y tendencias de calentamiento.",
      category: "ATMÓSFERA",
    },
    {
      icon: <FiDroplet />,
      name: "Precipitación",
      description: "Cambios en los patrones de lluvia de la región.",
      category: "HIDROLOGÍA",
    },
    {
      icon: <FiWind />,
      name: "Variables atmosféricas",
      description: "Evolución de las condiciones de la atmósfera.",
      category: "ATMÓSFERA",
    },
    {
      icon: <FiLayers />,
      name: "Variables terrestres",
      description: "Cambios en la superficie y los sistemas terrestres.",
      category: "SUPERFICIE",
    },
  ];

  const features = [
    {
      number: "01",
      icon: <FiGlobe />,
      title: "Explora el territorio",
      description:
        "Selecciona una zona de La Araucanía y descubre qué variables ambientales puedes investigar.",
      action: "Explorar mapa",
      route: "/mapa",
    },
    {
      number: "02",
      icon: <FiSearch />,
      title: "Selecciona variables",
      description:
        "Consulta variables provenientes de misiones satelitales y modelos de ciencias terrestres.",
      action: "Ver variables",
      route: "/variables",
    },
    {
      number: "03",
      icon: <FiBarChart2 />,
      title: "Analiza tendencias",
      description:
        "Visualiza series temporales, calcula tasas de cambio y evalúa la significancia estadística.",
      action: "Comenzar análisis",
      route: "/analisis",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#05080D] text-[#E5EAF1]">

      {/* NAVBAR */}
      <header className="relative z-20 border-b border-white/[0.07] bg-[#05080D]/90">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#0033A0]/30 bg-[#0033A0]/10 text-[#6EA3F2]">
              <GiEarthAmerica size={21} />
            </div>

            <span className="text-xl font-semibold tracking-tight">
              De<span className="text-[#6EA3F2]">Hecho</span>
            </span>
          </button>

          <div className="hidden items-center gap-9 text-sm text-slate-500 md:flex">
            <a href="#inicio" className="transition hover:text-white">
              Inicio
            </a>
            <a href="#variables" className="transition hover:text-white">
              Variables
            </a>
            <a href="#funciones" className="transition hover:text-white">
              Fuentes
            </a>
            <a href="#proyecto" className="transition hover:text-white">
              Sobre el Proyecto
            </a>
          </div>

        </nav>
      </header>

      {/* HERO */}
      <section
        id="inicio"
        className="relative mx-auto flex min-h-[690px] max-w-7xl items-center px-6 py-24 lg:px-10"
      >

        {/* Fondo espacial discreto */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 10% 20%, #6EA3F2 50%, transparent 100%), radial-gradient(1px 1px at 30% 70%, #6EA3F2 50%, transparent 100%), radial-gradient(1px 1px at 65% 15%, #6EA3F2 50%, transparent 100%), radial-gradient(1px 1px at 85% 55%, #6EA3F2 50%, transparent 100%), radial-gradient(1px 1px at 48% 42%, #6EA3F2 50%, transparent 100%)",
          }}
        />

        <div className="relative z-10 grid w-full items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">

          {/* TEXTO PRINCIPAL */}
          <div>

            <div className="mb-8 flex items-center gap-3 text-[11px] font-medium tracking-[0.25em] text-[#6EA3F2]">
              <span className="h-px w-8 bg-[#6EA3F2]" />
              OBSERVACIÓN · CIENCIA · TERRITORIO
            </div>

            <h1 className="text-5xl font-medium leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
              La Tierra está
              <br />
              cambiando.
              <br />
              <span className="font-semibold text-[#6EA3F2]">
                Descubre cómo.
              </span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
              Explora datos satelitales y variables ambientales para
              identificar tendencias y comprender los cambios que
              ocurren en nuestro planeta.
            </p>

            <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
              <FiMapPin className="text-[#6EA3F2]" />
              Región de La Araucanía, Chile.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">

              <button
                onClick={() => router.push("/mapa")}
                className="group flex items-center justify-center gap-3 rounded-lg bg-[#0033A0] px-7 py-4 font-semibold text-white transition hover:bg-[#1749B8]"
              >
                Comenzar Investigación
                <FiArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>

              <button
                onClick={() => router.push("/analisis")}
                className="flex items-center justify-center gap-3 rounded-lg border border-white/15 px-7 py-4 font-medium text-slate-300 transition hover:border-[#6EA3F2]/60 hover:text-white"
              >
                Conocer análisis
                <FiArrowRight />
              </button>

            </div>

            <div className="mt-16 grid max-w-lg grid-cols-2 gap-6 border-t border-white/10 pt-8">

              <div>
                <div className="flex items-center gap-2 text-[#6EA3F2]">
                  <FiDatabase size={16} />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Información
                  </span>
                </div>

                <p className="mt-2 text-sm text-white">
                  Datos científicos
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Observaciones y modelos
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-[#6EA3F2]">
                  <FiTrendingUp size={16} />
                  <span className="text-xs font-medium uppercase tracking-wider">
                    Investigación
                  </span>
                </div>

                <p className="mt-2 text-sm text-white">
                  Análisis temporal
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Tendencias y significancia
                </p>
              </div>

            </div>
          </div>

          {/* VISUALIZACIÓN ESPACIAL */}
          <div className="relative hidden lg:block">

            <div className="relative flex h-[490px] items-center justify-center">

              {/* Tierra real apuntando a La Araucanía */}
              <div className="absolute flex items-center justify-center">
                <EarthGlobe size={470} />
              </div>

              {/* Órbita exterior */}
              <div className="pointer-events-none absolute h-[470px] w-[470px] rotate-[-25deg] rounded-full border border-[#6EA3F2]/20" />

              <div className="pointer-events-none absolute right-[2%] top-[23%] h-2 w-2 rounded-full bg-[#6EA3F2]" />

              <div className="pointer-events-none absolute bottom-[20%] left-[15%] h-1.5 w-1.5 rounded-full bg-[#6EA3F2]" />

              {/* Etiqueta superior */}
              <div className="pointer-events-none absolute right-0 top-5 rounded-lg border border-white/10 bg-[#0A111C]/90 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] tracking-widest text-slate-500">
                  ÁREA DE ESTUDIO
                </p>
                <p className="mt-1 text-sm font-medium text-slate-200">
                  La Araucanía, CL
                </p>
              </div>

              {/* Etiqueta inferior */}
              <div className="pointer-events-none absolute bottom-6 left-0 rounded-lg border border-white/10 bg-[#0A111C]/90 px-4 py-3">
                <p className="text-[10px] tracking-widest text-slate-500">
                  ENFOQUE CIENTÍFICO
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs text-[#6EA3F2]">
                  <FiActivity />
                  Observación terrestre
                </p>
              </div>

            </div>

            <p className="mt-1 text-center text-[10px] tracking-widest text-slate-600">
              EARTH OBSERVATION · LA ARAUCANÍA, CHILE
            </p>

          </div>
        </div>
      </section>

      {/* VARIABLES */}
      <section
        id="variables"
        className="border-y border-white/[0.07] bg-[#090E16] px-6 py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-14 max-w-2xl">

            <p className="mb-5 flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-[#6EA3F2]">
              <span className="h-px w-7 bg-[#6EA3F2]" />
              VARIABLES AMBIENTALES
            </p>

            <h2 className="text-3xl font-medium tracking-tight sm:text-5xl">
              Observa los distintos sistemas de la Tierra.
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              Investiga variables ambientales y estudia su evolución
              a lo largo del tiempo en distintas zonas de La Araucanía.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {variables.map((variable, index) => (
              <article
                key={variable.name}
                className="group rounded-lg border border-white/[0.08] bg-[#0D1520] p-6 transition duration-300 hover:border-[#6EA3F2]/40 hover:bg-[#111C2A]"
              >

                <div className="mb-8 flex items-center justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#6EA3F2]/20 bg-[#6EA3F2]/[0.07] text-xl text-[#6EA3F2]">
                    {variable.icon}
                  </div>

                  <span className="font-mono text-xs text-slate-600">
                    0{index + 1}
                  </span>

                </div>

                <p className="mb-3 text-[9px] font-medium tracking-[0.18em] text-[#6EA3F2]">
                  {variable.category}
                </p>

                <h3 className="font-semibold text-white">
                  {variable.name}
                </h3>

                <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-500">
                  {variable.description}
                </p>

                <button
                  onClick={() => router.push("/variables")}
                  className="mt-7 flex items-center gap-2 text-xs font-medium text-slate-300 transition group-hover:text-[#9DBFF5]"
                >
                  Explorar variable
                  <FiArrowUpRight />
                </button>

              </article>
            ))}

          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section
        id="funciones"
        className="px-6 py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-14">
            <p className="mb-5 flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-[#6EA3F2]">
              <span className="h-px w-7 bg-[#6EA3F2]" />
              METODOLOGÍA DE INVESTIGACIÓN
            </p>

            <h2 className="text-3xl font-medium sm:text-5xl">
              De la observación al descubrimiento.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-slate-400">
              Una herramienta para explorar datos, detectar cambios
              y comprender las tendencias ambientales de nuestro territorio.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">

            {features.map((feature) => (
              <article
                key={feature.number}
                className="group flex flex-col rounded-lg border border-white/[0.08] bg-[#0B111A] p-7 transition hover:border-[#6EA3F2]/40"
              >

                <div className="mb-12 flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#6EA3F2]/20 bg-[#6EA3F2]/[0.06] text-xl text-[#6EA3F2]">
                    {feature.icon}
                  </div>

                  <span className="font-mono text-sm text-slate-600">
                    / {feature.number}
                  </span>

                </div>

                <h3 className="text-xl font-medium">
                  {feature.title}
                </h3>

                <p className="mt-4 flex-1 text-sm leading-7 text-slate-400">
                  {feature.description}
                </p>

                <button
                  onClick={() => router.push(feature.route)}
                  className="mt-8 flex items-center gap-2 text-sm font-medium text-[#6EA3F2] transition group-hover:gap-4"
                >
                  {feature.action}
                  <FiArrowRight />
                </button>

              </article>
            ))}

          </div>
        </div>
      </section>

      

      {/* CTA */}
      <section id="proyecto" className="px-6 py-24 lg:px-10">

        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-xl border border-[#6EA3F2]/20 bg-[#0C1521] px-8 py-16 sm:px-16">

          <div className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full border border-[#6EA3F2]/10" />
          <div className="pointer-events-none absolute -right-4 -top-24 h-72 w-72 rounded-full border border-[#6EA3F2]/10" />

          <div className="relative z-10 max-w-2xl">

            <p className="mb-5 text-[11px] font-medium tracking-[0.2em] text-[#6EA3F2]">
              CIENCIA · DATOS · TERRITORIO
            </p>

            <h2 className="text-4xl font-medium leading-tight sm:text-5xl">
              Comprender nuestro entorno comienza con observarlo.
            </h2>

            <p className="mt-6 leading-7 text-slate-400">
              Explora los cambios ambientales de La Araucanía
              y descubre qué nos dicen los datos sobre nuestro planeta.
            </p>

            <button
              onClick={() => router.push("/mapa")}
              className="mt-9 flex items-center gap-3 rounded-lg bg-[#0033A0] px-7 py-4 font-semibold text-white transition hover:bg-[#1749B8]"
            >
              Comenzar investigación
              <FiArrowUpRight />
            </button>

          </div>
        </div>

      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.07] px-6 py-9 lg:px-10">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">

          <span className="text-lg font-semibold">
            De<span className="text-[#6EA3F2]">Hecho</span>
          </span>

          <p className="text-center text-xs text-slate-500">
            Explorando las tendencias ambientales de La Araucanía.
          </p>

          <p className="text-xs text-slate-600">
            NASA Space Apps Challenge · Proyecto independiente
          </p>

        </div>

      </footer>

    </main>
  );
}