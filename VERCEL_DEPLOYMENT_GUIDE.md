# Vercel Deployment Guide for Egg Management System

## 1. Project Overview

The `egg-management-system` is a web application built with Node.js (Express) for the backend and a static frontend (HTML, CSS, JavaScript). It uses MongoDB as its database and includes user authentication with JWT. The application manages egg-related data across multiple farms.

## 2. Vercel Deployment Strategy

Vercel is an excellent platform for deploying both static frontends and serverless functions. For this project, we will leverage Vercel's capabilities to:

*   **Host the Static Frontend**: All HTML, CSS, and JavaScript files located in the `public` and `assets` directories will be served as static assets.
*   **Deploy the Node.js Backend as a Serverless Function**: The `server.js` file, which contains the Express application, will be deployed as a Serverless Function. Vercel automatically detects Node.js projects and can convert them into serverless functions.

To achieve this, a `vercel.json` configuration file has been created in the root of your project. This file instructs Vercel on how to build and route requests for your application.

### `vercel.json` Configuration

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/server.js" },
    { "source": "/register", "destination": "/server.js" },
    { "source": "/login", "destination": "/server.js" },
    { "source": "/verify", "destination": "/server.js" },
    { "source": "/profile", "destination": "/server.js" },
    { "source": "/users/(.*)", "destination": "/server.js" },
    { "source": "/farm1(.*)", "destination": "/server.js" },
    { "source": "/farm2(.*)", "destination": "/server.js" },
    { "source": "/farm3(.*)", "destination": "/server.js" },
    { "source": "/farm4(.*)", "destination": "/server.js" },
    { "source": "/settings", "destination": "/server.js" }
  ],
  "cleanUrls": true
}
```

**Explanation of `vercel.json`:**

*   `"version": 2`: Specifies the Vercel configuration version.
*   `"rewrites"`: This section is crucial for directing API requests to your `server.js` file. When a request comes in for paths like `/register`, `/login`, or any path starting with `/api/`, Vercel will rewrite that request to `/server.js`. This allows your Node.js backend to handle these routes. The `(.*)` is a wildcard that captures any path segments following the base path.
*   `"cleanUrls": true`: This option removes `.html` extensions from URLs, making them cleaner (e.g., `example.com/index` instead of `example.com/index.html`).

**Important Note on Static Files:**

Previously, your `server.js` was responsible for serving static files from `public` and `assets` directories. With Vercel, the platform itself is highly optimized for serving static assets. By default, Vercel will automatically detect and serve static files from your project's root and subdirectories. The `rewrites` configuration ensures that only API routes are directed to `server.js`, while static files are served directly by Vercel's CDN.

**API URL Correction:**

All hardcoded `http://localhost:3000` URLs in your frontend JavaScript and HTML files have been removed. This ensures that your frontend will make relative API calls, which will automatically be directed to your deployed backend on Vercel.

## 3. Environment Variables

Your `server.js` uses environment variables for `MONGODB_URI` (for connecting to MongoDB) and `JWT_SECRET` (for JWT token signing). These **must** be configured on Vercel for your backend to function correctly.

*   **`MONGODB_URI`**: The connection string for your MongoDB database. This should be obtained from your MongoDB provider (e.g., MongoDB Atlas).
*   **`JWT_SECRET`**: A strong, random string used to sign your JSON Web Tokens. You can generate one using a tool or simply create a long, complex string.

## 4. Deployment Steps to Vercel

Follow these steps to deploy your `egg-management-system` to Vercel:

### Step 1: Push Your Code to GitHub

Ensure your `egg-management-system` repository, including the newly created `vercel.json` file and the updated frontend files (with `localhost` URLs removed), is pushed to your GitHub account.

### Step 2: Import Your Project to Vercel

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click on **
`Add New...` (or `New Project`) and then `Import Git Repository`.
3.  Select your `ballenbaxtiar/egg-management-system` repository from the list. If you don't see it, you might need to configure your GitHub integration or refresh the list.
4.  Vercel will automatically detect that it's a Node.js project. It should suggest the following settings:
    *   **Root Directory**: `./` (or `egg-management-system/` if you imported the entire monorepo, but in this case, it should be the root of the cloned repository)
    *   **Build Command**: `npm run build` (or similar, but for this project, Vercel will likely use `npm install` and then run `server.js` as a serverless function)
    *   **Output Directory**: (Leave as default, Vercel handles this for serverless functions and static assets)
5.  Before deploying, go to the **Environment Variables** section and add the following:
    *   `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://user:password@cluster.mongodb.net/mydatabase?retryWrites=true&w=majority`)
    *   `JWT_SECRET`: A strong, random string (e.g., `supersecretjwtkeythatisverylongandrandom`)
6.  Click **Deploy**.

### Step 3: Verify Deployment

After deployment, Vercel will provide you with a URL. Navigate to this URL and test the application:

*   **Frontend**: Ensure all static pages (e.g., `index.html`, `login.html`) load correctly.
*   **Backend**: Test the login and registration functionalities. If successful, your backend is working as a serverless function.
*   **Data Operations**: Verify that you can add, view, and delete farm data, and that settings are saved.

## 5. Post-Deployment Considerations

*   **Custom Domains**: You can configure custom domains for your Vercel project through the Vercel dashboard.
*   **Monitoring**: Vercel provides built-in analytics and logging for your deployments, which can help you monitor the health and performance of your application.
*   **Continuous Deployment**: Vercel automatically redeploys your project every time you push changes to your connected Git repository, ensuring your live application is always up-to-date.

This guide should help you successfully deploy your `egg-management-system` to Vercel. If you encounter any issues, refer to the Vercel documentation or community support.
