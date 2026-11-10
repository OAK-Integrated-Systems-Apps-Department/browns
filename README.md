# Browns Field Operations Management System – prototype (DEMO DATA, simulated SAP/HRIS)

    npm install && npm run dev      # then open the printed URL

- Web console: `#/login` → pick any of 8 roles (switch roles from the avatar menu).
- Mobile app: `#/mobile` (phone frame, own role picker). `#/studio` shows mobile + web side by side on one shared data store.
- Data persists in localStorage; "Reset demo data" is in the avatar menu / System Settings.
- Stack used: React + TypeScript + Vite + Bootstrap 5.3 (+ Recharts). Backend (Laravel/Inertia/MySQL) and Flutter are NOT built; the single store in `src/lib/store.ts`
  (workflow/approval/integration/sync engine) is the seam to replace with Laravel APIs.
- All SAP/HRIS integration, GPS and camera are simulated and labelled as such.
