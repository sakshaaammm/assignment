# 🧠 Apify Actor Manager – Full Stack Web App

A full-stack web application that lets users **authenticate with their Apify API key**, **browse and run their actors**, **generate dynamic forms** based on input schemas, and **view execution results** – all in a smooth, responsive UI.

🔗 **Live Site**: [https://velvety-brigadeiros-99b798.netlify.app/](https://velvety-brigadeiros-99b798.netlify.app/)

---

## 🚀 Features

### ✅ Authentication & Actor Management
- Securely enter and validate your **Apify API key**
- Browse all your published and private actors via a dropdown
- Manage token in React state (no storage or exposure)

### ✅ Dynamic Form Generation
- Fetch each actor's **JSON input schema** dynamically
- Render input forms using [`@rjsf/core`](https://github.com/rjsf-team/react-jsonschema-form)
- Supports advanced fields like arrays, booleans, objects, and nested structures

### ✅ Actor Execution & Results
- Submit form data to run the selected actor
- Show loading indicators and execution status (e.g., `RUNNING`, `SUCCEEDED`, `FAILED`)
- Fetch and display **dataset results** in:
  - Formatted JSON
  - Structured, responsive table

### ✅ UI/UX Highlights
- Fully responsive design with **Tailwind CSS**
- Toasts and modals for feedback (success, errors, loading)
- Graceful handling of all edge cases:
  - Empty actors
  - Invalid tokens
  - Run failures

---

## 🛠️ Tech Stack

### Frontend
- React + Vite
- Tailwind CSS
- @rjsf/core (for dynamic JSON Schema forms)
- React Toastify (for notifications)

### Backend
- Node.js
- Express.js
- Axios (for Apify API calls)
- CORS (to enable frontend-backend communication)
- dotenv (for environment variables)

---

## 📦 API Integration – Apify

All backend routes interact with Apify's [REST API](https://docs.apify.com/api/v2/):

| Action                | Apify Endpoint |
|----------------------|----------------|
| List user’s actors   | `/v2/acts` |
| Get actor schema     | `/v2/acts/{actorId}/input-schema` |
| Run an actor         | `/v2/acts/{actorId}/runs` |
| Check run status     | `/v2/actor-runs/{runId}` |
| Get dataset results  | `/v2/datasets/{datasetId}/items` |

Authentication is handled via:
- `Authorization: Bearer <API_TOKEN>` (preferred)
- or `?token=<API_TOKEN>` query parameter

---

## 📁 Folder Structure

