# Payer HS Dashboard

[![Mathi029's GitHub stats](https://github-readme-stats.vercel.app/api?username=Mathi029&show_icons=true&theme=radical)](https://github.com/anuraghazra/github-readme-stats)

<!-- Add your GIF here -->
<!-- <p align="center">
  <img src="assets/demo.gif" alt="Project Demo" width="800"/>
</p> -->

This project is a web application designed to provide a comprehensive dashboard for hospital and healthcare network analytics. It features a React-based frontend and a FastAPI backend.

## Features

- **Interactive Map View:** Visualize hospital locations and network coverage.
  <!-- <img src="assets/map-feature.gif" alt="Map Feature Demo" width="600"/> -->

- **Dynamic Data Dashboards:** Explore detailed metrics with interactive charts.
  <!-- <img src="assets/dashboard-feature.gif" alt="Dashboard Feature Demo" width="600"/> -->

- **Comprehensive Search:** Quickly find hospitals and specific data points.
  <!-- <img src="assets/search-feature.gif" alt="Search Feature Demo" width="600"/> -->

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

<p align="center">
  <a href="https://reactjs.org/" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original-wordmark.svg" alt="react" width="40" height="40"/>
  </a>
  <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
    <img src="https://www.vectorlogo.zone/logos/vitejs/vitejs-icon.svg" alt="vite" width="40" height="40"/>
  </a>
  <a href="https://www.chartjs.org" target="_blank" rel="noreferrer">
    <img src="https://www.chartjs.org/media/logo-title.svg" alt="chartjs" width="40" height="40"/>
  </a>
  <a href="https://leafletjs.com" target="_blank" rel="noreferrer">
    <img src="https://leafletjs.com/docs/images/logo.png" alt="leaflet" width="40" height="40"/>
  </a>
  <a href="https://getbootstrap.com" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/bootstrap/bootstrap-plain-wordmark.svg" alt="bootstrap" width="40" height="40"/>
  </a>
  <a href="https://fastapi.tiangolo.com/" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/fastapi/fastapi-original.svg" alt="fastapi" width="40" height="40"/>
  </a>
  <a href="https://www.python.org" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.svg" alt="python" width="40" height="40"/>
  </a>
</p>

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

## GitHub Activity

<p align="center">
  <a href="https://github.com/ashutosh00710/github-readme-activity-graph">
    <img alt="Mathi029's Activity Graph" src="https://github-readme-activity-graph.vercel.app/graph?username=Mathi029&bg_color=0d1117&color=ffffff&line=007acc&point=ffffff&area=true&hide_border=true" />
  </a>
</p>

## Contributors

A huge thank you to all the contributors who have helped build and improve this project!

<a href="https://github.com/Mathi029/Hospital_Payer_dashboard/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Mathi029/Hospital_Payer_dashboard" />
</a>
