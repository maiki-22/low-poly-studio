'use client'

import dynamic from "next/dynamic";
import Image from "next/image";
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
  FiAlertTriangle,
  FiCloud,
  FiCloudRain,
  FiSearch,
  FiDatabase,
} from "react-icons/fi";

const EarthGlobe = dynamic(() => import("@/components/EarthGlobe"), {
  ssr: false,
  loading: () => <div className="h-[470px] w-[470px]" />,
});

export default function Page() {
  const router = useRouter();

  const variables = [
    {
      icon: <FiAlertTriangle />,
      name: "Incendios forestales",
      description:
        "Incidencia de incendios en La Araucanía, según las estadísticas de CONAF.",
      category: "INCENDIOS",
      unit: "incidencia",
      wide: true,
    },
    {
      icon: <FiThermometer />,
      name: "Temperatura",
      description: "Temperatura del aire a 2 m y máxima mensual.",
      category: "ATMÓSFERA",
      unit: "°C",
    },
    {
      icon: <FiDroplet />,
      name: "Humedad del aire",
      description: "Humedad relativa, humedad específica y punto de rocío a 2 m.",
      category: "ATMÓSFERA",
      unit: "%, kg/kg, °C",
    },
    {
      icon: <FiWind />,
      name: "Viento",
      description: "Velocidad y componentes este-oeste y norte-sur a 10 m.",
      category: "ATMÓSFERA",
      unit: "m/s",
    },
    {
      icon: <FiLayers />,
      name: "Suelo",
      description: "Humedad y temperatura del suelo entre 0 y 10 cm de profundidad.",
      category: "SUPERFICIE",
      unit: "kg/m², °C",
    },
    {
      icon: <FiCloudRain />,
      name: "Precipitación",
      description: "Lluvia acumulada en cada mes.",
      category: "HIDROLOGÍA",
      unit: "mm",
    },
    {
      icon: <FiCloud />,
      name: "Aerosoles",
      description: "Profundidad óptica a 550 nm: cuántas partículas, como humo, hay en el aire.",
      category: "ATMÓSFERA",
      unit: "AOD",
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
      route: "/mapa#datos",
    },
  ];

  return (
    <main className="min-h-screen bg-[#05080D] text-[#E5EAF1]">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#05080D]/90 shadow-lg shadow-black/10 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#0033A0]/30 bg-[#0033A0]/10 text-[#6EA3F2]">
              <Image
                src="/icon.svg"
                alt="DeHecho"
                width={40}
                height={40}
                className="h-[40px] w-[40px] rounded"
              />
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
            <a href="#fuentes" className="transition hover:text-white">
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
              ocurren en nuestra región de la araucanía.
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {variables.map((variable) => (
              <article
                key={variable.name}
                className={`group rounded-lg border border-white/[0.08] bg-[#0D1520] p-6 transition duration-300 hover:border-[#6EA3F2]/40 hover:bg-[#111C2A] ${
                  variable.wide ? "sm:col-span-2 lg:col-span-3" : ""
                }`}
              >

                <div className="mb-8 flex items-center justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#6EA3F2]/20 bg-[#6EA3F2]/[0.07] text-xl text-[#6EA3F2]">
                    {variable.icon}
                  </div>

                  <span className="font-mono text-xs text-slate-600">
                    {variable.unit}
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


              </article>
            ))}

          </div>
        </div>
      </section>

      {/* FUENTES */}
      <section
        id="fuentes"
        className="border-y border-white/[0.07] bg-[#090E16] px-6 py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">

          <div className="mb-14 max-w-2xl">

            <p className="mb-5 flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-[#6EA3F2]">
              <span className="h-px w-7 bg-[#6EA3F2]" />
              FUENTES DE DATOS
            </p>

            <h2 className="text-3xl font-medium tracking-tight sm:text-5xl">
              De dónde vienen los datos.
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              Trabajamos con observaciones de satélites y modelos de la NASA,
              que consultamos con Giovanni, y con estadísticas oficiales de
              incendios forestales de CONAF. Cada fuente cubre un periodo y una escala distintos, y eso
              determina qué tan lejos en el tiempo puedes mirar.
            </p>

          </div>

          

          {/* Citas: acceso a datos y estadísticas oficiales */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">

            {/* Giovanni (NASA) */}
            <div className="flex flex-col justify-between gap-6 rounded-lg border border-white/[0.08] bg-[#0D1520] p-6 transition duration-300 hover:border-[#6EA3F2]/40 hover:bg-[#111C2A]">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#6EA3F2]/20 bg-[#6EA3F2]/[0.07] text-xl text-[#6EA3F2]">
                  <FiGlobe />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Acceso y análisis de datos de la NASA
                  </p>

                  <h3 className="mt-1 font-semibold text-white">
                    Giovanni, NASA GES DISC
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Plataforma para explorar y visualizar datos de ciencias
                    de la Tierra, con productos como MERRA-2.
                  </p>
                </div>

              </div>

              <a
                href="https://giovanni.gsfc.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 self-start text-sm font-medium text-[#9DBFF5] transition hover:text-white"
              >
                Ver fuente
                <FiArrowUpRight />
              </a>

            </div>

            {/* CONAF */}
            <div className="flex flex-col justify-between gap-6 rounded-lg border border-white/[0.08] bg-[#0D1520] p-6 transition duration-300 hover:border-[#6EA3F2]/40 hover:bg-[#111C2A]">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#6EA3F2]/20 bg-[#6EA3F2]/[0.07] text-xl text-[#6EA3F2]">
                  <FiDatabase />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Datos de incendios forestales
                  </p>

                  <h3 className="mt-1 font-semibold text-white">
                    Corporación Nacional Forestal (CONAF)
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Estadísticas históricas: ocurrencia nacional de incendios
                    forestales, 2014-2023.
                  </p>
                </div>

              </div>

              <a
                href="https://www.conaf.cl/centro-documentals/estadisticas-historicas/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 self-start text-sm font-medium text-[#9DBFF5] transition hover:text-white"
              >
                Ver fuente
                <FiArrowUpRight />
              </a>

            </div>

          </div>

          <p className="mt-6 text-xs text-slate-600">
            Las resoluciones son aproximadas y varían según el producto.
          </p>

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


                </div>

                <h3 className="text-xl font-medium">
                  {feature.title}
                </h3>

                <p className="mt-4 flex-1 text-sm leading-7 text-slate-400">
                  {feature.description}
                </p>


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