# DeHecho: recorrido del usuario y datos disponibles

Actualización de integración, 15 de noviembre de 2026: el frontend incorpora
una copia trazable de los conteos CONAF mediante `/api/incendios`, independiente
del proxy ambiental. La reproducción del mapa usa los totales comunales por
temporada julio–junio y posiciones simbólicas; la vista mensual muestra solo
el total regional. El backend todavía no publica estos conteos en sus rutas.
El origen, las limitaciones y la actualización se documentan en el README.

Revisión del 14 de noviembre de 2026, con el código y las fuentes locales actuales.
La propuesta usa lo que devuelve la API; los análisis y descargas del otro chat
pueden ampliar el recorrido cuando se incorporen a su contrato público.

Se consultó la aplicación FastAPI mediante TestClient y sus datos reales, sin
modificar fuentes ni análisis. Las respuestas y solicitudes exactas están en
[api-respuestas-inspeccionadas.json](api-respuestas-inspeccionadas.json).
Esto verifica la aplicación local, no un despliegue ni la conexión desde el navegador.

## Qué podemos mostrar hoy

Los cinco conjuntos están disponibles y `/health` devuelve `{"status":"ok"}`.

| Contenido | Consulta y conjunto | Alcance real | Uso en la interfaz |
| --- | --- | --- | --- |
| Series ambientales regionales | `/api/series`, `ambiente_region` | 4 variables × 120 meses, enero 2014–diciembre 2023 | Panorama regional y referencia para comparar una comuna. |
| Series ambientales comunales | `/api/series`, `ambiente_comunas` | 32 comunas × 4 variables × 120 meses | Selección en el mapa, gráfico mensual y lectura de un mes. |
| Tendencias ambientales | `/api/tendencias`, `tendencias_ambientales` | 132 resultados: 33 territorios × 4 variables | Magnitud del cambio por década, incertidumbre y evidencia. |
| Asociaciones con incendios | `/api/asociaciones`, `asociaciones_conaf` | 4 efectos ajustados, región completa, julio 2014–diciembre 2023, 114 meses | Explicar qué asociaciones respalda el modelo y para qué cambio ambiental. |
| Hallazgos sobre incendios | `/api/hallazgos`, `hallazgos_conaf` | 5 textos regionales publicados | Explicaciones y sensibilidad del modelo junto a los resultados numéricos. |

Las cuatro variables necesitan estos nombres visibles:

| Identificador | Nombre visible | Serie mensual | Tendencia |
| --- | --- | --- | --- |
| `temperature_2m_c` | Temperatura del aire a 2 m | °C | °C por década |
| `precipitation_mm` | Precipitación | mm/mes | mm/mes por década |
| `relative_humidity_2m_pct` | Humedad relativa del aire | % | Puntos porcentuales por década |
| `soil_moisture_0_10cm_kgm2` | Humedad del suelo de 0–10 cm | kg/m² | kg/m² por década |

La humedad del suelo no viene expresada en porcentaje. La pendiente de lluvia
describe el cambio del acumulado mensual; no es un cambio del total anual.

## Formato que recibe el frontend

Las consultas de datos devuelven listas JSON, sin un envoltorio `data` ni paginación.
Las fechas son cadenas ISO y los códigos territoriales son cadenas con ceros
iniciales: `09` para la región y, por ejemplo, `09101` para Temuco.

Una serie contiene identificación, unidad, frecuencia y `points`. Un punto real:

```json
{
  "start": "2023-02-01",
  "end": "2023-02-28",
  "value": 18.901
}
```

Corresponde a temperatura mensual de Temuco. La consulta completa es
`/api/series?dataset=ambiente_comunas&territory_id=09101&variable=temperature_2m_c&start=2023-01-01&end=2023-03-31`.
`start` y `end` filtran meses por solapamiento: seleccionar un día no produce
una observación diaria. Usar selectores de mes en el producto.

Una tendencia entrega `slope_per_decade`, límites `ci95_marginal_low/high`,
`p_holm`, `status`, `n_used` y el período de estimación. No entrega una curva
ajustada, intercepto ni coeficientes estacionales; estos campos no alcanzan para
dibujar la recta ajustada encima de la serie mensual original.

