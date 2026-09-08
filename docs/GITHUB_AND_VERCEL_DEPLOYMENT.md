# Step-by-Step Guide: GitHub & Vercel Deployment

This guide outlines the exact commands and configuration steps to push **Denno Career OS** to GitHub and deploy the frontend to Vercel.

---

## Part 1: Pushing to GitHub

### 1. Initialize Git Repository
Open your terminal in the project root (`g:\Denno1\denno-project`) and run:

```bash
git init
```

### 2. Stage Files and Commit
```bash
git add .
git commit -m "feat: production deployment ready full-stack build"
```

### 3. Create a Remote Repository on GitHub
1. Go to [GitHub — Create New Repository](https://github.com/new).
2. Repository Name: `denno-project` (or your preferred name).
3. Select **Public** or **Private**.
4. **Important**: Do *not* check "Add a README file" or ".gitignore" templates (they already exist in your project).
5. Click **Create repository**.

### 4. Link Remote and Push
Copy the repository URL from GitHub and execute:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/denno-project.git
git push -u origin main
```

---

## Part 2: Deploying Frontend to Vercel

### Step 1: Connect Vercel to GitHub
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your `denno-project` repository.

### Step 2: Configure Project Settings
- **Framework Preset**: Select `Vite`.
- **Root Directory**: Set to `frontend` (Click *Edit* and select the `frontend` folder).
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Add Environment Variables
In the **Environment Variables** section on Vercel, add:

| Key | Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://your-backend-api.com/api/v1` | URL of your production FastAPI backend |

### Step 4: Deploy
Click **Deploy**. Vercel will build the frontend and assign a live production URL (e.g. `https://denno-project.vercel.app`).

---

## Part 3: Connecting Frontend (Vercel) to Backend (Render / Railway / VPS)

Since the frontend is hosted on Vercel (`https://denno-project.vercel.app`), update your backend `.env` on your backend server:

```ini
FRONTEND_ORIGIN=https://denno-project.vercel.app
```

This ensures CORS allows credentials and authorization headers between Vercel and your API.
