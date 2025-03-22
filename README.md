# IDMS Infotech Portal - GitHub Pages Version

This is a static version of the IDMS Infotech Portal for AI Hackathon Problem 2, adapted for GitHub Pages hosting.

## Repository

GitHub: [gourishnaikk/AI_28_MasterBaiters_PS02](https://github.com/gourishnaikk/AI_28_MasterBaiters_PS02)

## Features

- React + TypeScript frontend with Tailwind CSS
- GitHub Pages static hosting
- Mock authentication for demonstration
- Responsive modern UI

## Demo Login

Use the following credentials to access the demo:
- Email: demo@example.com
- Password: demo123

## Deployment Steps

### Manual Deployment

1. Install dependencies:
   ```
   npm install
   ```

2. Build the project:
   ```
   npm run build
   ```

3. Deploy to GitHub Pages:
   ```
   npm run deploy
   ```

### Using GitHub Actions

This project includes a GitHub Actions workflow that will automatically deploy the application to GitHub Pages when you push to the main branch.

1. Enable GitHub Pages in your repository settings
2. Set the GitHub Pages source to the "gh-pages" branch
3. Push changes to the main branch to trigger automatic deployment

## Local Development

To run the project locally:

```
npm install
npm run dev
```

The application will be available at http://localhost:5000.

## GitHub Pages Adjustments

This version has been modified from the original to work with GitHub Pages:

1. Uses hash-based routing (wouter + custom hash history hook)
2. Implements mock authentication instead of server-based auth
3. Contains only the static frontend portion
4. Pre-configured build and deployment settings for GitHub Pages

## Team: MasterBaiters (AI_28)

This project is submitted for the AI Hackathon Problem 2.

## Credits

- UI components: shadcn/ui
- Icons: Lucide React
- Routing: Wouter
- Form handling: React Hook Form + Zod 