Las asociaciones actuales tienen `type="rate_ratio"`, `rate_ratio`, su intervalo,
`p_holm`, `increment`, `direction`, `unit`, período y muestra. Aunque el esquema
admite correlaciones y contrastes, los datos reales publicados contienen solo
las cuatro razones de tasas. No diseñar pestañas de resultados todavía vacías.

Un hallazgo tiene `id`, `title`, `summary`, período y, cuando corresponde,
variable y territorio. El hallazgo general de presencia mensual no tiene variable;
se pierde si se solicita únicamente una variable. Conviene cargar los cinco una vez.

El catálogo entrega disponibilidad, códigos, variables y listas de unidades.
No entrega nombres de comunas, definiciones, límites de fechas ni una relación
variable→unidad. Las listas `variables` y `units` no se pueden emparejar por posición.
Los nombres y los 32 códigos ya existen en `src/data/communes.json` y coinciden
exactamente con los de la API. Para títulos y definiciones hace falta un pequeño
diccionario editorial; usar la unidad de cada respuesta para los valores.

## Propuesta de recorrido

El trabajo principal del usuario sería responder: **qué cambió, dónde, cuánto
y con qué evidencia**, y después consultar su relación regional con incendios.
Como audiencia inicial propongo personas que quieren entender su territorio
sin conocer estadística; el detalle técnico se abre cuando lo necesitan.

### 1. Entrar con una pregunta y una respuesta visible

Abrir directamente el mapa existente, con la región seleccionada y la pregunta
«¿Qué cambió en La Araucanía entre 2014 y 2023?». Iniciar con humedad relativa,
porque tiene una señal publicada interpretable y datos comunales disponibles.
No exigir completar un formulario para encontrar el primer resultado.

Texto principal propuesto:

> La humedad relativa del aire disminuyó durante 2014–2023.
> Cambio estimado: −9,34 puntos porcentuales por década.
> Descenso con evidencia estadística.

El período debe estar visible desde el inicio. El botón «Explorar una comuna»
activa o dirige al mapa y al buscador. «Ver otras variables» cambia la pregunta
manteniendo el territorio. El dato es histórico; no titularlo «condiciones actuales».

### 2. Seleccionar territorio y observar la serie

Clic en una comuna o búsqueda por nombre actualizan la selección existente y
abren una ficha con nombre, variable, período, conclusión, magnitud y gráfico.
La elevación de la comuna conserva su papel de confirmación de selección.

Ejemplo real para Temuco, humedad relativa:

> En Temuco, la humedad relativa muestra un descenso con evidencia.
> −10,21 puntos porcentuales por década; intervalo marginal del 95 %:
> −14,15 a −6,26. Estimación sobre 120 meses, 2014–2023.

La lectura se organiza así: conclusión breve → cuánto cambia → gráfico mensual
→ «Cómo se calculó». El gráfico permite consultar valores por mes con ratón,
teclado o una tabla accesible. No mostrar un «valor actual»: el último mes es
diciembre de 2023. «Comparar con la región» añade la misma variable regional,
con igual unidad y escala, sin convertir la diferencia visual en una prueba estadística.

En escritorio, conservar el mapa y una ficha lateral. En móvil, mapa arriba y
ficha debajo con scroll normal, buscador siempre accesible y opción de tabla
cuando el mapa 3D no cargue. El CSS actual fija toda la pantalla y bloquea el
scroll del documento; habrá que adaptarlo para incorporar contenido largo.

### 3. Separar observar meses de interpretar diez años

Cambiar el rango modifica únicamente el gráfico. Junto al resultado mantener:
«Tendencia calculada para 2014–2023». Nunca enviar `start/end` a tendencias:
el endpoint los rechaza con 422. No ofrecer «calcular tendencia de mi selección».

Conservar cuatro estados comprensibles:

| Estado API | Texto visible | Tratamiento |
| --- | --- | --- |
| `evidence_increasing` | Aumento con evidencia | Magnitud e intervalo, símbolo de dirección. |
| `evidence_decreasing` | Descenso con evidencia | Magnitud e intervalo, símbolo de dirección. |
| `uncertain_trend` | Evidencia insuficiente para afirmar una tendencia | Mostrar estimación e incertidumbre sin afirmar estabilidad. |
| `insufficient_coverage` | Datos insuficientes para estimar esta tendencia | Sin magnitud numérica; explicar la cobertura y ofrecer otra variable. |

