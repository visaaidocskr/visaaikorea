// Moved to app/apply/TravelBookingsStep.tsx — this step is no longer
// Japan-only (it's now shared by all four destinations: Japan, Taiwan,
// Singapore, Spain), so it lives at the top level of app/apply now. This
// file is kept as a re-export only because files in the workspace folder
// can't be deleted without asking the user first; nothing new should be
// added here.
export { TravelBookingsStep } from "@/app/apply/TravelBookingsStep";
