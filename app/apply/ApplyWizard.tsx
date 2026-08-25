"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  documentsForStatus,
  patronymicRule,
} from "@/lib/visa/config";
import type { VisaRuleset } from "@/lib/visa/ruleset";
import {
  getDestinationRule,
  getRecommendation,
  getCountryGuidance,
  travelStartWindow,
  toISO,
  vietnamStayEndISO,
  validateDates,
  japanRouteForRegion,
  KOREA_REGIONS,
  type DateValidation,
  type AppointmentInfo,
} from "@/lib/visa/destinations";
import {
  evaluateEligibility,
  stepsForOutcome,
  requiresApplication,
  type EligibilityResult,
} from "@/lib/visa/eligibility";
import {
  formatName,
  isValidEmail,
  containsHangul,
  hasNonLatinScript,
  isCompleteAddress,
} from "@/lib/visa/forms";
import { isSubmissionDateBlocked, type EmbassyClosure } from "@/lib/visa/japanEmbassy";
import {
  vietnamSubmissionDateBlock,
  isVietnamSubmissionDateBlocked,
} from "@/lib/visa/vietnamEvisa";
import type { ApplyFormData, CompanionInput } from "@/lib/visa/types";
import { saveApplication, submitApplication } from "@/app/apply/actions";
import { UploadField } from "@/app/apply/UploadField";
import { PassportScanPanel } from "@/app/apply/PassportScanPanel";
import { GuidanceModal } from "@/app/apply/GuidanceModal";
import { DatePicker } from "@/app/apply/DatePicker";
import {
  Input,
  Select,
  BooleanChoice,
  Textarea,
  ChoiceGroup,
  FIELD_ERROR_ATTR,
} from "@/app/apply/fields";
import { SupportContactCard } from "@/app/apply/japan/SupportContactCard";
import { PersonalStep } from "@/app/apply/japan/PersonalStep";
import { PassportStep } from "@/app/apply/japan/PassportStep";
import { KoreaStatusStep, employmentKind } from "@/app/apply/japan/KoreaStatusStep";
import { JapanTripStep } from "@/app/apply/japan/JapanTripStep";
import { TravelBookingsStep } from "@/app/apply/TravelBookingsStep";
import { PreviousVisitsStep } from "@/app/apply/japan/PreviousVisitsStep";
import { HostStep } from "@/app/apply/japan/HostStep";
import { BackgroundStep } from "@/app/apply/japan/BackgroundStep";
import { JapanGuidanceStep } from "@/app/apply/japan/JapanGuidanceStep";
import { SeoulChecklistModal } from "@/app/apply/japan/SeoulChecklistModal";
import {
  JapanReview,
  type ReviewSection,
  type SectionStatus,
} from "@/app/apply/japan/JapanReview";
import { TaiwanTripStep } from "@/app/apply/taiwan/TaiwanTripStep";
import { TaiwanBackgroundStep } from "@/app/apply/taiwan/TaiwanBackgroundStep";
import { TAIWAN_MARITAL_OPTIONS } from "@/app/apply/fields";
import { useLocale } from "@/app/components/LocaleProvider";
import { CountryAmbience, CountryBanner } from "@/app/apply/CountryAmbience";
import { SubmitSuccess } from "@/app/apply/SubmitSuccess";
import { ComingSoonModal } from "@/app/components/ComingSoonModal";
import { VISA_SUBMISSIONS_OPEN } from "@/lib/launch";
import { LeaveGuard } from "@/app/apply/LeaveGuard";

// Japan AND Taiwan use the same richer step sequence (Phase 2a/3: steps 1–4 +
// Documents + Guidance). Other destinations keep the generic stepsForOutcome()
// flow. Identity documents come right after Destination — the passport photo
// is scanned (MRZ auto-read) before the applicant types anything, so the name
// / passport number / dates below can be pre-filled instead of hand-typed.
// Personal → Guarantor/Trip used to be several separate steps; they're now
// one single "Application Details" page (still built from the same
// per-section components, just rendered together instead of gated one at a
// time).
// "Documents" (status-specific uploads, e.g. Enrollment Certificate) is no
// longer its own step — those uploads now render inline inside
// KoreaStatusStep, right next to the university/employer fields that make
// them relevant (see "Application Details" below).
// Vietnam's emergency-contact relationship options. Stored lowercase (matching
// the DB check values); shown capitalised in the dropdown.
const RELATIONSHIP_LABELS: Record<
  Exclude<ApplyFormData["vietnam_family_member_relationship"], "">,
  string
> = {
  father: "Father",
  mother: "Mother",
  brother: "Brother",
  sister: "Sister",
  other: "Other",
};

// One-tap destination chips (same setters as the select below them).
const DEST_FLAGS: Record<string, string> = {
  Japan: "🇯🇵",
  Taiwan: "🇹🇼",
  Singapore: "🇸🇬",
  Spain: "🇪🇸",
  Vietnam: "🇻🇳",
};

const RICH_APPLICATION_STEPS = [
  "Destination",
  "Identity Documents",
  "Application Details",
  "Background",
  "Review",
  "Guidance",
];

// Step names are identifiers used by the wizard logic. Keep them in English
// internally, and translate only what the applicant sees.
const STEP_LABEL_KEYS: Record<string, string> = {
  Destination: "apply.step.destination",
  Applicant: "apply.step.applicant",
  Companions: "apply.step.companions",
  Guidance: "apply.step.guidance",
  Result: "apply.step.result",
  "Identity Documents": "apply.step.identityDocuments",
  "Application Details": "apply.step.applicationDetails",
  Background: "apply.step.background",
  Review: "apply.step.review",
};

type Props = {
  applicationId: string;
  userId: string;
  initialForm: ApplyFormData;
  initialUploads: Record<string, string>;
  // Resolved server-side (DB overrides over code defaults) and passed down so
  // the engine selectors read live rules without the client fetching anything.
  ruleset: VisaRuleset;
  japanEmbassyClosures: EmbassyClosure[];
  // Optional step to open on, by name (e.g. "Applicant") — used for deep
  // links like "fix the document we flagged". Ignored if the name isn't part
  // of this flow's step list.
  initialStepName?: string;
};

