# Payer HS Dashboard

This project is a web application designed to provide a comprehensive dashboard for hospital and healthcare network analytics. It features a React-based frontend and a FastAPI backend.

## Overview

The Payer HS Dashboard offers a detailed view of various hospital metrics, including:
- Hospital profiles and certifications
- Bed capacity and utilization
- Doctor and nurse staffing ratios
- Equipment and infrastructure details
- Financial profiles and risk scores
- Geographical network coverage

The application is structured as a monorepo with a `frontend` directory for the React application and a `backend` directory for the FastAPI server.

## Tech Stack

### Frontend
- **React**: A JavaScript library for building user interfaces.
- **Vite**: A fast build tool and development server for modern web projects.
- **Chart.js**: For creating interactive charts and graphs.
- **Leaflet**: For interactive maps.
- **Bootstrap**: For styling and UI components.
- **Axios**: For making HTTP requests to the backend.

### Backend
- **FastAPI**: A modern, fast (high-performance) web framework for building APIs with Python.
- **Uvicorn**: An ASGI server for running the FastAPI application.

## Project Structure

```
PAYER_HS_DASH/
├── backend/
│   ├── data/                 # JSON data files
│   ├── main.py               # FastAPI application
│   └── requirements.txt      # Python dependencies
└── frontend/
    ├── public/               # Static assets
    ├── src/                  # React source code
    │   ├── components/       # Reusable React components
    │   ├── pages/            # Page components
    │   ├── services/         # API service modules
    │   └── ...
    ├── package.json          # Frontend dependencies
    └── vite.config.js        # Vite configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [Python](https://www.python.org/) (v3.8 or later)
- `pip` and `venv` for Python package management

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # On Windows
    # source venv/bin/activate  # On macOS/Linux
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend server will be running at `http://127.0.0.1:8000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install the npm dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```
    The frontend application will be running at `http://localhost:5173` (or another port if 5173 is in use).

## API Endpoints

The backend provides several API endpoints to serve the hospital data. Here are a few examples:

-   `GET /hospitals`: Get a list of all hospitals.
-   `GET /hospitals/{hospital_id}`: Get detailed information for a specific hospital.
-   `GET /hospital-metrics`: Get key performance metrics for all hospitals.
-   `GET /network-averages`: Get network-wide average metrics.

For a full list of endpoints, please refer to the FastAPI documentation available at `http://127.0.0.1:8000/docs` when the backend server is running.

## Data

The application uses a set of JSON files located in the `backend/data/` directory as its data source. These files contain information about hospitals, doctors, equipment, and more.
