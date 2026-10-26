# Glassfolio Studio

# Role & Objective
You are an expert full-stack web developer and UI/UX engineer. Build a hyper-customizable, feature-rich personal portfolio and dynamic web ecosystem inspired by modern glassmorphism UI design (featuring dark, immersive animated backgrounds, frosted glass/acrylic central card layouts, status badges, custom widgets, and media players). 

The entire site must be completely database-driven and manageable via a powerful, secure Admin Panel so that zero code changes are required to update content, structure, or links.

---

# Core Architecture & Tech Stack Recommendations
- Frontend: React.js / Next.js (App Router) or Vue.js with Tailwind CSS for styling and Framer Motion for smooth transitions/animations.
- Backend/Database: Node.js (Express) or Next.js API Routes connected to MongoDB or PostgreSQL (with Prisma ORM) to handle dynamic schemas, media storage, and admin states.
- Authentication: Secure JWT-based authentication for the Admin Panel (`/admin`).

---

# Key Functional Requirements

## 1. Public Portfolio Frontend (The "100x" Expanded Vision)
- Aesthetic: Immersive dark mode, customizable background (support for animated canvas particles, video backgrounds, or high-res parallax mountain/night skies with toggleable audio/ambient sound player).
- Central Glassmorphism Card Layout: Responsive card container with backdrop blur (`backdrop-filter: blur-2xl`), glowing borders, and smooth elevation.
- Profile Header: Dynamic avatar with status indicator rings (Online, Coding, Gaming, Away, Custom), display name, verified badges, custom tags/roles (e.g., Founder, Developer, Artist), local time clock, and location widget.
- Navigation Tabs: Dynamic tab switching (e.g., About, Skills, Projects, Gallery, Timeline, Links, Guestbook).
- Rich Sections & Widgets (All dynamically toggleable/reorderable via Admin):
  - Bio & Quote Rotator: Interactive or fading personal quotes.
  - Social & Custom Links Grid: Support for infinite links (Socials, GitHub, Discord, Spotify, custom URL shortcuts with auto-favicon fetching).
  - Expanded Info Cards Grid: Configurable cards for Goals, Ambition, Achievements, Favorite Things, Fun Facts, Memories, and Custom Key-Value pairs.
  - Media Gallery: Masonry or grid-based photo/artwork gallery with lightbox zoom, categories, and captions.
  - Project Showcase: Interactive cards with tags, live links, repository links, and detailed modal views.
  - Interactive Music/Audio Player: Bottom-docked persistent audio player supporting track info, progress bar, play/pause, and volume control.

## 2. Fully Customizable Admin Panel (`/admin`)
Build a comprehensive dashboard protected by secure login where the owner can manage every single aspect of the site without touching code:
- Global Theme & Layout Customization:
  - Toggle background types (video, particle animation, static image), accent colors, border glows, font styles, and glass transparency levels.
  - Enable/disable entire sections (e.g., hide/show the Gallery, switch tabs, rearrange card grids via drag-and-drop or order indexing).
- Content Management System (CMS):
  - Profile Manager: Edit name, titles, status message, location, time zone, and avatar/banner images.
  - Card & Section Builder: Dynamically create, edit, reorder, or delete custom grid cards (e.g., adding a new "Tech Stack" or "Milestones" card with custom titles and text).
  - Link Manager: Add any custom link with a title, URL, custom icon selection (Lucide/FontAwesome or auto-icon), and visibility toggles.
  - Project & Gallery Manager: Upload images, write descriptions, organize tags, and publish/unpublish items instantly.
  - Media & Playlist Manager: Upload background music tracks, album art, and manage the persistent player queue.
- Analytics & Activity (Bonus): Simple view counter, recent visitor logs, or interactive guestbook moderation.

---

# Deliverables
1. Complete Project Structure & File Tree.
2. Database Schema (Prisma/Mongoose models for User, Profile, Cards, Links, Projects, Gallery, Settings).
3. Backend API Endpoints for CRUD operations on all dynamic elements and admin authentication.
4. Fully styled frontend components using Tailwind CSS and Framer Motion implementing the frosted-glass aesthetic.
5. Fully functional Admin Dashboard UI allowing real-time updates to the live site database.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2d6b8ca7-12bb-43fa-99b0-3cac204af77d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
