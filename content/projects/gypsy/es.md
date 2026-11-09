---
role: Full-Stack Developer & Diseñadora UI/UX
tags:
  - Desarrollo Full-Stack
  - Diseño UI/UX
  - CMS a Medida
  - Catálogo E-Commerce
awards: []
---

# Summary

Diseño y desarrollo de un ecosistema digital para [Gypsy](gypsy-joyas.vercel.app/), una marca de joyería artesanal. Se creó un catálogo de productos y un panel de administración a medida que centraliza la gestión del inventario y sincroniza el stock en tiempo real.

# Gallery

La marca inicialmente operaba sólo a través de Instagram, por lo que el principal desafío técnico fue crear un catálogo digital oficial que fuera a la vez escalable y fácil de gestionar para la dueña de la marca. Construir un sitio web estático hubiera hecho ineficiente la actualización de la disponibilidad de productos, precios e imágenes. Para resolver esto, el proyecto se expandió para incluir un panel de administración interno hecho a medida y conectado directamente a una base de datos, creando un sistema autónomo donde las actualizaciones se ven reflejadas instantáneamente en el catálogo público

# Features

## 01. Sincronización en tiempo real

Conexión directa entre el panel en React, la API en Node/Express y PostgreSQL para que ningún cliente vea una pieza agotada como disponible. Cada cambio de estado se refleja al instante en el catálogo público.

## 02. Gestión multimedia integrada

Carga directa de imágenes desde el panel de administración hacia Vercel Blob, optimizando el almacenamiento sin ensuciar el repositorio ni requerir edición previa externa.

## 03. Arquitectura híbrida eficiente

Separación inteligente de responsabilidades entre un frontend público ligero en Vanilla JS —rápido y con SEO limpio— y un entorno administrativo potente en React + Vite.

## 04. Modelado de datos con Prisma

Esquema estructurado para soportar atributos específicos de joyería: materiales, colecciones, estado de disponibilidad, precios e imágenes asociadas.
