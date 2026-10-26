# Gypsy Joyas — Digital Catalog & Custom Inventory Engine

**One-liner:** Transformación digital para una marca de joyería de autor: de la gestión manual en Instagram a un ecosistema web autónomo con catálogo editorial y panel de administración a medida.

- **Rol:** Full-Stack Developer & UI/UX Designer
- **Cliente:** Gypsy Joyas (Joyería artesanal en bronce, cobre y alpaca)
- **Stack Principal:** HTML5/CSS/JS, React.js (Vite), Node.js, Express (Serverless), PostgreSQL, Prisma, Vercel Blob.
- **Links:** [Sitio Público](https://gypsy-joyas.vercel.app/) | [Repositorio GitHub](https://github.com/jossmarsala/GypsyJoyas)

---

## 1. Overview (Resumen Ejecutivo)

**Gypsy** es una marca de joyería artesanal que trabaja piezas únicas y colecciones en metales nobles como bronce, cobre y alpaca. El proyecto consistió en diseñar y desarrollar de punta a punta su presencia digital oficial: por un lado, un **catálogo web público** con una fuerte impronta visual y editorial que hace justicia al trabajo artesanal; por otro, una **plataforma interna de gestión de stock (CMS a medida)** diseñada para que la marca pueda administrar su inventario en tiempo real sin depender de terceros ni conocimientos técnicos.

---

## 2. The Challenge (El Problema)

Antes de este proyecto, Gypsy operaba de manera exclusiva a través de Instagram. A medida que el volumen de piezas y consultas creció, este modelo presentó cuellos de botella críticos:

- **Fricción en la experiencia de compra:** Los clientes no tenían un lugar centralizado y ordenado para ver qué piezas estaban realmente disponibles, sus materiales o sus precios actualizados sin tener que enviar mensajes directos y esperar respuesta.
- **Ineficiencia operativa:** Al tratarse de joyería artesanal con stock limitado o piezas únicas, la disponibilidad cambia constantemente. Crear un sitio web estático tradicional habría sido contraproducente, ya que obligaría al dueño de la marca a depender de un desarrollador para cada cambio de precio, baja de stock o carga de nuevas colecciones.
- **Identidad visual diluida:** El feed de una red social limita la narrativa visual y el carácter orgánico y curado que requieren las piezas trabajadas en metal.

---

## 3. The Solution (La Solución)

Para resolver tanto la exhibición como la operatividad diaria, se diseñó una **arquitectura desacoplada pero sincronizada**:

1. **Catálogo Público:** Una interfaz limpia, minimalista y enfocada en la fotografía de producto, construida con tecnologías web nativas para garantizar tiempos de carga instantáneos en dispositivos móviles (de donde proviene el mayor tráfico desde redes sociales).
2. **Backoffice / Panel de Administración Privado:** Una Single Page Application (SPA) en React que funciona como centro de control. Permite crear, editar, pausar o eliminar productos, actualizar precios y subir fotografías directamente a la nube. Cada acción impacta de manera inmediata en la base de datos y se refleja al instante en el catálogo público.

---

## 4. Tech Stack & Architecture (Arquitectura Técnica)

La elección tecnológica respondió a una premisa clara: **máxima velocidad para el usuario final y máxima comodidad de gestión para el administrador**.

| Capa                    | Tecnologías                          | Justificación Técnica                                                                                                                                                                 |
| :---------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend Público**    | HTML5, Vanilla CSS, Vanilla JS       | Sin el peso de frameworks pesados en el cliente público, logrando un rendimiento óptimo, SEO limpio y control total sobre el layout editorial y animaciones sutiles.                  |
| **Admin Panel (CMS)**   | React.js, Vite                       | Provee una experiencia de usuario fluida y reactiva para el administrador al gestionar formularios complejos, estados de carga, filtros de inventario y previsualización de imágenes. |
| **Backend & API**       | Node.js, Express (Vercel Serverless) | Arquitectura serverless que escala bajo demanda y elimina costos de mantenimiento de servidores dedicados, exponiendo endpoints REST seguros para el catálogo y el admin.             |
| **Base de Datos & ORM** | PostgreSQL, Prisma ORM               | Base de datos relacional robusta para estructurar productos, categorías y estados de stock. Prisma garantiza consultas tipadas, seguras y migraciones limpias.                        |
| **Storage & Deploy**    | Vercel Blob, Vercel CI/CD            | Almacenamiento en la nube optimizado para la entrega rápida de fotografías de alta resolución de las joyas, integrado al flujo de despliegue continuo.                                |

---

## 5. Design & UX Process (Diseño y Experiencia)

El diseño se abordó desde dos perspectivas complementarias:

### El Catálogo: Estética Editorial y Orgánica

La joyería en bronce, cobre y alpaca tiene una calidez y una textura que una plantilla genérica de e-commerce suele arruinar. Se optó por un **diseño editorial minimalista**:

- **Jerarquía visual:** Uso de espacios en blanco (whitespace) generosos y grillas limpias para que los tonos cálidos del bronce y el cobre sean el centro de atención.
- **Tipografía y Tono:** Combinación tipográfica que equilibra el carácter artesanal/de autor con una lectura moderna y clara de especificaciones y precios.
- **Navegación sin fricciones:** Filtrado intuitivo por tipo de pieza o material, pensado para usuarios que navegan desde el celular.

### El Panel Admin: Usabilidad Funcional

Para el dueño de la marca, la prioridad fue reducir la carga cognitiva:

- Interfaz directa y sin distracciones, donde dar de alta una joya nueva o cambiar el estado de "Disponible" a "Sin stock" toma apenas un par de clics desde la computadora o el teléfono.

---

## 6. Key Features (Características Principales)

- **Sincronización en Tiempo Real:** Conexión directa entre el panel de React, la API en Node/Express y PostgreSQL para que ningún cliente vea un producto agotado como disponible.
- **Gestión Multimedia Integrada:** Carga directa de imágenes desde el panel administrativo hacia **Vercel Blob**, optimizando el almacenamiento sin ensuciar el repositorio ni requerir edición previa externa.
- **Arquitectura Híbrida Eficiente:** Separación inteligente de responsabilidades entre un frontend público ligero (Vanilla) y un entorno administrativo potente (React + Vite).
- **Modelado de Datos con Prisma:** Esquema estructurado para soportar atributos específicos de joyería (materiales, colecciones, estado de disponibilidad, precios e imágenes asociadas).

---

## 7. Challenges & Learnings (Desafíos y Aprendizajes)

- **Integración de entornos en Serverless:** Uno de los principales retos técnicos fue unificar bajo un mismo flujo de despliegue en Vercel el sitio público en Vanilla JS, la aplicación en React del administrador y las Serverless Functions de Express conectadas a Prisma. Estructurar correctamente el ruteo y los builds permitió que todo el sistema conviva sin fricciones.
- **Manejo de archivos binarios (Imágenes):** Implementar la subida de fotografías desde el panel administrativo hacia Vercel Blob requirió diseñar un flujo limpio entre cliente y servidor para validar formatos, almacenar la URL resultante en PostgreSQL y mantener tiempos de respuesta rápidos.

---

## 8. Results & Impact (Impacto del Proyecto)

- **Autonomía total para el cliente:** La dueña de Gypsy pasó de gestionar consultas manuales por DM a administrar su propio catálogo digital en minutos, sin depender de soporte técnico para actualizar su vidriera.
- **Profesionalización de la marca:** El catálogo elevó la percepción de valor de las piezas artesanales, brindando un canal oficial, rápido y confiable que complementa y potencia el tráfico proveniente de Instagram.
