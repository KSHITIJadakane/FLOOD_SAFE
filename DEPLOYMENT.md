# FloodSafe — Cloud & Docker Deployment Guide
**Comprehensive Deployment Blueprint: Render (Unified Docker), Vercel + Render, and Docker Compose**

---

## 🚀 Recommended: Deploy Whole Project on Render with Docker

Render allows deploying a multi-stage Docker container on its **Free Tier**. With this setup:
* **One Single Service**: Both React frontend and FastAPI backend run in the same container.
* **Single URL**: Going to `https://floodsafe.onrender.com` opens the full React UI directly.
* **Zero CORS**: All `/api/v1` calls are on the exact same domain.
* **100% Free**: Stays within Render's 1 free web service limit.

```
                      +------------------------------------------------------+
                      |             Render Free Web Service                  |
                      |          https://floodsafe.onrender.com              |
                      |                                                      |
Browser / Evaluator   |  [ / ]             -> React 18 Leaflet GIS Dashboard |
  ----------------->  |  [ /assets/* ]     -> Static CSS/JS Bundles          |
                      |  [ /api/v1/* ]     -> FastAPI REST Endpoints         |
                      |  [ /docs ]         -> OpenAPI / Swagger UI           |
                      |  [ /health ]       -> System Health Check            |
                      +------------------------------------------------------+
                                                 ^
                                                 | Real-time Telemetry
                      +------------------------------------------------------+
                      |      Wokwi Cyber-Physical Hardware Simulation        |
                      |    https://wokwi.com/projects/477569569661872129    |
                      |      ESP32 + HC-SR04 Ultrasonic In-Situ Station      |
                      +------------------------------------------------------+
```

---

### Step-by-Step Instructions: Deploy on Render via Docker

#### Step 1: Open Render Dashboard
1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and log in with your GitHub account.

#### Step 2: Create a New Web Service
1. Click the blue **"New +"** button at top right and select **"Web Service"**.
2. Under "Connect a repository", search for and select: **`SumedhXy/Flood_safe`**.

#### Step 3: Configure Settings
Fill in the following fields:
* **Name**: `floodsafe` (or `floodsafe-demo`)
* **Region**: `Oregon (US West)` (or closest region)
* **Branch**: `main`
* **Root Directory**: `.` (leave empty or enter `.`)
* **Language / Environment**: Select **`Docker`**
  *(Render will automatically use the root [`Dockerfile`](file:///c:/Users/sumed/Downloads/floodsafe/Dockerfile))*
* **Instance Type**: Select **`Free`**

#### Step 4: Health Check (Optional but Recommended)
* Expand **"Advanced"**.
* Under **Health Check Path**, enter: `/health`

#### Step 5: Click "Create Web Service"
* Render will pull the repository, run the multi-stage Docker build (building the React app with Node 20 and installing FastAPI with Python 3.11), and start the service.
* In ~2 to 3 minutes, the status will turn to **"Live"**!

#### Step 6: Test Your Live App
* Open your public URL: `https://<YOUR-RENDER-NAME>.onrender.com`
* The full GIS dark-matter dashboard loads immediately!
* Test `/docs` for API documentation.
* Test `/health` for the system status payload.

---

## Alternative: Local Multi-Container Deployment via Docker Compose

If you have Docker Desktop installed locally, you can start the frontend, backend, and PostGIS database with a single command:

```powershell
docker compose up --build
```

* **Frontend**: `http://localhost:3000` (Nginx serving React)
* **Backend API**: `http://localhost:8000` (FastAPI)
* **API Documentation**: `http://localhost:8000/docs`
* **PostGIS**: `localhost:5432`

To shut down:
```powershell
docker compose down
```

---

## Connecting Live Wokwi Hardware Simulation to Render

Once your Render app is live, your physical ESP32 Wokwi simulation can stream sensor telemetry directly into the cloud:

1. Open your live Wokwi project: **[wokwi.com/projects/477569569661872129](https://wokwi.com/projects/477569569661872129)**
2. In `sketch.ino`, line 15:
   ```cpp
   // Update from local IP to your live Render URL:
   const char* backendUrl = "https://<YOUR-RENDER-NAME>.onrender.com/api/v1/iot-sensors/IOT-WARD3-01/telemetry";
   ```
3. Whenever water overtops $0.80\text{m}$, the simulation triggers an audible buzzer and streams live alerts straight into your cloud dashboard!
