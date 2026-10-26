# MISU — Energy-Aware Task OS

> **Un sistema de productividad adaptativo que convierte el estado de energía en una experiencia de planificación y concentración.**

|                       |                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Rol**               | Diseño UX/UI y desarrollo web end-to-end — proyecto individual                                                                  |
| **Año**               | 2026                                                                                                                            |
| **Duración**          | No especificada en la documentación disponible                                                                                  |
| **Estado**            | Aplicación web publicada                                                                                                        |
| **Tecnologías clave** | React 19, Vite, JavaScript, CSS, Supabase, Google Gemini SDK, Framer Motion, dnd-kit, YouTube IFrame API, Web Audio API, Lucide |
| **Demo**              | [misu-os.vercel.app](https://misu-os.vercel.app)                                                                                |
| **Código**            | [github.com/jossmarsala/misu-personal-os](https://github.com/jossmarsala/misu-personal-os)                                      |

---

## 1. Overview — Resumen

**MISU es un sistema personal de productividad diseñado para personas que conviven con déficit de atención, sobrecarga cognitiva o niveles de energía variables.** En lugar de tratar la productividad como una rutina fija, propone ajustar la experiencia a la capacidad disponible en el momento: el usuario indica su nivel de energía y la interfaz adapta su lenguaje visual, las recomendaciones de tareas y el entorno de concentración.

El proyecto comenzó como una herramienta para uso personal y evolucionó hasta convertirse en una aplicación web publicada. Combina organización de tareas, planificación semanal asistida por IA y herramientas de foco en un entorno modular inspirado en un sistema operativo. La premisa central es sencilla: **organizar el trabajo no siempre alcanza; también hay que ayudar a empezar y sostener la acción**.

## 2. The Challenge — El problema

Muchas herramientas de productividad ayudan a registrar tareas, establecer fechas y organizar proyectos, pero no necesariamente resuelven la pregunta que aparece al momento de actuar: _¿qué puedo hacer ahora, con la energía y la atención que tengo disponibles?_

Una lista extensa puede resultar poco útil cuando la carga cognitiva es alta. Una tarea importante puede exigir más energía de la que hay en ese momento, y un plan semanal demasiado rígido puede dejar de sentirse viable cuando cambia la rutina diaria. Además, repartir la planificación, el calendario, la música y las herramientas de concentración entre distintas aplicaciones introduce más pasos y cambios de contexto.

A partir de este problema, MISU se planteó cuatro desafíos de diseño:

- **Reducir la fricción de inicio:** ayudar a pasar de una lista amplia de pendientes a un conjunto manejable de acciones.
- **Alinear las tareas con la capacidad actual:** considerar energía, esfuerzo estimado, categoría y vencimiento en lugar de priorizar únicamente por urgencia.
- **Evitar una experiencia rígida:** permitir que la planificación se adapte y pueda reorganizarse manualmente.
- **Unificar el entorno de trabajo:** integrar planificación y herramientas de foco sin convertir la interfaz en un panel abrumador.

La hipótesis de diseño fue que la productividad podía mejorar si el sistema dejaba de asumir que la capacidad de la persona es constante y empezaba a tratarla como una variable relevante para tomar decisiones.

## 3. The Solution — La solución

MISU incorpora el estado de energía como una entrada central del sistema. Al elegir uno de sus cuatro niveles disponibles, la persona no solo cambia un indicador: modifica el contexto visual y las recomendaciones que recibe.

La solución se apoya en tres principios:

1. **Adaptar antes que exigir.** Las recomendaciones se ajustan al nivel de energía, el tipo de tarea, la duración estimada y la cercanía de la fecha límite.
2. **Hacer visible el siguiente paso.** En vez de presentar todas las tareas como igualmente accionables, el sistema calcula una selección acotada que ayuda a decidir por dónde empezar.
3. **Conectar planificación y ejecución.** El calendario y el plan semanal conviven con el temporizador Pomodoro, la música ambiental y el modo Focus Shield, de modo que la persona puede pasar de organizarse a trabajar en el mismo espacio.

La interfaz adopta la metáfora de un **Sistema Operativo para tu cerebro**: una base de trabajo modular en la que las herramientas pueden activarse según la necesidad, en lugar de permanecer todas abiertas de forma permanente.

## 4. Tech Stack & Architecture — Stack y arquitectura

MISU se implementó como una aplicación web con una arquitectura de interfaz modular. La separación por contextos, componentes, hooks, utilidades y servicios permite mantener diferenciados el estado de la aplicación y las responsabilidades de cada funcionalidad.

### Tecnologías principales

| Tecnología             | Función dentro del proyecto                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| **React 19**           | Composición de la interfaz y gestión de estado mediante componentes y contextos.                |
| **Vite**               | Servidor de desarrollo y proceso de build del frontend.                                         |
| **CSS**                | Sistema visual, variables de diseño, temas, grillas y adaptación responsive.                    |
| **Supabase**           | Autenticación y persistencia en la nube para la experiencia con cuenta configurada.             |
| **Google Gemini SDK**  | Generación asistida del plan semanal a partir de las tareas y el contexto de planificación.     |
| **Framer Motion**      | Transiciones y microinteracciones de la interfaz.                                               |
| **dnd-kit**            | Interacciones de arrastrar y soltar para reorganizar bloques del plan y mover tareas.           |
| **YouTube IFrame API** | Reproducción de música integrada en la aplicación.                                              |
| **Web Audio API**      | Generación de ruido ambiental, sin depender de archivos de audio pregrabados para esos sonidos. |
| **cmdk + Lucide**      | Base de la paleta de comandos y sistema de iconografía.                                         |

### Cómo interactúan las partes

- **Interfaz y estado:** los contextos de energía, tareas, tema, idioma y autenticación permiten que las distintas áreas compartan el estado que necesitan sin concentrar toda la lógica en una sola pantalla.
- **Persistencia:** MISU utiliza Supabase para la experiencia con autenticación y almacenamiento en la nube. También incluye persistencia local para preferencias y estado, además de un modo de uso sin iniciar sesión.
- **Planificación asistida:** el planificador solicita una clave de Gemini configurada desde los ajustes, genera una distribución semanal y permite editar el resultado mediante interacciones de arrastrar y soltar. La IA asiste la planificación; el usuario conserva el control sobre la organización final.
- **Herramientas de concentración:** el temporizador, la música y Focus Shield se coordinan. Por ejemplo, al activar el modo de foco se reduce la presencia de otras distracciones y la experiencia de audio cambia en consecuencia.
- **Publicación:** la aplicación está desplegada en [Vercel](https://misu-os.vercel.app), y el repositorio de código es público.

La lógica del recomendador puede resumirse de forma conceptual así:

```text
compatibilidad = energía disponible + afinidad de categoría
prioridad      = compatibilidad + urgencia del vencimiento + ajuste por duración
recomendación  = tareas filtradas y ordenadas por prioridad
```

Esta representación es explicativa, no un fragmento literal del código. La implementación aplica reglas y puntuaciones para considerar la energía requerida, la categoría, las horas estimadas y el tiempo restante hasta la fecha límite. En niveles bajos de energía también reduce la cantidad y el tiempo total de tareas sugeridas.

## 5. Design & UX Process — Diseño y experiencia de usuario

### De la organización a la acción

El proceso comenzó con el análisis del problema y de patrones habituales en herramientas de productividad: la organización puede ser exhaustiva sin resolver el momento de ejecutar. A partir de esa observación, la arquitectura de información se ordenó alrededor de una secuencia práctica: **reconocer el estado actual, identificar una tarea viable, planificar el resto y activar herramientas de concentración cuando hagan falta**.

La interfaz prioriza una vista principal para tareas y recomendaciones, con el plan semanal como vista complementaria. Las herramientas de apoyo se pueden abrir según la necesidad. En escritorio, la información se distribuye en una grilla _bento_; en pantallas pequeñas, se reorganiza en una columna y una navegación inferior por secciones.

### Sistema visual

El sistema visual lleva la adaptación funcional al plano perceptivo: el color, el fondo y las transiciones acompañan el estado elegido por la persona.

- **Paletas vinculadas a la energía:** los cuatro estados actuales utilizan combinaciones diferenciadas: salvia y menta; lavanda y rosa; azul periwinkle y blush; melón y durazno.
- **Temas claro y oscuro:** el modo claro usa una base cálida cercana al marfil (`#FDFBF7`); el oscuro parte de un carbón cálido (`#1C1B1A`). Las superficies, los bordes y las sombras cambian con el tema.
- **Tipografía:** Outfit para el texto de interfaz, Poppins para títulos destacados y JetBrains Mono para elementos de carácter técnico o atajos.
- **Composición:** tarjetas de gran radio, superficies translúcidas, fondos en degradado y una retícula visual pixelada construyen una identidad suave, contemporánea y reconocible.
- **Movimiento contextual:** el fondo de mosaicos anima sus colores según la energía seleccionada. La animación respeta la preferencia del sistema por reducir movimiento y se pausa cuando la pestaña deja de estar visible.

### Decisiones centradas en el usuario

**La personalización no se limita a la estética.** El cambio de energía también influye en las recomendaciones, por lo que el usuario recibe una respuesta funcional a su selección. Esta coherencia entre señal visual y comportamiento evita que la adaptación se sienta meramente decorativa.

La interfaz también permite personalizar el entorno: los widgets se pueden activar o esconder, el plan semanal se puede reordenar y la paleta de comandos permite acceder a acciones habituales mediante teclado. La aplicación contempla escritorio, tablet y móvil, con una distribución específica para pantallas pequeñas en vez de reducir simplemente la vista de escritorio.

## 6. Key Features — Funcionalidades principales

### 6.1. Interfaz y recomendaciones sensibles a la energía

La selección de energía es el eje del producto. Cada estado activa una combinación visual propia y alimenta el motor de recomendaciones.

El recomendador considera:

- La energía requerida por cada tarea y la energía seleccionada.
- La afinidad entre el estado actual y la categoría de la tarea.
- La duración estimada y los límites de tiempo cuando la energía es baja.
- La urgencia derivada de las fechas límite.

Con esa puntuación, MISU filtra y ordena las tareas pendientes y limita el número de sugerencias según el estado. **La intención es reducir el coste de decidir qué hacer**, sin quitarle al usuario la posibilidad de elegir otra tarea.

### 6.2. Planificador semanal asistido por IA

El planificador utiliza la API de Google Gemini para proponer una distribución de tareas a lo largo de siete días. La propuesta se construye a partir de las tareas existentes y del contexto de la semana; su generación requiere configurar una clave de API desde los ajustes.

La IA funciona como punto de partida, con la interacción de arrastrar y soltar, la persona puede mover tareas entre días y reorganizar bloques dentro del plan. Esto combina la rapidez de una propuesta automática con el control manual necesario para adaptarla a la vida cotidiana.

### 6.3. Entorno de concentración integrado

MISU reúne herramientas que normalmente podrían vivir en aplicaciones distintas:

- **Temporizador Pomodoro:** sesiones de trabajo de 25 minutos, pausas cortas y largas, contador de sesiones y señales sonoras.
- **Focus Shield:** modo de no molestar que reduce elementos distractores de la app y se coordina con el temporizador.
- **Ruido ambiental:** generación de ruido blanco, rosa o marrón mediante Web Audio API.
- **Música ambiental:** reproductor basado en YouTube, con reproducción de música ambiental asociada a cada nivel de energía.
- **Lista de tareas diaria:** pequeña to-do list que se borra de forma automática al finalizar el día. permite establecer un marco de tareas realizables y fomenta la proactividad.

La integración es importante porque las herramientas no funcionan como elementos aislados: el modo de concentración y la reproducción de audio responden al estado de foco, reduciendo interacciones manuales innecesarias.

### 6.4. Espacio modular y accesos rápidos

La estructura de MISU permite activar herramientas según el contexto, consultar el calendario mensual y trabajar con una paleta de comandos accesible mediante `⌘K` o `Ctrl+K`.

La paleta facilita acciones como mostrar u ocultar widgets, cambiar el nivel de energía, alternar entre temas, cambiar el idioma y acceder a opciones de la aplicación. En escritorio, algunos módulos pueden moverse y conservar su ubicación; en móvil, las secciones se reorganizan mediante navegación adaptada a la pantalla.

La aplicación incorpora además autenticación y sincronización en la nube cuando Supabase está configurado, un modo de demostración con tareas de ejemplo y soporte para inglés, español e italiano.

## 7. Challenges & Learnings — Desafíos y aprendizajes

### Convertir una variable subjetiva en comportamiento del sistema

La energía es una percepción personal y cambiante. Para que tuviera utilidad dentro del producto, había que traducirla en decisiones concretas: modificar la paleta, ajustar recomendaciones y limitar la carga sugerida cuando la capacidad disponible es baja. El aprendizaje principal es que **la personalización necesita consecuencias funcionales coherentes**, no solo cambios visuales.

### Coordinar componentes sin perder consistencia

La experiencia cruza tareas, energía, calendario, tema, audio, temporizador y planificación. La separación por contextos y componentes ayuda a que cada función conserve su responsabilidad mientras comparte el estado relevante con el resto. También hace más viable ampliar el sistema sin convertir la vista principal en un único componente difícil de mantener.

### Integrar automatización y control manual

El planificador de IA puede reducir el esfuerzo inicial de distribuir tareas, pero una propuesta automática rara vez contempla todos los cambios del día a día. Permitir editar y mover los bloques mantiene al usuario como responsable de las decisiones finales. Este equilibrio evita presentar la automatización como una autoridad en vez de como una herramienta de apoyo.

### Diseñar para distintos dispositivos y preferencias

Una interfaz modular puede funcionar bien en escritorio y volverse incómoda en pantallas pequeñas si se limita a encoger los mismos componentes. MISU aborda esa diferencia con una grilla _bento_ en escritorio y navegación por secciones en móvil. También contempla temas claro/oscuro y una preferencia de reducción de movimiento para la animación de fondo.

En conjunto, el proyecto reforzó una idea de diseño y desarrollo: **la experiencia de usuario no termina en la pantalla ni en la organización de la información; también está en cómo el sistema acompaña una decisión, reduce pasos y responde al contexto**.

## 8. Results & Impact — Resultados e impacto

### Resultado del proyecto

MISU pasó de ser una herramienta pensada para uso personal a una aplicación web publicada con repositorio de código público. El producto reúne en una misma experiencia:

- Organización de tareas y recomendaciones sensibles a la energía.
- Planificación semanal asistida por IA y editable manualmente.
- Herramientas de concentración coordinadas entre sí.
- Interfaz responsive, personalización visual y accesos rápidos.
- Opciones de autenticación y persistencia local o en la nube, según la configuración.

El resultado principal es una implementación funcional de la hipótesis que originó el proyecto: **un sistema de productividad puede adaptar tanto su apariencia como sus recomendaciones al estado de la persona**.

---

**MISU — An operating system for your brain.**

[Explorar la demo](https://misu-os.vercel.app) · [Ver el código en GitHub](https://github.com/jossmarsala/misu-personal-os)