export function ApplyWizard({
  applicationId,
  userId,
  initialForm,
  initialUploads,
  ruleset,
  japanEmbassyClosures,
  initialStepName,
}: Props) {
  const router = useRouter();
  const { t } = useLocale();
  // Resolved against the real step list below (which depends on eligibility);
  // this is just the requested index within the flow this destination uses.
  const [step, setStep] = useState(() => {
    if (!initialStepName) return 0;
    const flowSteps = RICH_APPLICATION_STEPS.includes(initialStepName)
      ? RICH_APPLICATION_STEPS
      : ["Destination", "Applicant", "Companions", "Guidance"];
    const idx = flowSteps.indexOf(initialStepName);
    return idx > 0 ? idx : 0;
  });
  const [form, setForm] = useState<ApplyFormData>(initialForm);
  const [uploads, setUploads] =
    useState<Record<string, string>>(initialUploads);
  const [consent, setConsent] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, startSaving] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null
  );

  // Guidance modal: opens only on first travel-date interaction (or the ⓘ button).
  const [modalOpen, setModalOpen] = useState(false);
  const seenGuidance = useRef<Set<string>>(new Set());

  // Japan document checklist: shown once, right after "Destination" is
  // confirmed (Korea province tells us the route — sticker/Busan or
  // eVisa/Seoul — immediately). The exact Korean visa status isn't known yet
  // at this point (that's collected in "Korea Status", a later step), so the
  // status-specific document (item 4) is described generically here rather
  // than named precisely.
  const [seoulChecklistOpen, setSeoulChecklistOpen] = useState(false);
  const seoulChecklistShown = useRef(false);

  function set<K extends keyof ApplyFormData>(key: K, value: ApplyFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function onUploaded(fileType: string, filename: string) {
    setUploads((prev) => {
      const next = { ...prev };
      if (filename) next[fileType] = filename;
      else delete next[fileType]; // removal
      return next;
    });
  }

  const cities = ruleset.cities[form.destination_country] ?? [];
  const pRule = patronymicRule(form.nationality, ruleset.patronymic);
  const fatherRequired = pRule === "required"; // Uzbekistan
  const rule = getDestinationRule(form.destination_country, ruleset.dateRules);
  const isJapan = form.destination_country === "Japan";
  const isTaiwan = form.destination_country === "Taiwan";
  // Vietnam is a plain e-Visa flow: no embassy appointment, no flight/hotel
  // booking proof up front (unlike Singapore/Spain), and a fixed one-month
  // stay whose end date is calculated, not chosen — see the effect below.
  const isVietnam = form.destination_country === "Vietnam";

  // Real-time field validity (used for both inline errors and gating).
  const emailValid = isValidEmail(form.client_email);
  const addressValid =
    form.current_korea_address.trim() !== "" &&
    containsHangul(form.current_korea_address);

  // Auto-calculated recommendations + selectable date windows.
  const recommendation = useMemo(
    () =>
      getRecommendation(
        form.destination_country,
        form.planned_submission_date,
        ruleset.dateRules
      ),
    [form.destination_country, form.planned_submission_date, ruleset.dateRules]
  );
  const startWindow = useMemo(
    () =>
      travelStartWindow(
        form.destination_country,
        form.planned_submission_date,
        ruleset.dateRules
      ),
    [form.destination_country, form.planned_submission_date, ruleset.dateRules]
  );
  const todayISO = toISO(new Date());

  const guidance = getCountryGuidance(
    form.destination_country,
    ruleset.countryGuidance
  );

  // Guidance is NOT shown on the page. It appears as a modal only when the user
  // interacts with a travel-date field (once per destination), or reopens it
  // via the small ⓘ button.
  function openGuidance() {
    if (!rule) return;
    seenGuidance.current.add(form.destination_country);
    setModalOpen(true);
  }
  function onDateFocus() {
    if (rule && !seenGuidance.current.has(form.destination_country)) {
      seenGuidance.current.add(form.destination_country);
      setModalOpen(true);
    }
  }
  function applyRecommendedDates() {
    if (recommendation?.recommendedStartISO)
      set("travel_start_date", recommendation.recommendedStartISO);
    if (recommendation?.recommendedEndISO)
      set("travel_end_date", recommendation.recommendedEndISO);
  }

  // --- Eligibility: runs automatically once nationality + destination are set.
  const eligibility: EligibilityResult | null = useMemo(
    () =>
      evaluateEligibility(
        form.nationality,
        form.destination_country,
        ruleset.eligibility,
        ruleset.demonyms
      ),
    [form.nationality, form.destination_country, ruleset.eligibility, ruleset.demonyms]
  );
  const outcome = eligibility?.outcome ?? null;

  // The workflow itself changes shape based on the eligibility result.
  // Japan and Taiwan (when an application is actually required) get their own
  // richer flow; every other destination keeps the generic outcome-based steps.
  const useJapanFlow = isJapan && outcome != null && requiresApplication(outcome);
  const useTaiwanFlow = isTaiwan && outcome != null && requiresApplication(outcome);
  const useRichFlow = useJapanFlow || useTaiwanFlow;
  const steps = useMemo(
    () => (useRichFlow ? RICH_APPLICATION_STEPS : stepsForOutcome(outcome)),
    [useRichFlow, outcome]
  );
  const stepIndex = Math.min(step, steps.length - 1);
  const current = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  // The wizard steps live entirely in React state (`step`), so by default the
  // browser back button has nothing to pop through: it jumps straight past
  // the whole wizard to whatever page was open before /apply. Fix: every
  // step change also pushes a history entry carrying the step index, and a
  // popstate listener syncs `step` back when the browser Back/Forward
  // buttons are used — so Back walks the wizard one step at a time, and only
  // leaves it once you're already on step 0.
  useEffect(() => {
    window.history.replaceState({ step }, "");
    // Only on mount — this just annotates the current entry, it must not
    // re-run (and re-stamp) every time `step` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      const idx = typeof e.state?.step === "number" ? e.state.step : 0;
      setStep(Math.min(Math.max(idx, 0), steps.length - 1));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [steps.length]);
  function changeStep(idx: number) {
    const next = Math.min(Math.max(idx, 0), steps.length - 1);
    setStep(next);
    window.history.pushState({ step: next }, "");
  }

  // Vietnam's return date is derived from the entry date (a flat 30-day
  // stay), never chosen — so it's computed here rather than trusted from form
  // state. A draft saved before this rule (or under an older version of it)
  // would otherwise keep a stale end date that silently fails validation,
  // with the applicant unable to correct a field they aren't allowed to edit.
  const vietnamEndISO =
    isVietnam && form.travel_start_date
      ? vietnamStayEndISO(form.travel_start_date)
      : "";
  const travelEndDate = vietnamEndISO || form.travel_end_date;
  // What gets persisted — so a stale stored value is repaired on the next save.
  const formToSave: ApplyFormData = vietnamEndISO
    ? { ...form, travel_end_date: vietnamEndISO }
    : form;

  const dateCheck: DateValidation = useMemo(
    () =>
      validateDates(
        form.destination_country,
        {
          planned_submission_date: form.planned_submission_date,
          travel_start_date: form.travel_start_date,
          travel_end_date: travelEndDate,
        },
        ruleset.dateRules
      ),
    [
      form.destination_country,
      form.planned_submission_date,
      form.travel_start_date,
      travelEndDate,
      ruleset.dateRules,
    ]
  );

  // Japan visa route is derived from the Step 1 province selection.
  const japanRoute =
    isJapan && form.korea_region ? japanRouteForRegion(form.korea_region) : null;

  const statusDocs = useMemo(
    () =>
      form.korean_visa_status
        ? documentsForStatus(
            form.korean_visa_status,
            ruleset.baseDocuments,
            ruleset.statusDocuments,
            form.marital_status
          ).filter((d) => !ruleset.baseDocuments.some((b) => b.key === d.key))
        : [],
    [
      form.korean_visa_status,
      form.marital_status,
      ruleset.baseDocuments,
      ruleset.statusDocuments,
    ]
  );

  // --- per-step validation (keyed by step name, since steps are dynamic) ----
  // Flight + hotel bookings are asked right here, on Destination — before the
  // applicant invests time filling out the rest of the application — because
  // they're critical for document generation. Without a confirmed booking we
  // block progress and show our contacts instead of letting the applicant
  // fill everything out only to get stuck later.
  // Vietnam's e-Visa doesn't need a confirmed flight/hotel reservation up
  // front — the portal doesn't ask for one, unlike Singapore/Spain's embassy
  // submission, which does.
  const bookingsRequired =
    outcome != null && requiresApplication(outcome) && !isVietnam;
  const bookingsConfirmed = form.flight_booked === true && form.accommodation_booked === true;
  const destinationValid =
    form.nationality !== "" &&
    form.destination_country !== "" &&
    form.destination_city !== "" &&
    (!isJapan || form.korea_region !== "") &&
    eligibility !== null &&
    (!bookingsRequired || bookingsConfirmed);
  // Flight/accommodation booking details — shared by every destination.
  // Japan/Taiwan collect these on their rich-flow "Application Details"
  // page; Singapore/Spain collect the same TravelBookingsStep inline on the
  // generic "Applicant" page (see applicantValid below).
  const fl = form.flight;
  const flightValid =
    form.flight_booked === false ||
    (form.flight_booked === true &&
      fl.airline.trim() !== "" &&
      fl.flight_number.trim() !== "" &&
      form.port_of_entry.trim() !== "" &&
      fl.arrival_date !== "" &&
      Boolean(uploads["flight_reservation"]));
  const accommodationValid =
    form.accommodation_booked === false ||
    (form.accommodation_booked === true &&
      Boolean(uploads["hotel_booking"]) &&
      form.accommodations.length > 0 &&
      form.accommodations.every(
        (a) =>
          a.name.trim() !== "" &&
          a.phone.trim() !== "" &&
          a.address.trim() !== "" &&
          !hasNonLatinScript(a.address) &&
          a.check_in !== "" &&
          a.check_out !== "" &&
          a.check_out >= a.check_in
      ));
  const statusDocsValid = statusDocs
    .filter((d) => d.required)
    .every((d) => Boolean(uploads[d.key]));
  // Base identity uploads (passport + ARC). Named for reuse below —
  // Japan/Taiwan's "Identity Documents" step and the generic flow's
  // "Applicant" step both gate on this.
  const baseUploadsValid =
    Boolean(uploads["passport"]) &&
    Boolean(uploads["arc_front"]) &&
    Boolean(uploads["arc_back"]);

  // --- Japan step validity (Phase 2a: steps 1–4) ---------------------------
  const japanEmploymentKind = employmentKind(form.korean_visa_status);
  const personalValid =
    form.surname.trim() !== "" &&
    form.given_name.trim() !== "" &&
    form.full_name_as_passport.trim() !== "" &&
    form.date_of_birth !== "" &&
    form.gender !== "" &&
    form.marital_status !== "" &&
    form.country_of_birth.trim() !== "" &&
    // Father's name / patronymic — required + Latin-only for Uzbekistan.
    (!fatherRequired ||
      (form.middle_name_or_patronymic.trim() !== "" &&
        !hasNonLatinScript(form.middle_name_or_patronymic)));
  const passportValid =
    form.passport_number.trim() !== "" &&
    (form.passport_type || "ordinary") !== "" &&
    form.passport_place_of_issue.trim() !== "" &&
    form.passport_issuing_authority.trim() !== "" &&
    form.passport_issue_date !== "" &&
    form.passport_expiry_date !== "" &&
    // Expiry must be after issue (ISO strings compare chronologically).
    form.passport_issue_date < form.passport_expiry_date;
  // Japan requires the FULL Korea address in Romanized English (not Hangul) —
  // not just a city/district name.
  const koreaAddressValid =
    !hasNonLatinScript(form.current_korea_address) &&
    isCompleteAddress(form.current_korea_address);
  // Occupation is the basis of stay only for students (field of study) and
  // workers. F-series residents, job seekers (D-10), G-1 and the rest may
  // leave it blank — embassies accept an empty/None occupation for them.
  const occupationValid =
    japanEmploymentKind === "university" || japanEmploymentKind === "employer"
      ? form.occupation.trim() !== ""
      : true;
  const koreaBaseValid =
    form.korean_visa_status !== "" &&
    koreaAddressValid &&
    emailValid &&
    form.client_phone.trim() !== "" &&
    occupationValid;
  const orgFieldsFilled =
    form.employer_or_school_name.trim() !== "" &&
    form.employer_phone.trim() !== "" &&
    form.employer_or_school_address.trim() !== "" &&
    !hasNonLatinScript(form.employer_or_school_address);
  // University + employer require the full org block (employer also needs a
  // position); D-10 (jobseeking) and other statuses don't force it.
  const koreaStatusValid =
    koreaBaseValid &&
    (japanEmploymentKind === "university"
      ? orgFieldsFilled
      : japanEmploymentKind === "employer"
        ? orgFieldsFilled && form.position_title.trim() !== ""
        : true);
  // Same organization-based logic as koreaStatusValid, but WITHOUT
  // koreaBaseValid's address/phone/email re-check — the generic (Singapore/
  // Spain) flow already validates those separately via `addressValid`
  // (which requires Hangul, unlike koreaBaseValid's Romanized-English
  // requirement for Japan/Taiwan) inside `applicantValid` below. Only the
  // genuinely new fields KoreaStatusStep adds to that flow — occupation and
  // the employer/university block — belong here.
  const koreaOrgValid =
    occupationValid &&
    (japanEmploymentKind === "university"
      ? orgFieldsFilled
      : japanEmploymentKind === "employer"
        ? orgFieldsFilled && form.position_title.trim() !== ""
        : true);
  // --- Vietnam-only fields (0012) -------------------------------------------
  const vietnamFinancingValid =
    form.vietnam_financing_source === "personal" ||
    (form.vietnam_financing_source === "other" &&
      form.vietnam_financier_name.trim() !== "" &&
      form.vietnam_financier_relationship.trim() !== "" &&
      form.vietnam_financier_phone.trim() !== "" &&
      form.vietnam_financier_address.trim() !== "");
  const vietnamPhotoUploaded = Boolean(uploads["vietnam_photo"]);
  // A weekend application date can't be honoured (we don't submit then), so
  // it's blocked here as well as greyed out in the picker.
  const vietnamSubmissionDateOk =
    !form.planned_submission_date ||
    !isVietnamSubmissionDateBlocked(form.planned_submission_date);
  const vietnamFieldsValid =
    !isVietnam ||
    (form.vietnam_family_member_name.trim() !== "" &&
      form.vietnam_family_member_phone.trim() !== "" &&
      form.vietnam_family_member_address.trim() !== "" &&
      form.vietnam_family_member_relationship !== "" &&
      // "Other" is only answered once the free-text box is actually filled in.
      (form.vietnam_family_member_relationship !== "other" ||
        form.vietnam_family_member_relationship_other.trim() !== "") &&
      form.vietnam_insurance_purchased !== null &&
      form.vietnam_financing_source !== "" &&
      vietnamFinancingValid &&
      vietnamPhotoUploaded &&
      vietnamSubmissionDateOk);

  // The merged generic-flow "Applicant" page = every field from what used to
  // be separate Applicant/Korea-Status/Documents steps, all valid at once.
  // Vietnam skips the flight/hotel booking requirement (the e-Visa portal
  // doesn't ask for one), skips Korean visa status / occupation / employer /
  // status-specific documents entirely (not asked at all, regardless of
  // status), and adds its own small field set above instead.
  // Passport identity block on the generic "Applicant" page. Mostly MRZ
  // auto-filled, but still gated: an e-Visa can't be submitted without a
  // passport number and valid dates, and a typo'd expiry is worth catching
  // here rather than at the embassy.
  const genericPassportValid =
    form.date_of_birth !== "" &&
    form.passport_number.trim() !== "" &&
    form.passport_issue_date !== "" &&
    form.passport_expiry_date !== "" &&
    form.passport_issue_date < form.passport_expiry_date;

  const applicantValid =
    form.full_name_as_passport.trim() !== "" &&
    form.surname.trim() !== "" &&
    form.given_name.trim() !== "" &&
    (!fatherRequired || form.middle_name_or_patronymic.trim() !== "") &&
    genericPassportValid &&
    emailValid &&
    form.client_phone.trim() !== "" &&
    (isVietnam || form.korean_visa_status !== "") &&
    addressValid &&
    dateCheck.ok &&
    baseUploadsValid &&
    (isVietnam || flightValid) &&
    (isVietnam || accommodationValid) &&
    (isVietnam || koreaOrgValid) &&
    (isVietnam || statusDocsValid) &&
    vietnamFieldsValid;
  // Planned submission date (if set) must be an embassy business day.
  const submissionDateOk =
    !form.planned_submission_date ||
    !isSubmissionDateBlocked(form.planned_submission_date, japanEmbassyClosures);
  const japanTripValid =
    form.travel_purpose.trim() !== "" && dateCheck.ok && submissionDateOk;

  // --- Japan steps 5–9 validity --------------------------------------------
  const previousVisitsValid =
    form.has_previous_japan_visits === false ||
    (form.has_previous_japan_visits === true &&
      form.previous_japan_visits.length > 0 &&
      form.previous_japan_visits.every((v) => v.visited_from !== ""));
  const hostValid =
    form.host_type === "none" ||
    ((form.host_type === "inviter" || form.host_type === "guarantor") &&
      form.host.name.trim() !== "" &&
      form.host.address.trim() !== "" &&
      !hasNonLatinScript(form.host.address) &&
      form.host.phone.trim() !== "" &&
      form.host.relationship.trim() !== "");
  // Identity docs (passport + ARC) now form their own first step.
  const identityDocsValid = baseUploadsValid;
  // The merged "Application Details" page = every field from the old
  // Personal / Passport / Korea Status / Japan Trip / Travel Bookings /
  // Previous Visits / Guarantor steps, all valid at once.
  const applicationDetailsValid =
    personalValid &&
    passportValid &&
    koreaStatusValid &&
    statusDocsValid &&
    japanTripValid &&
    flightValid &&
    accommodationValid &&
    previousVisitsValid &&
    hostValid;
  const bg = form.background_answers;
  const backgroundAnswered =
    bg.crime !== null &&
    bg.imprisonment !== null &&
    bg.drugs !== null &&
    bg.deported !== null &&
    bg.prostitution !== null &&
    bg.trafficking !== null;
  const anyBackgroundYes = Boolean(
    bg.crime || bg.imprisonment || bg.drugs || bg.deported || bg.prostitution || bg.trafficking
  );
  const backgroundValid =
    backgroundAnswered && (!anyBackgroundYes || form.remarks.trim() !== "");

  // --- Taiwan step validity --------------------------------------------------
  const taiwanTripValid =
    form.taiwan_travel_purpose !== "" &&
    (form.taiwan_travel_purpose !== "other" || form.taiwan_travel_purpose_other.trim() !== "") &&
    dateCheck.ok &&
    form.home_country_address.trim() !== "" &&
    !hasNonLatinScript(form.home_country_address);
  // Taiwan's portal form (lib/docs/taiwanData.ts REQUIRED_FIELDS) asks for the
  // applicant's city of birth — Japan's does not — so it is gated here rather
  // than folded into the shared personalValid. Collecting it up front means
  // staff never have to go back to the client mid portal entry.
  const taiwanApplicationDetailsValid =
    personalValid &&
    form.birth_city.trim() !== "" &&
    passportValid &&
    koreaStatusValid &&
    statusDocsValid &&
    taiwanTripValid &&
    flightValid &&
    accommodationValid;
  const twBg = form.taiwan_background_answers;
  const taiwanBackgroundAnswered =
    twBg.criminalRecord !== null &&
    twBg.illegalEntry !== null &&
    twBg.communicableDisease !== null &&
    twBg.overstayedOrIllegalWork !== null &&
    twBg.drugTrafficking !== null &&
    twBg.visaRefused !== null &&
    twBg.differentName !== null &&
    twBg.workedInTaiwan !== null;
  const anyTaiwanBackgroundYes = Boolean(
    twBg.criminalRecord ||
      twBg.illegalEntry ||
      twBg.communicableDisease ||
      twBg.overstayedOrIllegalWork ||
      twBg.drugTrafficking ||
      twBg.visaRefused ||
      twBg.differentName ||
      twBg.workedInTaiwan
  );
  const taiwanBackgroundValid =
    taiwanBackgroundAnswered && (!anyTaiwanBackgroundYes || form.remarks.trim() !== "");

  // --- Review sections (status + summary + jump target) --------------------
  const st = (valid: boolean, notBooked = false): SectionStatus =>
    notBooked ? "attention" : valid ? "complete" : "incomplete";
  const yn = (v: boolean | null) =>
    v === null ? "—" : v ? t("review.yes") : t("review.no");
  const japanSections: ReviewSection[] = useJapanFlow
    ? [
        {
          key: "personal",
          title: t("review.personal"),
          step: "Application Details",
          status: st(personalValid),
          rows: [
            [t("review.name"), [form.surname, form.given_name].filter(Boolean).join(" ")],
            [t("review.birthDate"), form.date_of_birth],
            [t("review.sex"), form.gender],
            [t("review.maritalStatus"), form.marital_status],
            [t("review.nationality"), form.nationality],
            ...(fatherRequired
              ? ([[t("review.fatherName"), form.middle_name_or_patronymic]] as [string, string][])
              : []),
          ],
        },
        {
          key: "passport",
          title: t("review.passport"),
          step: "Application Details",
          status: st(passportValid),
          rows: [
            [t("review.number"), form.passport_number],
            [t("review.type"), form.passport_type || t("review.ordinary")],
            [t("review.issued"), form.passport_issue_date],
            [t("review.expires"), form.passport_expiry_date],
          ],
        },
        {
          key: "korea",
          title: t("review.statusKorea"),
          step: "Application Details",
          status: st(koreaStatusValid),
          rows: [
            [t("review.visaStatus"), form.korean_visa_status],
            [t("review.address"), form.current_korea_address],
            [t("review.phone"), form.client_phone],
            [japanEmploymentKind === "university" ? t("review.fieldOfStudy") : t("review.occupation"), form.occupation],
            [
              japanEmploymentKind === "university" ? t("review.university") : t("review.employer"),
              form.employer_or_school_name,
            ],
          ],
        },
        {
          key: "trip",
          title: t("review.japanTrip"),
          step: "Application Details",
          status: st(japanTripValid),
          rows: [
            [t("review.purpose"), form.travel_purpose],
            [t("review.submissionDate"), form.planned_submission_date],
            [t("review.arrival"), form.travel_start_date],
            [t("review.departure"), form.travel_end_date],
            [t("review.stay"), dateCheck.stayDays != null ? t("review.days").replace("{days}", String(dateCheck.stayDays)) : "—"],
          ],
        },
        {
          key: "flight",
          title: t("review.flight"),
          step: "Application Details",
          status: st(flightValid, form.flight_booked === false),
          rows: [
            [t("review.booked"), yn(form.flight_booked)],
            [t("review.airline"), fl.airline],
            [t("review.portOfEntry"), form.port_of_entry],
            [t("review.arrivalDate"), fl.arrival_date],
          ],
        },
        {
          key: "accommodation",
          title: t("review.accommodation"),
          step: "Application Details",
          status: st(accommodationValid, form.accommodation_booked === false),
          rows: [
            [t("review.booked"), yn(form.accommodation_booked)],
            [t("review.places"), form.accommodations.length ? String(form.accommodations.length) : "—"],
            [t("review.firstHotel"), form.accommodations[0]?.name ?? "—"],
          ],
        },
        {
          key: "previous",
          title: t("review.previousJapan"),
          step: "Application Details",
          status: st(previousVisitsValid),
          rows: [
            [t("review.visitedBefore"), yn(form.has_previous_japan_visits)],
            [t("review.visitsRecorded"), form.previous_japan_visits.length ? String(form.previous_japan_visits.length) : "—"],
          ],
        },
        {
          key: "host",
          title: t("review.host"),
          step: "Application Details",
          status: st(hostValid),
          rows: [
            [t("review.type"), form.host_type === "none" ? t("review.independentTourist") : form.host_type || "—"],
            ...(form.host_type === "inviter" || form.host_type === "guarantor"
              ? ([
                  [t("review.name"), form.host.name],
                  [t("review.relationship"), form.host.relationship],
                ] as [string, string][])
              : []),
          ],
        },
        {
          key: "background",
          title: t("review.additional"),
          step: "Background",
          status: st(backgroundValid),
          rows: [
            [t("review.allAnswered"), backgroundAnswered ? t("review.yes") : t("review.no")],
            [t("review.anyYes"), anyBackgroundYes ? t("review.yesSeeRemarks") : t("review.no")],
          ],
        },
        {
          key: "documents",
          title: t("review.identityDocuments"),
          step: "Identity Documents",
          status: st(identityDocsValid),
          rows: [
            [t("review.passport"), uploads["passport"] ? t("review.uploaded") : t("review.missing")],
            [t("review.arcFront"), uploads["arc_front"] ? t("review.uploaded") : t("review.missing")],
            [t("review.arcBack"), uploads["arc_back"] ? t("review.uploaded") : t("review.missing")],
          ],
        },
        {
          key: "status_documents",
          title: t("review.statusDocuments"),
          step: "Application Details",
          status: st(statusDocsValid),
          rows: [
            [
              t("review.requiredUploaded"),
              `${statusDocs.filter((d) => d.required && uploads[d.key]).length} / ${
                statusDocs.filter((d) => d.required).length
              }`,
            ],
          ],
        },
      ]
    : [];

  const taiwanSections: ReviewSection[] = useTaiwanFlow
    ? [
        {
          key: "personal",
          title: t("review.personal"),
          step: "Application Details",
          status: st(personalValid),
          rows: [
            [t("review.name"), [form.surname, form.given_name].filter(Boolean).join(" ")],
            [t("review.birthDate"), form.date_of_birth],
            [t("review.sex"), form.gender],
            [t("review.maritalStatus"), form.marital_status],
            [t("review.nationality"), form.nationality],
            ...(fatherRequired
              ? ([[t("review.fatherName"), form.middle_name_or_patronymic]] as [string, string][])
              : []),
          ],
        },
        {
          key: "passport",
          title: t("review.passport"),
          step: "Application Details",
          status: st(passportValid),
          rows: [
            [t("review.number"), form.passport_number],
            [t("review.type"), form.passport_type || t("review.ordinary")],
            [t("review.issued"), form.passport_issue_date],
            [t("review.expires"), form.passport_expiry_date],
          ],
        },
        {
          key: "korea",
          title: t("review.statusKorea"),
          step: "Application Details",
          status: st(koreaStatusValid),
          rows: [
            [t("review.visaStatus"), form.korean_visa_status],
            [t("review.address"), form.current_korea_address],
            [t("review.phone"), form.client_phone],
            [japanEmploymentKind === "university" ? t("review.fieldOfStudy") : t("review.occupation"), form.occupation],
            [
              japanEmploymentKind === "university" ? t("review.university") : t("review.employer"),
              form.employer_or_school_name,
            ],
          ],
        },
        {
          key: "trip",
          title: t("review.taiwanTrip"),
          step: "Application Details",
          status: st(taiwanTripValid),
          rows: [
            [
              t("review.purpose"),
              form.taiwan_travel_purpose === "other"
                ? form.taiwan_travel_purpose_other
                : form.taiwan_travel_purpose,
            ],
            [t("review.submissionDate"), form.planned_submission_date],
            [t("review.arrival"), form.travel_start_date],
            [t("review.departure"), form.travel_end_date],
            [t("review.stay"), dateCheck.stayDays != null ? t("review.days").replace("{days}", String(dateCheck.stayDays)) : "—"],
            [t("review.homeAddress"), form.home_country_address],
          ],
        },
        {
          key: "flight",
          title: t("review.flight"),
          step: "Application Details",
          status: st(flightValid, form.flight_booked === false),
          rows: [
            [t("review.booked"), yn(form.flight_booked)],
            [t("review.airline"), fl.airline],
          ],
        },
        {
          key: "accommodation",
          title: t("review.accommodationTaiwan"),
          step: "Application Details",
          status: st(accommodationValid, form.accommodation_booked === false),
          rows: [
            [t("review.booked"), yn(form.accommodation_booked)],
            [t("review.places"), form.accommodations.length ? String(form.accommodations.length) : "—"],
            [t("review.firstHotel"), form.accommodations[0]?.name ?? "—"],
          ],
        },
        {
          key: "background",
          title: t("review.additional"),
          step: "Background",
          status: st(taiwanBackgroundValid),
          rows: [
            [t("review.allAnswered"), taiwanBackgroundAnswered ? t("review.yes") : t("review.no")],
            [t("review.anyYes"), anyTaiwanBackgroundYes ? t("review.yesSeeRemarks") : t("review.no")],
          ],
        },
        {
          key: "documents",
          title: t("review.identityDocuments"),
          step: "Identity Documents",
          status: st(identityDocsValid),
          rows: [
            [t("review.passport"), uploads["passport"] ? t("review.uploaded") : t("review.missing")],
            [t("review.arcFront"), uploads["arc_front"] ? t("review.uploaded") : t("review.missing")],
            [t("review.arcBack"), uploads["arc_back"] ? t("review.uploaded") : t("review.missing")],
          ],
        },
        {
          key: "status_documents",
          title: t("review.statusDocuments"),
          step: "Application Details",
          status: st(statusDocsValid),
          rows: [
            [
              t("review.requiredUploaded"),
              `${statusDocs.filter((d) => d.required && uploads[d.key]).length} / ${
                statusDocs.filter((d) => d.required).length
              }`,
            ],
          ],
        },
      ]
    : [];

  const activeSections = useJapanFlow ? japanSections : taiwanSections;
  const reviewValid =
    acknowledged && activeSections.every((s) => s.status !== "incomplete");

  function goToStep(name: string) {
    const idx = steps.indexOf(name);
    if (idx >= 0) changeStep(idx);
  }

  const stepValidity: Record<string, boolean> = {
    Destination: destinationValid,
    Applicant: applicantValid,
    Companions: true,
    Guidance: true,
    Result: true,
    // Japan / Taiwan rich flow
    "Identity Documents": identityDocsValid,
    "Application Details": useTaiwanFlow ? taiwanApplicationDetailsValid : applicationDetailsValid,
    Background: useTaiwanFlow ? taiwanBackgroundValid : backgroundValid,
    Review: reviewValid,
  };
  const canAdvance = stepValidity[current] ?? true;

  // --- persistence ---------------------------------------------------------
  // Runs saveApplication and calls `then` only on a successful save. Network
  // failures (e.g. Supabase unreachable) are caught so they never surface as an
  // uncaught "fetch failed".
  function persist(then?: () => void) {
    setNotice(null);
    startSaving(async () => {
      try {
        const res = await saveApplication(applicationId, formToSave);
        if (!res.ok) return setNotice({ kind: "err", text: res.error });
        then?.();
      } catch {
        setNotice({
          kind: "err",
          text: "Could not reach the server to save your progress.",
        });
      }
    });
  }
  function advanceAndPersist() {
    setNotice(null);
    changeStep(Math.min(stepIndex + 1, steps.length - 1));
    void saveApplication(applicationId, formToSave)
      .then((res) => {
        if (!res.ok) setNotice({ kind: "err", text: res.error });
      })
      .catch(() => {
        setNotice({
          kind: "err",
          text: "Progress could not be saved — the server is unreachable.",
        });
      });
  }
  // Scrolls to the first unfinished field on the current step and puts the
  // cursor in it. Works off the FIELD_ERROR_ATTR marker every field primitive
  // renders when it's incomplete, so it covers every destination and every
  // field type without the wizard needing a list of them — and keeps working
  // as fields are added.
  function scrollToFirstIncompleteField(): boolean {
    const marker = document.querySelector<HTMLElement>(`[${FIELD_ERROR_ATTR}]`);
    if (!marker) return false;

    // The marker sits just after its field; scroll the whole field group into
    // view rather than the tiny error line at the bottom of it.
    const group = marker.closest("div");
    (group ?? marker).scrollIntoView({ behavior: "smooth", block: "center" });

    // Focus the field itself so the applicant can type straight away.
    const focusable = group?.querySelector<HTMLElement>(
      "input:not([type=hidden]), select, textarea, button:not([disabled])"
    );
    focusable?.focus({ preventScroll: true });
    return true;
  }

  function next() {
    const advance = () => changeStep(Math.min(stepIndex + 1, steps.length - 1));

    // Continue is never disabled — pressing it with something missing takes
    // the applicant to that field instead of silently doing nothing, which
    // is what a greyed-out button felt like.
    if (!canAdvance) {
      setNotice(null);
      if (!scrollToFirstIncompleteField()) {
        setNotice({
          kind: "err",
          text: "Some required information on this step is still missing.",
        });
      }
      return;
    }
    // Visa-free travellers aren't building an application — just show guidance.
    if (outcome === "visa_free") return advance();
    // Right as the applicant leaves "Destination", show the document-prep
    // checklist once — the Korea province (chosen on this step) already
    // tells us the route (sticker/Busan or eVisa/Seoul), so the checklist
    // content can be tailored to it. Advancing happens when the modal is
    // closed.
    if (current === "Destination" && japanRoute != null && !seoulChecklistShown.current) {
      seoulChecklistShown.current = true;
      setSeoulChecklistOpen(true);
      return;
    }
    // Advance immediately — the current step is already validated client-side —
    // and persist in the background. This keeps navigation working (and never
    // throws) even when the server/Supabase is slow or unavailable.
    advanceAndPersist();
  }
  function closeSeoulChecklist() {
    setSeoulChecklistOpen(false);
    advanceAndPersist();
  }
  function back() {
    changeStep(Math.max(stepIndex - 1, 0));
  }
  function saveDraft() {
    persist(() => setNotice({ kind: "ok", text: "Draft saved." }));
  }
  function submit() {
    // Payments are still under bank review: the finished application stays
    // saved, and the button explains instead of submitting.
    if (!VISA_SUBMISSIONS_OPEN) {
      persist(() => {});
      setComingSoon(true);
      return;
    }
    setNotice(null);
    startSaving(async () => {
      try {
        const saved = await saveApplication(applicationId, formToSave);
        if (!saved.ok) return setNotice({ kind: "err", text: saved.error });
        const res = await submitApplication(applicationId, consent);
        if (!res.ok) return setNotice({ kind: "err", text: res.error });
        setSubmitted(true);
        window.scrollTo({ top: 0 });
      } catch {
        setNotice({
          kind: "err",
          text: "Could not reach the server to submit. Please try again once you are back online.",
        });
      }
    });
  }

  if (submitted) {
    return <SubmitSuccess applicationId={applicationId} />;
  }

  return (
    // No card frame around the wizard: the form sits straight on the page so
    // the destination's ambience stays visible behind the fields.
    <div>
      <LeaveGuard />
      <ComingSoonModal open={comingSoon} onClose={() => setComingSoon(false)} />
      <CountryAmbience destination={form.destination_country} />
      <CountryBanner destination={form.destination_country} />
      <Stepper steps={steps} step={stepIndex} />

      {notice && (
        <p
          role={notice.kind === "ok" ? "status" : "alert"}
          className={`mt-6 rounded-2xl px-5 py-3 text-sm font-semibold ${
            notice.kind === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div key={current} className="animate-fade-in mt-8">
        {current === "Destination" && (
          <div className="space-y-6">
            <p className="text-slate-600">
              {t("apply.destinationIntro")}
            </p>
            <div className="flex flex-wrap gap-2">
              {ruleset.destinations.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    set("destination_country", d);
                    set("destination_city", "");
                    set("korea_region", "");
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    form.destination_country === d
                      ? "border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
                  }`}
                >
                  <span aria-hidden>{DEST_FLAGS[d] ?? "🌍"}</span>
                  {d}
                </button>
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Select
                label={t("apply.nationality")}
                value={form.nationality}
                onChange={(v) => set("nationality", v)}
                options={ruleset.nationalities}
              />
              <Select
                label={t("apply.destinationCountry")}
                value={form.destination_country}
                onChange={(v) => {
                  set("destination_country", v);
                  set("destination_city", "");
                  set("korea_region", "");
                }}
                options={ruleset.destinations}
              />
              {isJapan && (
                <Select
                  label={t("apply.koreaRegion")}
                  value={form.korea_region}
                  onChange={(v) => set("korea_region", v)}
                  options={[...KOREA_REGIONS]}
                />
              )}
              {cities.length > 0 && (
                <Select
                  label={t("apply.destinationCity")}
                  value={form.destination_city}
                  onChange={(v) => set("destination_city", v)}
                  options={cities}
                />
              )}
            </div>

            {eligibility && <EligibilityBanner result={eligibility} />}

            {japanRoute && outcome !== "visa_free" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
                {t("apply.detectedRoute")}: {japanRoute.label}
              </div>
            )}

            {isTaiwan && outcome !== "visa_free" && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-900">
                <p className="font-semibold">{t("generic.taiwanMissionTitle")}</p>
                <p className="mt-1 text-blue-800">
                  {t("generic.taiwanMissionBody")}
                </p>
              </div>
            )}

            {bookingsRequired && (
              <div className="space-y-5 rounded-2xl border border-slate-200 p-5">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900"><span aria-hidden className="sparkle text-cyan-500">✦</span>{t("apply.flightHotelBookings")}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {t("apply.bookingsIntro")}
                  </p>
                  <p className="mt-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold leading-relaxed text-amber-800">
                    {t("apply.bookingsNote")}
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <BooleanChoice
                    label={t("apply.flightBooked")}
                    value={form.flight_booked}
                    onChange={(v) => set("flight_booked", v)}
                  />
                  <BooleanChoice
                    label={t("apply.accommodationBooked")}
                    value={form.accommodation_booked}
                    onChange={(v) => set("accommodation_booked", v)}
                  />
                </div>

                {(form.flight_booked === false || form.accommodation_booked === false) && (
                  <SupportContactCard
                    title={t("apply.bookingSupportTitle")}
                    message={t("apply.bookingSupportMessage")}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {current === "Result" && eligibility && (
          <VisaFreeResult result={eligibility} />
        )}

        {current === "Identity Documents" && (
          <div>
            <h3 className="flex items-center gap-2 text-xl font-bold"><span aria-hidden className="sparkle text-cyan-500">✦</span>{t("generic.identityTitle")}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {t("generic.identityIntro")}
            </p>
            <div className="mt-4 grid gap-6 md:grid-cols-3">
              {ruleset.baseDocuments.map((doc) => (
                <UploadField
                  key={doc.key}
                  applicationId={applicationId}
                  userId={userId}
                  fileType={doc.key}
                  label={doc.labelEn}
                  required={doc.required}
                  initialFilename={uploads[doc.key]}
                  onUploaded={onUploaded}
                />
              ))}
            </div>
            {uploads["passport"] && (
              <PassportScanPanel
                applicationId={applicationId}
                passportFilename={uploads["passport"]}
                set={set}
              />
            )}
          </div>
        )}

        {current === "Application Details" && (
          <div className="space-y-10">
            <p className="text-sm text-slate-600">
              {t("generic.passportScanCheck")}
            </p>

            <PersonalStep
              form={form}
              set={set}
              fatherRequired={fatherRequired}
              maritalOptions={useTaiwanFlow ? TAIWAN_MARITAL_OPTIONS : undefined}
              birthCityRequired={useTaiwanFlow}
              showBirthCity={useTaiwanFlow}
            />

            <div className="border-t border-slate-200 pt-8">
              <PassportStep form={form} set={set} />
            </div>

            <div className="border-t border-slate-200 pt-8">
              <KoreaStatusStep
                form={form}
                set={set}
                koreanVisaTypes={ruleset.koreanVisaTypes}
                applicationId={applicationId}
                userId={userId}
                uploads={uploads}
                onUploaded={onUploaded}
                statusDocs={statusDocs}
              />
            </div>

            {useTaiwanFlow ? (
              <div className="border-t border-slate-200 pt-8">
                <TaiwanTripStep
                  form={form}
                  set={set}
                  rule={rule}
                  dateCheck={dateCheck}
                  startWindow={startWindow}
                  recommendation={recommendation}
                  onDateFocus={onDateFocus}
                  openGuidance={openGuidance}
                  applyRecommendedDates={applyRecommendedDates}
                />
              </div>
            ) : (
              <div className="border-t border-slate-200 pt-8">
                <JapanTripStep
                  form={form}
                  set={set}
                  rule={rule}
                  dateCheck={dateCheck}
                  startWindow={startWindow}
                  recommendation={recommendation}
                  onDateFocus={onDateFocus}
                  openGuidance={openGuidance}
                  applyRecommendedDates={applyRecommendedDates}
                  embassyClosures={japanEmbassyClosures}
                />
              </div>
            )}

            <div className="border-t border-slate-200 pt-8">
              <TravelBookingsStep
                form={form}
                set={set}
                applicationId={applicationId}
                userId={userId}
                uploads={uploads}
                onUploaded={onUploaded}
                countryLabel={useTaiwanFlow ? "Taiwan" : "Japan"}
              />
            </div>

            {!useTaiwanFlow && (
              <>
                <div className="border-t border-slate-200 pt-8">
                  <PreviousVisitsStep form={form} set={set} />
                </div>

                <div className="border-t border-slate-200 pt-8">
                  <HostStep form={form} set={set} />
                </div>
              </>
            )}
          </div>
        )}

        {current === "Background" &&
          (useTaiwanFlow ? (
            <TaiwanBackgroundStep form={form} set={set} />
          ) : (
            <BackgroundStep form={form} set={set} />
          ))}

        {current === "Review" && (
          <JapanReview
            form={form}
            sections={activeSections}
            goToStep={goToStep}
            acknowledged={acknowledged}
            onAcknowledge={setAcknowledged}
          />
        )}

        {current === "Applicant" && (
          <div className="space-y-8">
            {/* Uploads come FIRST, before any typing — scanning the passport
                auto-reads the name, passport number and dates (MRZ), so the
                fields below arrive pre-filled instead of hand-typed. This
                mirrors the rich (Japan/Taiwan) flow, where identity documents
                are their own first step for the same reason. */}
            <section>
              <h3 className="flex items-center gap-2 text-xl font-bold"><span aria-hidden className="sparkle text-cyan-500">✦</span>{t("generic.identityTitle")}</h3>
              <p className="mt-1 text-sm text-slate-600">
                {t("generic.identityIntro")}
              </p>
              <div className="mt-4 grid gap-6 md:grid-cols-3">
                {ruleset.baseDocuments.map((doc) => (
                  <UploadField
                    key={doc.key}
                    applicationId={applicationId}
                    userId={userId}
                    fileType={doc.key}
                    label={doc.labelEn}
                    required={doc.required}
                    initialFilename={uploads[doc.key]}
                    onUploaded={onUploaded}
                  />
                ))}
                {isVietnam && (
                  <UploadField
                    applicationId={applicationId}
                    userId={userId}
                    fileType="vietnam_photo"
                    label={t("generic.vietnamPhoto")}
                    hint={t("generic.vietnamPhotoHint")}
                    required
                    initialFilename={uploads["vietnam_photo"]}
                    onUploaded={onUploaded}
                  />
                )}
              </div>
              {uploads["passport"] && (
                <PassportScanPanel
                  applicationId={applicationId}
                  passportFilename={uploads["passport"]}
                  set={set}
                />
              )}
            </section>

            <section className="space-y-6 border-t border-slate-200 pt-8">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><span aria-hidden className="sparkle text-cyan-500">✦</span>
                  {t("generic.applicantTitle")}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {t("generic.passportArcCheck")}
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label={t("generic.fullPassportName")}
                  value={form.full_name_as_passport}
                  onChange={(v) => set("full_name_as_passport", formatName(v))}
                  autoComplete="name"
                  helpText={t("generic.passportLatin")}
                />
                <Input
                  label={t("generic.surname")}
                  value={form.surname}
                  onChange={(v) => set("surname", formatName(v))}
                  autoComplete="family-name"
                />
                <Input
                  label={t("generic.givenName")}
                  value={form.given_name}
                  onChange={(v) => set("given_name", formatName(v))}
                  autoComplete="given-name"
                />
                <Input
                  label={t("generic.fatherName")}
                  value={form.middle_name_or_patronymic}
                  onChange={(v) => set("middle_name_or_patronymic", formatName(v))}
                  required={fatherRequired}
                  placeholder="e.g. Odil Ugli / Odil Kizi / Odilovich / Odilovna"
                  helpText={fatherRequired ? t("generic.fatherRequired") : t("japan.optional")}
                />
                <Input
                  label={t("generic.phone")}
                  value={form.client_phone}
                  onChange={(v) => set("client_phone", v)}
                  placeholder="010-0000-0000"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                />
                <Input
                  label={t("generic.email")}
                  value={form.client_email}
                  onChange={(v) => set("client_email", v)}
                  placeholder="you@example.com"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  error={
                    form.client_email.trim() !== "" && !emailValid
                      ? t("generic.emailError")
                      : undefined
                  }
                />
              </div>

              {/* Date of birth, passport number and expiry all come straight
                  off the MRZ scan above. The issue date does NOT — the MRZ
                  simply doesn't encode it — so that one is typed in, and is
                  labelled as such rather than pretending it was read. */}
              <div className="grid gap-6 md:grid-cols-2">
                <DatePicker
                  label={t("japan.dateOfBirth")}
                  value={form.date_of_birth}
                  onChange={(v) => set("date_of_birth", v)}
                  maxISO={todayISO}
                  showYearMonth
                />
                <Input
                  label={t("japan.passport.number")}
                  value={form.passport_number}
                  onChange={(v) => set("passport_number", v.toUpperCase())}
                />
                <DatePicker
                  label={t("japan.passport.issueDate")}
                  value={form.passport_issue_date}
                  onChange={(v) => set("passport_issue_date", v)}
                  maxISO={
                    form.passport_expiry_date &&
                    form.passport_expiry_date < todayISO
                      ? form.passport_expiry_date
                      : todayISO
                  }
                  showYearMonth
                />
                <DatePicker
                  label={t("japan.passport.expiryDate")}
                  value={form.passport_expiry_date}
                  onChange={(v) => set("passport_expiry_date", v)}
                  minISO={form.passport_issue_date || null}
                  showYearMonth
                  error={
                    form.passport_issue_date &&
                    form.passport_expiry_date &&
                    form.passport_expiry_date <= form.passport_issue_date
                      ? t("japan.passport.expiryError")
                      : undefined
                  }
                />
              </div>

              <Input
                label={t("generic.arcAddress")}
                value={form.current_korea_address}
                onChange={(v) => set("current_korea_address", v)}
                placeholder="예: 충청북도 청주시 서원구 …"
                helpText={t("generic.arcAddressHelp")}
                error={
                  form.current_korea_address.trim() !== "" && !addressValid
                    ? t("generic.arcAddressError")
                    : undefined
                }
              />
            </section>

            {/* Vietnam's e-Visa doesn't ask about occupation, employer/
                university, or Korean-visa-status-specific documents at all —
                skip this whole step regardless of which status is chosen
                (D-2, E-9, etc.). */}
            {!isVietnam && (
              <section className="space-y-6 border-t border-slate-200 pt-8">
                <KoreaStatusStep
                  form={form}
                  set={set}
                  koreanVisaTypes={ruleset.koreanVisaTypes}
                  applicationId={applicationId}
                  userId={userId}
                  uploads={uploads}
                  onUploaded={onUploaded}
                  statusDocs={statusDocs}
                  showContactFields={false}
                />
              </section>
            )}

            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><span aria-hidden className="sparkle text-cyan-500">✦</span>{t("generic.travelDates")}</h3>
                {rule && (
                  <button
                    type="button"
                    onClick={openGuidance}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <span aria-hidden>ⓘ</span> {form.destination_country} {t("generic.guidance")}
                  </button>
                )}
              </div>

              {rule?.requiresAppointment && rule.appointmentInfo && (
                <AppointmentCard
                  info={rule.appointmentInfo}
                  confirmed={form.planned_submission_date !== ""}
                />
              )}

              {(() => {
                // For appointment/submission-anchored destinations (Taiwan,
                // Singapore, Spain) the travel window can't be computed until the
                // anchor date is set — so gate the travel fields behind it. Spain's
                // "appointment first → then dates" flow falls out of this.
                const anchorNeeded = Boolean(rule?.anchorRequired);
                const startGated = anchorNeeded && !form.planned_submission_date;
                const endGated = startGated || !form.travel_start_date;
                return (
                  <>
                    <div className="grid gap-6 md:grid-cols-3">
                      <DatePicker
                        label={rule?.anchorLabel ?? t("generic.submissionDate")}
                        value={form.planned_submission_date}
                        onChange={(v) => set("planned_submission_date", v)}
                        required={anchorNeeded}
                        minISO={todayISO}
                        error={
                          dateCheck.errors.anchor ??
                          // A weekend date saved before this rule existed (or
                          // typed in some other way) would otherwise block
                          // Continue with nothing on screen explaining why.
                          (isVietnam && form.planned_submission_date
                            ? vietnamSubmissionDateBlock(
                                form.planned_submission_date
                              )?.message
                            : undefined)
                        }
                        onOpen={onDateFocus}
                        blockedDate={isVietnam ? vietnamSubmissionDateBlock : undefined}
                      />
                      <DatePicker
                        label={t("generic.travelStart")}
                        value={form.travel_start_date}
                        onChange={(v) => {
                          set("travel_start_date", v);
                          // Vietnam's e-Visa grants a flat 30-day stay — the
                          // applicant doesn't choose a length like other
                          // destinations, so the return date is calculated
                          // right here instead of via a free DatePicker
                          // (which is disabled for Vietnam below).
                          if (isVietnam) {
                            const computedEnd = vietnamStayEndISO(v);
                            if (computedEnd) set("travel_end_date", computedEnd);
                          }
                        }}
                        minISO={startWindow.minISO}
                        maxISO={startWindow.maxISO}
                        error={dateCheck.errors.travel_start}
                        disabled={startGated}
                        onOpen={onDateFocus}
                      />
                      <DatePicker
                        label={t("generic.travelEnd")}
                        value={travelEndDate}
                        onChange={(v) => set("travel_end_date", v)}
                        minISO={form.travel_start_date || null}
                        error={dateCheck.errors.travel_end}
                        disabled={endGated || isVietnam}
                        onOpen={onDateFocus}
                      />
                    </div>
                    {startGated && rule && (
                      <p className="text-sm text-slate-500">
                        {t("generic.enterAnchorFirst").replace("{anchor}", rule.anchorLabel.toLowerCase())}
                      </p>
                    )}
                    {isVietnam && form.travel_start_date && (
                      <p className="text-sm text-slate-500">
                        {t("generic.vietnamAutoEnd")}
                      </p>
                    )}
                  </>
                );
              })()}

              {dateCheck.errors.stay && (
                <p
                  role="alert"
                  {...{ [FIELD_ERROR_ATTR]: "" }}
                  className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600"
                >
                  {dateCheck.errors.stay}
                </p>
              )}
              {dateCheck.stayDays != null && !dateCheck.errors.stay && (
                <p className="text-sm font-semibold text-slate-600">
                  {t("generic.plannedStay").replace("{days}", String(dateCheck.stayDays))}
                </p>
              )}

              <Textarea
                label={t("generic.tripReason").replace("{destination}", form.destination_country || t("generic.thisDestination"))}
                value={form.trip_reason}
                onChange={(v) => set("trip_reason", v)}
                maxWords={150}
                placeholder={t("generic.tripReasonPlaceholder").replace("{destination}", form.destination_country || t("generic.thisDestination"))}
                helpText={t("generic.tripReasonHelp")}
              />
            </section>

            {isVietnam && (
              <div className="space-y-6 border-t border-slate-200 pt-8">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900"><span aria-hidden className="sparkle text-cyan-500">✦</span>
                    Vietnam e-Visa details
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    A few extra questions the Vietnam e-Visa portal itself asks
                    for.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-5 py-4">
                  <h4 className="text-sm font-bold text-slate-800">
                    Emergency contact at home
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Vietnam&rsquo;s e-Visa form asks for someone in your home
                    country who can be reached if an emergency happens while
                    you&rsquo;re in Vietnam — an accident, hospitalisation, a lost
                    passport. It is not used for anything else, and they are not
                    contacted as part of your application.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="Family member's full name (in your home country)"
                    value={form.vietnam_family_member_name}
                    onChange={(v) =>
                      set("vietnam_family_member_name", formatName(v))
                    }
                    helpText="Latin capitals, as written in their passport."
                  />
                  <Input
                    label="Their phone number"
                    value={form.vietnam_family_member_phone}
                    onChange={(v) => set("vietnam_family_member_phone", v)}
                    type="tel"
                    inputMode="tel"
                  />
                </div>
                <Input
                  label="Their full home address"
                  value={form.vietnam_family_member_address}
                  onChange={(v) => set("vietnam_family_member_address", v)}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <Select
                    label="Relationship to you"
                    value={
                      form.vietnam_family_member_relationship
                        ? RELATIONSHIP_LABELS[
                            form.vietnam_family_member_relationship
                          ]
                        : ""
                    }
                    onChange={(v) =>
                      set(
                        "vietnam_family_member_relationship",
                        (v.toLowerCase() ||
                          "") as ApplyFormData["vietnam_family_member_relationship"]
                      )
                    }
                    options={Object.values(RELATIONSHIP_LABELS)}
                  />
                  {form.vietnam_family_member_relationship === "other" && (
                    <Input
                      label="Please specify"
                      value={form.vietnam_family_member_relationship_other}
                      onChange={(v) =>
                        set("vietnam_family_member_relationship_other", v)
                      }
                      placeholder="e.g. spouse, uncle, cousin"
                    />
                  )}
                </div>

                <BooleanChoice
                  label="Have you already bought travel insurance for this trip?"
                  value={form.vietnam_insurance_purchased}
                  onChange={(v) => set("vietnam_insurance_purchased", v)}
                  helpText="Travel insurance isn't mandatory for the Vietnam e-Visa, but it's strongly recommended — it covers medical costs if you fall ill or have an accident there."
                />

                <ChoiceGroup
                  label="Who is financing this trip?"
                  value={form.vietnam_financing_source}
                  onChange={(v) =>
                    set("vietnam_financing_source", v as "personal" | "other")
                  }
                  options={[
                    { value: "personal", label: "Personal" },
                    { value: "other", label: "Someone else" },
                  ]}
                />

                {form.vietnam_financing_source === "other" && (
                  <div className="grid gap-6 rounded-2xl border border-slate-200 p-5 md:grid-cols-2">
                    <Input
                      label="Their full name"
                      value={form.vietnam_financier_name}
                      onChange={(v) => set("vietnam_financier_name", formatName(v))}
                      helpText="Latin capitals."
                    />
                    <Input
                      label="Relationship to you"
                      value={form.vietnam_financier_relationship}
                      onChange={(v) => set("vietnam_financier_relationship", v)}
                    />
                    <Input
                      label="Their phone number"
                      value={form.vietnam_financier_phone}
                      onChange={(v) => set("vietnam_financier_phone", v)}
                      type="tel"
                      inputMode="tel"
                    />
                    <Input
                      label="Their address"
                      value={form.vietnam_financier_address}
                      onChange={(v) => set("vietnam_financier_address", v)}
                    />
                  </div>
                )}

                {/* Urgent/express service — optional, so it never blocks the
                    application. Answering "yes" is a real request an admin
                    sees in the panel, and shows our contacts right away so
                    the applicant can reach us without hunting for them. */}
                <div className="space-y-4 rounded-2xl border border-slate-200 p-5">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">
                      Need your visa urgently?
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      Standard processing takes about 3–4 business days. If you
                      can&rsquo;t wait that long, we can arrange an express e-Visa
                      in about 10 hours instead.
                    </p>
                    <p className="mt-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold leading-relaxed text-amber-800">
                      Express costs extra — it&rsquo;s a separate paid service on top
                      of the normal fee, because Vietnam charges more for urgent
                      processing. Saying yes here doesn&rsquo;t commit you to
                      anything: we&rsquo;ll tell you the exact price first, and you
                      decide then.
                    </p>
                  </div>
                  <BooleanChoice
                    label="Would you like the express service?"
                    value={form.vietnam_express_requested}
                    onChange={(v) => set("vietnam_express_requested", v)}
                    required={false}
                  />
                  {form.vietnam_express_requested === true && (
                    <SupportContactCard
                      title="Let's arrange your express visa."
                      message="Message our visa agent directly and we'll confirm the fee, the exact timing, and what we need from you."
                    />
                  )}
                </div>
              </div>
            )}

            {!isVietnam && (
              <div className="border-t border-slate-200 pt-8">
                <TravelBookingsStep
                  form={form}
                  set={set}
                  applicationId={applicationId}
                  userId={userId}
                  uploads={uploads}
                  onUploaded={onUploaded}
                  countryLabel={form.destination_country || "Japan"}
                />
              </div>
            )}
          </div>
        )}

        {current === "Companions" && (
          <CompanionsStep
            companions={form.companions}
            onChange={(c) => set("companions", c)}
          />
        )}

        {current === "Guidance" && useRichFlow && (
          <JapanGuidanceStep
            sections={activeSections}
            uploads={uploads}
            consent={consent}
            onConsentChange={setConsent}
            countryLabel={useTaiwanFlow ? "Taiwan" : "Japan"}
          />
        )}

        {current === "Guidance" && !useRichFlow && (
          <GuidanceConsentStep
            // formToSave carries the derived Vietnam return date, so the
            // review summary shows the same dates that get submitted.
            form={formToSave}
            uploads={uploads}
            eligibility={eligibility}
            stayDays={dateCheck.stayDays}
            detectedRoute={japanRoute?.type ?? null}
            consent={consent}
            onConsentChange={setConsent}
            dateRules={ruleset.dateRules}
            steps={steps}
            onEditStep={goToStep}
          />
        )}
      </div>

      {/* Footer controls */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
        <div className="flex gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={back}
              className="min-h-[2.75rem] rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {t("common.back")}
            </button>
          )}
          {/* No draft to save on the visa-free path — there's no application. */}
          {outcome !== "visa_free" && (
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="min-h-[2.75rem] rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("common.saveDraft")}
            </button>
          )}
        </div>

        {!isLastStep ? (
          <button
            type="button"
            onClick={next}
            disabled={saving}
            aria-busy={saving}
            className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl btn-glow px-8 py-3 font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {saving && <Spinner />}
            {current === "Destination" && outcome === "visa_free"
              ? t("apply.seeGuidance")
              : t("common.continue")}
          </button>
        ) : outcome === "visa_free" ? (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="min-h-[2.75rem] rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            {t("apply.backDashboard")}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={saving || !consent || !dateCheck.ok}
            aria-busy={saving}
            className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl btn-glow px-8 py-3 font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {saving && <Spinner />}
            {saving ? t("common.submitting") : t("apply.submit")}
          </button>
        )}
      </div>

      {!canAdvance && !isLastStep && (
        <p className="mt-4 text-right text-sm font-semibold text-slate-500">
          {current === "Destination" && !eligibility
            ? t("apply.selectToCheck")
            : current === "Destination" && eligibility && bookingsRequired && !bookingsConfirmed
              ? t("apply.confirmBookings")
              : t("apply.missingFields")}
        </p>
      )}

      <GuidanceModal
        open={modalOpen}
        destination={form.destination_country}
        rule={rule}
        guidance={guidance}
        eligibility={eligibility}
        recommendation={recommendation}
        onApplyRecommended={applyRecommendedDates}
        onClose={() => setModalOpen(false)}
      />

      {useJapanFlow && japanRoute && (
        <SeoulChecklistModal
          open={seoulChecklistOpen}
          route={japanRoute.type}
          statusDocs={statusDocs}
          onClose={closeSeoulChecklist}
        />
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
function Stepper({ steps, step }: { steps: string[]; step: number }) {
  const { t } = useLocale();
  const total = steps.length;
  const pct = total > 0 ? Math.round(((step + 1) / total) * 100) : 0;
  const labelFor = (name: string) => t(STEP_LABEL_KEYS[name] ?? name);
  return (
    <nav aria-label={t("apply.progress")} className="space-y-3">
      {/* Step counter + current step name (always visible, mobile-friendly) */}
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold uppercase tracking-wide text-blue-700">
          {t("apply.stepOf")
            .replace("{current}", String(Math.min(step + 1, total)))
            .replace("{total}", String(total))}
        </span>
        <span className="truncate text-sm font-semibold text-slate-600">{labelFor(steps[step])}</span>
      </div>

      {/* Progress bar: a flight route the applicant flies along */}
      <div className="relative h-2 w-full rounded-full bg-slate-100">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-[repeating-linear-gradient(90deg,transparent_0_10px,#E2E8F0_10px_16px)]"
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        <span
          aria-hidden
          className="absolute -top-2.5 -ml-3.5 text-base drop-shadow-sm transition-all duration-500"
          style={{ left: `${pct}%` }}
        >
          ✈️
        </span>
      </div>

      {/* Step chips — shown on larger screens */}
      <ol className="hidden flex-wrap gap-2 pt-1 sm:flex">
        {steps.map((label, i) => {
          const stateClass =
            i === step
              ? "border-transparent bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
              : i < step
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-500";
          return (
            <li
              key={label}
              aria-current={i === step ? "step" : undefined}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold ${stateClass}`}
            >
              <span
                aria-hidden
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  i === step ? "bg-white/25" : i < step ? "bg-blue-200/70" : "bg-slate-100"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span>{labelFor(label)}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}

// --- Eligibility presentation ---------------------------------------------
const OUTCOME_META = {
  visa_free: {
    badge: "✓ No visa required",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "text-emerald-600",
  },
  evisa: {
    badge: "✓ Electronic Visa Available",
    tone: "border-blue-200 bg-blue-50 text-blue-800",
    dot: "text-blue-600",
  },
  visa_required: {
    badge: "✓ Visa Required",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
    dot: "text-amber-600",
  },
} as const;

// Compact result shown live on the Destination step the moment we can decide.
function EligibilityBanner({ result }: { result: EligibilityResult }) {
  const { t } = useLocale();
  const meta = OUTCOME_META[result.outcome];
  const badges: Record<EligibilityResult["outcome"], string> = {
    visa_free: t("eligibility.visaFree"),
    evisa: t("eligibility.evisa"),
    visa_required: t("eligibility.visaRequired"),
  };
  return (
    <div className={`rounded-3xl border px-6 py-5 ${meta.tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-lg font-extrabold">{badges[result.outcome]}</span>
        {result.outcome === "visa_free" && (
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            {t("eligibility.noApplication")}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed">
        {result.summary}
      </p>
      {result.note && (
        <p className="mt-1 text-sm leading-relaxed opacity-80">{result.note}</p>
      )}
    </div>
  );
}

// Terminal screen for visa-free travellers — guidance instead of an application.
function VisaFreeResult({ result }: { result: EligibilityResult }) {
  const { t } = useLocale();
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-6 text-emerald-900">
        <h3 className="text-2xl font-extrabold">{t("eligibility.visaFree")}</h3>
        <p className="mt-2 font-semibold leading-relaxed">{result.summary}</p>
        {result.note && (
          <p className="mt-1 text-sm leading-relaxed opacity-80">{result.note}</p>
        )}
      </div>

      {result.maxStayDays != null && (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5">
          <p className="text-sm font-semibold text-slate-500">
            {t("eligibility.maximumStay")}
          </p>
          <p className="mt-1 text-3xl font-extrabold text-slate-900">
            {t("eligibility.days").replace("{days}", String(result.maxStayDays))}
          </p>
          <p className="mt-1 text-sm text-slate-600">{t("eligibility.perEntry")}</p>
        </div>
      )}

      <ResultList
        title={t("eligibility.entryConditions")}
        items={result.entryConditions}
        dot="text-emerald-600"
      />
      <ResultList
        title={t("eligibility.travelGuidance")}
        items={result.travelGuidance}
        dot="text-blue-600"
      />

      <p className="rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4 text-xs leading-relaxed text-slate-500">
        {t("eligibility.policyNote")}
      </p>
    </div>
  );
}

function ResultList({
  title,
  items,
  dot,
}: {
  title: string;
  items: string[];
  dot: string;
}) {
  return (
    <div>
      <h4 className="text-lg font-bold text-slate-900">{title}</h4>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-slate-700">
            <span className={`mt-0.5 font-bold ${dot}`}>✓</span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Spain-only: appointment-first information card with official + support links.
function AppointmentCard({
  info,
  confirmed,
}: {
  info: AppointmentInfo;
  confirmed: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden>🗓️</span>
        <div>
          <h4 className="font-bold text-indigo-900">{info.title}</h4>
          <p className="mt-1 text-sm leading-relaxed text-indigo-800">
            {info.message}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <a
              href={info.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {t("apply.officialAppointment")} ↗
            </a>
            <a
              href={info.supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-600 underline underline-offset-2 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              {t("apply.appointmentSupport")} ↗
            </a>
          </div>
          {confirmed && (
            <p className="mt-3 text-sm font-semibold text-emerald-700">
              {t("apply.appointmentSet")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CompanionsStep({
  companions,
  onChange,
}: {
  companions: CompanionInput[];
  onChange: (c: CompanionInput[]) => void;
}) {
  const { t } = useLocale();
  function add() {
    onChange([
      ...companions,
      {
        full_name: "",
        nationality: "",
        relationship: "",
        passport_number: "",
        is_family_member: false,
      },
    ]);
  }
  function update(i: number, patch: Partial<CompanionInput>) {
    onChange(companions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function remove(i: number) {
    onChange(companions.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-xl font-bold"><span aria-hidden className="sparkle text-cyan-500">✦</span>{t("companions.title")}</h3>
      <p className="mt-2 text-slate-600">
        {t("companions.description")}
      </p>

      <div className="mt-6 space-y-6">
        {companions.map((c, i) => (
          <div key={i} className="rounded-3xl border border-slate-200 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label={t("companions.fullName")}
                value={c.full_name}
                onChange={(v) => update(i, { full_name: v })}
              />
              <Input
                label={t("apply.nationality")}
                value={c.nationality}
                onChange={(v) => update(i, { nationality: v })}
                required={false}
              />
              <Input
                label={t("companions.relationship")}
                value={c.relationship}
                onChange={(v) => update(i, { relationship: v })}
                required={false}
              />
              <Input
                label={t("companions.passportOptional")}
                value={c.passport_number ?? ""}
                onChange={(v) => update(i, { passport_number: v })}
                required={false}
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={c.is_family_member}
                  onChange={(e) => update(i, { is_family_member: e.target.checked })}
                  className="h-4 w-4"
                />
                {t("companions.family")}
              </label>
              <button
                onClick={() => remove(i)}
                className="text-sm font-semibold text-red-500 hover:underline"
              >
                {t("common.remove")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="mt-6 rounded-2xl border border-blue-300 px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
      >
        + {t("companions.add")}
      </button>
    </div>
  );
}

function GuidanceConsentStep({
  form,
  uploads,
  eligibility,
  stayDays,
  detectedRoute,
  consent,
  onConsentChange,
  dateRules,
  steps,
  onEditStep,
}: {
  form: ApplyFormData;
  uploads: Record<string, string>;
  eligibility: EligibilityResult | null;
  stayDays: number | null;
  detectedRoute: "sticker" | "evisa" | null;
  consent: boolean;
  onConsentChange: (v: boolean) => void;
  dateRules: VisaRuleset["dateRules"];
  // The step list for this flow + a jump-to-step callback, so each review
  // section can send the applicant back to the page it came from.
  steps: string[];
  onEditStep: (step: string) => void;
}) {
  const { t } = useLocale();
  const rule = getDestinationRule(form.destination_country, dateRules);
  const krw = rule ? rule.bankRecommendationKRW.toLocaleString("en-US") : "5,000,000";
  const isVietnamDestination = form.destination_country === "Vietnam";

  // Grouped by the step each answer was given on, so "Edit" can send the
  // applicant straight back to the right page instead of making them walk
  // backwards through the whole wizard to fix one field.
  const reviewGroups: { step: string; rows: [string, string][] }[] = [
    {
      step: "Destination",
      rows: [
        [
          t("review.destination"),
          [form.destination_country, form.destination_city].filter(Boolean).join(" · "),
        ],
        [t("review.nationality"), form.nationality],
      ],
    },
    {
      step: "Applicant",
      rows: [
        ...(form.korean_visa_status
          ? ([[t("review.visaStatus"), form.korean_visa_status]] as [string, string][])
          : []),
        [t("review.fullPassportName"), form.full_name_as_passport],
        [t("review.email"), form.client_email],
        [t("review.phone"), form.client_phone],
        [
          t("review.travelDates"),
          [form.travel_start_date, form.travel_end_date].filter(Boolean).join(" → "),
        ],
        [
          t("review.plannedStay"),
          stayDays != null ? t("review.days").replace("{days}", String(stayDays)) : "—",
        ],
        [t("review.documentsUploaded"), String(Object.keys(uploads).length)],
      ],
    },
    // Only some flows collect companions — don't offer to edit a step the
    // applicant never saw.
    ...(steps.includes("Companions")
      ? [
          {
            step: "Companions",
            rows: [
              [
                t("review.companions"),
                String(form.companions.filter((c) => c.full_name.trim()).length),
              ],
            ] as [string, string][],
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="flex items-center gap-2 text-xl font-bold"><span aria-hidden className="sparkle text-cyan-500">✦</span>
          {form.destination_country || t("review.destination")} {t("guidance.title")}
        </h3>

        {eligibility && eligibility.outcome === "evisa" && (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-800">
            ✓ {t("guidance.evisaAvailable")} — {eligibility.summary} {t("guidance.evisaContinue")}
          </div>
        )}

        {detectedRoute && (
          <div
            className={`mt-4 rounded-2xl border px-5 py-3 text-sm font-semibold ${
              detectedRoute === "sticker"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-blue-200 bg-blue-50 text-blue-800"
            }`}
          >
            {t("guidance.japanRoute")}: {detectedRoute === "sticker" ? t("guidance.stickerVisa") : "eVisa"}.{" "}
            {detectedRoute === "sticker"
              ? t("guidance.stickerInstructions")
              : t("guidance.evisaPassport")}
          </div>
        )}

        {rule && (
          <div className="mt-4 space-y-4">
            <p className="leading-relaxed text-slate-700">{rule.guidance}</p>
            <p className="rounded-2xl bg-slate-50 px-5 py-3 text-sm text-slate-700">
              <strong>{t("guidance.processing")}:</strong> {rule.processingText}
            </p>
            {/* Only shown where a bank balance is actually part of the
                requirements — Vietnam's e-Visa doesn't ask for proof of
                funds, so quoting a figure there would invent a requirement. */}
            {rule.bankRecommendationKRW > 0 && (
              <p className="rounded-2xl bg-slate-50 px-5 py-3 text-sm text-slate-700">
                <strong>{t("guidance.bankBalance")}:</strong> {t("guidance.atLeast").replace("{amount}", krw)}
              </p>
            )}

            {rule.contacts.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {rule.contacts.map((c) => (
                  <div
                    key={c.office}
                    className="rounded-2xl border border-slate-200 p-5 text-sm"
                  >
                    <p className="font-bold text-slate-900">{c.office}</p>
                    <p className="mt-1 text-slate-600">{c.address}</p>
                    <p className="mt-1 text-slate-600">{c.phone}</p>
                    {c.email && <p className="text-blue-700">{c.email}</p>}
                  </div>
                ))}
              </div>
            )}

            <details className="rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-semibold text-slate-800">
                {t("guidance.documentChecklist")}
              </summary>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {rule.documents.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </details>

            {/* What actually happens next. Vietnam's e-Visa is issued by
                email, so it gets its own wording — telling a Vietnam
                applicant to expect a "document package" and hotel bookings
                would describe a service they didn't buy. */}
            {isVietnamDestination ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm leading-relaxed text-emerald-900">
                {t("guidance.vietnamProcess")}
              </p>
            ) : (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
                {t("guidance.afterSubmission")}
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-xl font-bold"><span aria-hidden className="sparkle text-cyan-500">✦</span>{t("guidance.review")}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("guidance.reviewHelp")}
        </p>
        <div className="mt-4 space-y-4">
          {reviewGroups.map((group) => (
            <dl
              key={group.step}
              className="divide-y divide-slate-200 rounded-3xl border border-slate-200"
            >
              <div className="flex items-center justify-between gap-4 px-6 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {group.step}
                </span>
                <button
                  type="button"
                  onClick={() => onEditStep(group.step)}
                  className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {t("common.edit")}
                </button>
              </div>
              {group.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-6 py-3.5">
                  <dt className="text-sm font-semibold text-slate-500">{k}</dt>
                  <dd className="text-right font-semibold text-slate-900">
                    {v || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-300 bg-slate-50 p-5">
        <p className="text-xs leading-relaxed text-slate-500">
          {t("guidance.disclaimer")}
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="mt-0.5 h-5 w-5"
          />
          {t("guidance.consent")}
        </label>
      </div>
    </div>
  );
}
