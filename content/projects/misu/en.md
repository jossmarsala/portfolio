---
role: UX/UI Designer & Full-Stack Developer (solo project)
tags:
  - UX/UI Design
  - Full-Stack Development
  - AI Planning
metrics: []
awards: []
---

# Summary

[Misu](https://misu-os.vercel.app) is a productivity system designed to support people with attention difficulties: based on the available energy level, the system adjusts its appearance and suggests suitable tasks, integrating organization and focus tools into a single space.

# Gallery

How do you organize yourself when your energy and ability to focus aren't the same every day? Many productivity tools start from a static baseline. MISU was created to propose a new way of organizing: a personal system that adapts to the user. Based on the available energy level, it adjusts the interface and task recommendations, while bringing together planning and study tools such as a Pomodoro timer, AI-assisted weekly planning, ambient music, and more, in a modular space.

# Features

## 01. Task management

Register and track tasks through categories, required energy level, and due dates. It lets you update their status and mark activities as completed.

## 02. Intelligent planning

An interactive weekly planner to distribute and rearrange tasks via drag & drop. It incorporates the Gemini API to generate automatic planning suggestions, considering duration, due dates, and available energy.

## 03. Modular widgets

A customizable workspace with draggable widgets that integrate tools such as a calendar, Pomodoro timer, and ambient music adapted to the energy level.

## 04. Focus environment

A focus mode that simplifies the interface, reduces visual stimuli, and removes secondary elements to minimize distractions and make it easier to concentrate.

# Technical development

MISU was developed with React on a modular architecture. Its recommendation engine cross-references energy level with due dates, and the interface responds to the same state: it adjusts the visual palette, stimuli, and information density.

The weekly planner incorporates Google Gemini API to split large tasks into blocks and order the daily workload via drag & drop. The sound experience is handled with Web Audio API, which generates environments such as white noise and adapts interaction sounds to the available energy.

Persistence follows a local-first approach: localStorage and Supabase work together to preserve data and sync it, even offline. The architecture separates logic, interface, and internationalization, with support for Spanish, English, and Italian.

# Impact

MISU was born from turning a personal everyday difficulty into an opportunity to explore new ways of designing technology. The project allowed me to go through the full cycle of a digital product: from identifying a need and designing the software that solves it to implementing a functional application.

Today MISU has active users and is available in Spanish, English, and Italian.