Hoy hay 33 descensos con evidencia, todos de humedad relativa; 98 tendencias
inciertas y una exclusión. Pintar el mapa únicamente por «hay evidencia/no hay»
produciría una capa poco informativa para humedad relativa. Usar magnitud para
el color, con leyenda en unidades por década, y símbolo o trama para evidencia
y cobertura. Ofrecer también la lista con valores; no ordenar por «riesgo».

El relieve y los bosques 3D son contexto territorial. Para que el dato sea legible,
probar una capa temática de límites o superficies controladas, con leyenda fija,
sin convertir los elementos decorativos en mediciones.

### 4. Pasar al contexto regional de incendios

Acción desde la ficha: «Ver relación regional con incendios». El nuevo panel
se titula «Incendios en La Araucanía» y muestra «Julio 2014–diciembre 2023».
Explicar el cambio de escala: «Este análisis corresponde a toda la región».
Se puede conservar la comuna para volver, pero sus datos no deben encabezar
el resultado regional como si fuera una asociación comunal.

Primera explicación propuesta:

> En el modelo regional, un déficit adicional de 49,60 mm/mes en la anomalía
> de precipitación se asocia con una razón de tasas de incendios de 1,73.
> Intervalo marginal del 95 %: 1,49–2,00.

En el detalle, explicar anomalía como diferencia respecto de la referencia
mensual del análisis y razón de tasas como comparación multiplicativa del
conteo esperado bajo el modelo. No convertir 1,73 en «73 % de probabilidad de
incendio». La asociación es ajustada y la escala ambiental es `increment` con
`direction`; no es el efecto de un milímetro menos ni un pronóstico.

Presentar lluvia primero, luego las otras tres variables con sus hallazgos:
el suelo es sensible al control temporal; temperatura y humedad relativa no
tienen evidencia independiente suficiente en este modelo. Mostrar numérico
y hallazgo juntos para conservar estas diferencias.

La pantalla puede usar un gráfico de razones de tasas con referencia en 1,
intervalos y etiquetas del cambio de cada variable. Las escalas corresponden
a incrementos distintos; no titularlo «ranking de importancia».

### 5. Abrir la evidencia cuando hace falta

«Ver evidencia y fuentes» despliega período, muestra, intervalo marginal,
corrección de pruebas, definición y límites de la medición. La evidencia debe
venir del estado publicado o del p corregido correspondiente, nunca solo de
si el intervalo cruza cero o uno.

Ejemplo concreto: lluvia regional tiene pendiente −37,09 mm/mes por década e
intervalo marginal enteramente negativo, pero p Holm ≈ 0,112 y estado incierto.
Mostrar «descenso confirmado» a partir de ese intervalo sería un error.

Los métodos y fuentes detallados no están en las respuestas. Para la primera
versión pueden mantenerse como contenido editorial revisado; para ampliar
datasets conviene añadir metadatos públicos suficientes para mantener ese
contenido sincronizado. No hace falta mostrar hashes o auditorías al usuario.

## Boceto de organización

```text
DeHecho                       [Buscar comuna] [Ver región]
¿Qué cambió entre 2014 y 2023?
[Humedad relativa] [Temperatura] [Precipitación] [Suelo]

┌──────────────────────────────┬─────────────────────────────┐
│                              │ Temuco                      │
│ Mapa 3D seleccionable        │ Humedad relativa del aire   │
│ Color: cambio por década     │ Descenso con evidencia      │
│ Leyenda + alternativa lista  │ −10,21 pp por década         │
│                              │                             │
│                              │ Serie mensual 2014–2023     │
│                              │ [Comparar con la región]    │
│                              │ [Ver evidencia y fuentes]   │
└──────────────────────────────┴─────────────────────────────┘
                   [Ver relación regional con incendios]
```

Dirección visual para una futura implementación: conservar el cielo y el relieve
como rasgo principal, texto alineado a la izquierda y ficha clara de lectura.
Base propuesta: cielo `#91CBE3`, texto `#203E42`, superficie `#F7FBFC`, agua
`#25689A`, tierra `#956134`, neutral de faltantes `#68777D`. La escala de datos
necesita sus propios niveles y comprobación de contraste; nunca depender solo
del color. Mantener Geist para controles y lectura, cifras tabulares para valores,
sin añadir otra tipografía por ahora. El mapa concentra la expresión visual;
los controles y el gráfico deben permanecer sobrios. Evitar una portada genérica
de indicadores: la selección territorial y la pregunta ya dan estructura al producto.

