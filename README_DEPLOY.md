# KATE — Cloudflare final package

This package contains the corrected portfolio frontend, the existing full admin UI, and a Cloudflare Worker API backed by D1 + R2.

## What is included
- Fixed/sticky KATE header.
- Hero starts higher; no large empty top block.
- Cursor ink/smudge canvas effect with difference-blended typography.
- Hero → Selected Work transition with visible geometric square sweep.
- Separate Selected Work project zone after Hero.
- Project shapes: rectangle, arch, oval, soft rounded; flower/scalloped can be added from admin data.
- Case studies with ordered images and captions.
- Admin for site content, projects, photos, About, Services, Contacts, navigation, visibility and publishing.
- D1 persistence, 20 backups, R2 image uploads.

## Cloudflare bindings
Create one D1 database named `kate-portfolio` and one R2 bucket named `kate-portfolio-media`, then put the D1 database ID into `wrangler.toml`. Set `ADMIN_PASSWORD` and a long random `SESSION_SECRET` before deploying.

Run the included migration `migrations/0001_init.sql` once. The first `/api/content` request seeds the database from `default-content.json`.
