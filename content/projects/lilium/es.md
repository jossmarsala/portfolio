---
role: Diseñadora de Producto & Desarrolladora Full-Stack
tags:
  - Educación en Ciberseguridad
  - Cyber Range
  - Plataforma de Aprendizaje
metrics:
awards:
---

# Summary

[Lilium](https://lilium-cyber.vercel.app) es una plataforma de aprendizaje en ciberseguridad con laboratorios prácticos, para estudiantes o pequeñas empresas. La propuesta integra un playbook técnico de 6 módulos, un sistema operativo simulado y un kernel Linux emulado en el navegador.

# Gallery

Quien empieza en ciberseguridad se enfrenta a una dificultad concreta: preparar un entorno de práctica y comprender los estándares técnicos de seguridad suele ser desafiante. Como proyecto final de la Diplomatura en Ciberseguridad, co-desarrollé los contenidos teóricos y diseñé y programé la plataforma de forma independiente. El objetivo fue reunir teoría y práctica en un mismo espacio. El resultado fue una plataforma donde es posible aprender desde cero qué son los controles de seguridad, entender por qué existen y ejecutar comandos Linux directamente en el navegador.

# Características

## 01. Laboratorios interactivos

Para que cualquiera pueda practicar sin configurar un entorno de desarrollo, integré una interfaz que simula un sistema operativo de escritorio con ventanas, aplicaciones y una terminal. Sobre esa base construí un sistema de laboratorios con desafíos progresivos y sumé una terminal Linux real emulada en el navegador, para ejecutar comandos y experimentar sin instalar máquinas virtuales.

## 02. Documentación técnica

El playbook debía acompañar el aprendizaje y conectarse con la práctica, no ser solo texto. Por eso diseñé una documentación modular con explicaciones, bloques de código, listas, diagramas y ejemplos, presentados de forma progresiva e integrados luego con los laboratorios. También desarrollé un conversor a PDF para consultar el material fuera de la plataforma.

## 03. Página informativa

Diseñé y desarrollé una landing page que presenta la propuesta de Lilium y explica cómo funciona. Con diagramas animados e interactivos y explicaciones breves, traduje conceptos de ciberseguridad complejos en una experiencia visual clara y accesible, incluso para quienes se acercan al tema por primera vez.

## 04. El framework L.I.L.I.U.M.

El playbook se organiza en 6 módulos que forman el acrónimo L.I.L.I.U.M., cada uno dedicado a una etapa del proceso de seguridad de una empresa. Su desarrollo implicó un trabajo de investigación, selección y revisión de contenidos tomando como referencia estándares de la industria. Además, probé personalmente los comandos y procedimientos documentados antes de incorporarlos a la plataforma.

# Desarrollo técnico

Construí la plataforma sobre React, TypeScript y Vite, articulando dos motores propios: un compilador de documentación y un sistema operativo simulado en el navegador.

En lugar de depender de librerías externas para procesar texto, desarrollé un parser que lee archivos Markdown y transforma directivas personalizadas —como listas de pasos interactivas, árboles de directorios y alertas críticas— en un esquema JSON tipado; la interfaz consume ese JSON y lo conecta con componentes propios de React.

Para los laboratorios, integré un gestor de ventanas de escritorio con un emulador x86 en WebAssembly (v86) que arranca un kernel Linux real dentro del navegador, sin costos de servidores en la nube.

# Impacto

El desarrollo de Lilium fue un proceso extenso que unió investigación técnica en ciberseguridad con ingeniería de software. Cada uno de los seis módulos exigió aprender contenidos sobre la marcha y contrastarlos con marcos internacionales (como el NIST CSF, los CIS Controls y la matriz MITRE ATT&CK). Ese nivel de detalle se tradujo en una calificación final de 100/100 en la Diplomatura en Ciberseguridad.

Más allá del logro académico, el proyecto resolvió dos problemas concretos de adopción: convirtió cientos de páginas de normativas complejas en una guía operativa lista para usar en cualquier pequeña empresa sin presupuesto dedicado, y eliminó la barrera de infraestructura para estudiantes, que ahora pueden practicar auditoría, hardening y respuesta ante incidentes desde el navegador, sin riesgo de dañar sus propios equipos. A eso se suma un crecimiento personal significativo en conocimientos y criterio dentro del área de la seguridad.