## Estados que forman parte del recorrido

| Caso comprobado o definido en el contrato | Comportamiento de producto |
| --- | --- |
| Suelo de Saavedra: 120 valores `null`; motivo `insufficient_coverage` | Explicar falta de cobertura; no dibujar ceros ni interpolar. Sus otras variables siguen disponibles. |
| Consulta válida fuera del período: HTTP 200, `[]` | «No hay observaciones en este período» y acción para volver a 2014–2023. |
| Asociación con `territory_id=09101`: HTTP 422 | Impedir esa combinación y dirigir explícitamente al análisis regional. |
| Dataset desconocido: HTTP 404 | Corregir la selección según el catálogo; no presentarlo como cero resultados científicos. |
| Dataset no disponible: HTTP 503 | Mensaje localizado y reintento; mantener las vistas de otros conjuntos disponibles. |
| `/health` degradado | Revisar disponibilidad por dataset, sin bloquear toda la aplicación automáticamente. |
| Cambio rápido de comuna o variable | Cancelar o descartar la respuesta anterior; nunca mostrar datos de otra comuna bajo el nuevo título. |
| Carga o error de red | Estado visible en la ficha, selección conservada y botón de reintento. |

## Lo que aún no permite la API

- Serie de conteos de incendios: existen archivos, pero `/api/series` solo
  publica las cuatro variables ambientales.
- Superficie afectada: la nueva carpeta `data/conaf/superficie/` contiene datos
  regionales mensuales y comunales por temporada; no forma parte del catálogo.
- Anomalías, episodios, VPD y picos de temperatura: hay cálculos o fuentes
  internas para parte de este contenido; no hay series/resultados públicos
  para construir esas vistas con el contrato actual.
- Ubicaciones de incendios y conteos comunales mensuales: no están disponibles.
  No colocar llamas sobre ubicaciones que parezcan igniciones observadas. Si se
  usa el recurso animado existente, reservarlo para identificar la sección o
  indicar un agregado claramente explicado, sin falsa precisión geográfica.
- Ajuste de nuevos períodos, alertas y pronósticos: fuera del alcance actual.

Cuando se publiquen los nuevos datos, el recorrido puede añadir «¿Cambió la
cantidad de incendios o la superficie afectada?». Tendría una vista regional
mensual y otra comunal por temporada julio–junio, con selectores distintos.
Los blancos de superficie y conteos deben conservar su motivo; no inferir cero.
La descarga nueva informa 13 meses regionales con superficie en blanco y tres
filas comunales incompletas en las temporadas comparables. La integración debe
resolver explícitamente las diferencias de faltantes con los conteos antiguos.

## Orden de implementación recomendado

1. Conectar catálogo, selector de cuatro variables, región/comuna, serie y
   tendencia; cargar un primer resultado regional sin interacción previa.
2. Añadir comparación con región, leyenda temática y alternativa de lista/tabla.
3. Incorporar asociaciones y hallazgos regionales con el cambio de escala visible.
4. Sumar conteos, hectáreas, episodios o nuevas variables cuando el backend
   los valide y publique. Pueden reutilizar la ficha y los estados existentes.

Para la conexión, la API no configura CORS actualmente. Propongo consumirla
desde el servidor de Next o mediante un proxy del mismo origen; una conexión
directa del navegador a otro puerto necesitaría configurar orígenes permitidos.
No hay autenticación en las rutas inspeccionadas.

Al iniciar: cargar catálogo, tendencias de la variable activa para el mapa y
serie regional. Al elegir comuna: pedir su serie y reutilizar la tendencia
ya cargada. Se pueden cachear los resultados porque no cambian por petición;
las actualizaciones se cargan al reiniciar la API. Guardar territorio, variable,
vista y rango en la URL permite volver y compartir la consulta.

La respuesta con todas las series comunales mide 894.588 bytes antes de
compresión y contiene 15.360 puntos. Conviene solicitar variable/territorio
según la vista, sin bloquear el mapa por descargar todo. Las fechas mensuales
se deben tratar como fechas de calendario; evitar que una conversión a hora
local desplace el primer día al mes anterior.

Queda por validar con una persona usuaria si entra buscando su comuna o una
pregunta ambiental. La propuesta permite ambas entradas y lleva a la misma
ficha, sin necesitar dos productos separados.
