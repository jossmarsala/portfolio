---
role: Full-Stack Developer & UI/UX Designer
tags:
  - Full-Stack Dev
  - UI/UX Design
  - Custom CMS
  - E-Commerce
awards: []
---

# Summary

Design and development of a digital ecosystem for [Gypsy](https://gypsy-joyas.vercel.app/), an artisan jewelry brand. A product catalog and a custom administration panel were created to centralize inventory management and synchronize stock in real time.

# Gallery

The brand initially operated only through Instagram, so the main technical challenge was to create an official digital catalog that was both scalable and easy for the brand owner to manage. Building a static website would have made updating product availability, prices, and images inefficient. To solve this, the project expanded to include a custom internal administration panel connected directly to a database, creating an autonomous system where updates are reflected instantly in the public catalog.

# Features

## 01. Real-time synchronization

Direct connection between the React panel, the Node/Express API, and PostgreSQL so that no customer sees a sold-out piece as available. Every status change is reflected instantly in the public catalog.

## 02. Integrated media management

Direct image uploads from the admin panel to Vercel Blob, optimizing storage without bloating the repository or requiring prior external editing.

## 03. Efficient hybrid architecture

A smart separation of responsibilities between a lightweight Vanilla JS public frontend — fast and with clean SEO — and a powerful React + Vite administrative environment.

## 04. Data modeling with Prisma

A structured schema to support jewelry-specific attributes: materials, collections, availability status, prices, and associated images.
