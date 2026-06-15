# Free Hosting Setup

The app is prepared for GitHub Pages and Netlify. It still saves journal edits
locally in the browser. The Supabase schema is prepared, but cloud sync is not
connected yet so existing data cannot be accidentally overwritten.

## Before publishing

1. Open the journal locally.
2. Choose **... > Download backup**.
3. Keep the downloaded JSON file somewhere outside the project folder.

## GitHub and GitHub Pages

1. Install Git when Windows asks for administrator approval.
2. Create a free GitHub account at <https://github.com/signup>.
3. Create a new repository named `archive-of-obsessions`.
4. Choose **Public** if using GitHub Pages on the free plan.
5. Do not add a README, `.gitignore`, or licence when creating it.
6. In this project folder, run:

   ```powershell
   git init
   git branch -M main
   git add .
   git commit -m "Publish Archive of Obsessions"
   git remote add origin https://github.com/YOUR-GITHUB-NAME/archive-of-obsessions.git
   git push -u origin main
   ```

7. In the repository, open **Settings > Pages**.
8. Under **Build and deployment**, choose **GitHub Actions**.
9. The site will appear at:
   `https://YOUR-GITHUB-NAME.github.io/archive-of-obsessions/`

## Netlify

1. Create a free account at <https://app.netlify.com/signup>.
2. Choose **Add new project > Import an existing project > GitHub**.
3. Select `archive-of-obsessions`.
4. Leave the build command empty.
5. Set the publish directory to `.` and choose **Deploy**.

Every future push to GitHub will update both GitHub Pages and Netlify.

## Supabase

1. Create a free account at <https://supabase.com/dashboard>.
2. Choose **New project**, create a strong database password, and select a nearby region.
3. Open **SQL Editor > New query**.
4. Paste and run the contents of `supabase/schema.sql`.
5. Open **Authentication > Providers > Email** and keep Email enabled.
6. Do not put the database password or Supabase service-role key in this repository.

## Connect manual cloud backup

1. In Supabase, open **Project Settings > API Keys**.
2. Copy the publishable key. The older `anon` key also works.
3. Open `web-app/supabase-config.js`.
4. Replace `PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE` with the copied key.
5. Commit and push the change to GitHub.
6. In the journal, use **... > Cloud account** to create or sign in to your account.
7. Use **Back up to Supabase** and **Restore from Supabase** manually.

The publishable/anon key is designed for browser applications. Never use the
database password or service-role key in this file.
