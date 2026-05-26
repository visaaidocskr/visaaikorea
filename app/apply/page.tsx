"use client";

import { useState } from "react";

export default function ApplyPage() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    nationality: "",
    koreanVisa: "",
    destination: "",
    appointmentDate: "",
    travelDate: "",
    returnDate: "",
    koreaArrivalDate: "",
    universityName: "",
    graduationDate: "",
    studyField: "",
    studyLevel: "",
    futurePlans: "",
    japanReason: "",
    previousWork: "",
  });

  const [files, setFiles] = useState({
    passport: null as File | null,
    arcFront: null as File | null,
    arcBack: null as File | null,
    enrollmentCertificate: null as File | null,
    employmentCertificate: null as File | null,
    businessCertificate: null as File | null,
    employmentContract: null as File | null,
    crewConfirmation: null as File | null,
    familyCertificate: null as File | null,
    incomeCertificate: null as File | null,
    marriageCertificate: null as File | null,
    f4Proof: null as File | null,
    g1ReasonDocument: null as File | null,
  });

  function formatDateInput(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 8);
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 4)}/${numbers.slice(4)}`;
    return `${numbers.slice(0, 4)}/${numbers.slice(4, 6)}/${numbers.slice(6)}`;
  }

  function parseDate(value: string) {
    const pattern = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!pattern.test(value)) return null;

    const [year, month, day] = value.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    date.setHours(0, 0, 0, 0);
    return date;
  }

  function addDays(date: Date, days: number) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  }

  function addMonths(date: Date, months: number) {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    return newDate;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const generalMinTravelDate = addDays(today, 10);
  const generalMaxTravelDate = addDays(today, 30);

  const appointmentDateObject = parseDate(formData.appointmentDate);
  const travelDateObject = parseDate(formData.travelDate);
  const returnDateObject = parseDate(formData.returnDate);

  const isSpain = formData.destination === "Spain";

  const spainMinTravelDate = appointmentDateObject
    ? addDays(appointmentDateObject, 21)
    : null;

  const spainMaxTravelDate = appointmentDateObject
    ? addMonths(appointmentDateObject, 3)
    : null;

  const isAppointmentDateValid =
    !isSpain ||
    (appointmentDateObject !== null && appointmentDateObject >= today);

  const isTravelDateValid =
    travelDateObject !== null &&
    (isSpain
      ? appointmentDateObject !== null &&
        spainMinTravelDate !== null &&
        spainMaxTravelDate !== null &&
        travelDateObject >= spainMinTravelDate &&
        travelDateObject <= spainMaxTravelDate
      : travelDateObject >= generalMinTravelDate &&
        travelDateObject <= generalMaxTravelDate);

  const isReturnDateValid =
    returnDateObject !== null &&
    travelDateObject !== null &&
    returnDateObject >= travelDateObject;

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    const dateFields = ["appointmentDate", "travelDate", "returnDate"];

    setFormData({
      ...formData,
      [name]: dateFields.includes(name) ? formatDateInput(value) : value,
    });
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    fileName: keyof typeof files
  ) {
    setFiles({ ...files, [fileName]: event.target.files?.[0] || null });
  }

  const isKazakhstan = formData.nationality === "Kazakhstan";
  const isKazakhstanVisaFreeJapan =
    isKazakhstan && formData.destination === "Japan";

  const kazakhstanSupported =
    isKazakhstan &&
    (formData.destination === "Spain" || formData.destination === "Taiwan");

  const shouldShowUpload =
    formData.destination !== "" &&
    !isKazakhstanVisaFreeJapan &&
    (!isKazakhstan || kazakhstanSupported);

  const needsEnrollment =
    formData.koreanVisa === "D-2 Student Visa" ||
    formData.koreanVisa === "D-4 Language Student Visa";

  const needsEmployment =
    formData.koreanVisa === "D-7 Intra-company Transfer Visa" ||
    formData.koreanVisa === "E-1 Professor Visa" ||
    formData.koreanVisa === "E-2 Foreign Language Instructor Visa" ||
    formData.koreanVisa === "E-3 Research Visa" ||
    formData.koreanVisa === "E-4 Technology Transfer Visa" ||
    formData.koreanVisa === "E-5 Professional Employment Visa" ||
    formData.koreanVisa === "E-6 Culture / Entertainment Visa" ||
    formData.koreanVisa === "E-7 Specially Designated Activities Visa";

  const needsBusiness =
    formData.koreanVisa === "D-8 Business Investment Visa" ||
    formData.koreanVisa === "D-9 International Trade Visa";

  const needsEmploymentOrContract =
    formData.koreanVisa === "E-8 Seasonal Worker Visa" ||
    formData.koreanVisa === "E-9 Non-professional Employment Visa";

  const needsEmploymentOrCrew =
    formData.koreanVisa === "E-10 Ship Crew Visa";

  const needsFamily =
    formData.koreanVisa === "F-1 Visiting or Joining Family Visa" ||
    formData.koreanVisa === "F-3 Dependent Family Visa";

  const needsIncome =
    formData.koreanVisa === "F-2 Residence Visa" ||
    formData.koreanVisa === "F-5 Permanent Resident Visa";

  const needsMarriage = formData.koreanVisa === "F-6 Marriage Migrant Visa";
  const needsF4 = formData.koreanVisa === "F-4 Overseas Korean Visa";
  const needsG1 = formData.koreanVisa === "G-1 Miscellaneous Visa";
  const isD10 = formData.koreanVisa === "D-10 Job Seeking Visa";

  const basicCompleted =
    formData.nationality &&
    formData.koreanVisa &&
    formData.destination &&
    formData.travelDate &&
    formData.returnDate &&
    formData.email &&
    formData.phone &&
    isTravelDateValid &&
    isReturnDateValid &&
    isAppointmentDateValid &&
    (!isSpain || formData.appointmentDate);

  const documentsCompleted =
    shouldShowUpload &&
    files.passport &&
    files.arcFront &&
    files.arcBack &&
    (!needsEnrollment || files.enrollmentCertificate) &&
    (!needsEmployment || files.employmentCertificate) &&
    (!needsBusiness || files.businessCertificate) &&
    (!needsEmploymentOrContract ||
      files.employmentCertificate ||
      files.employmentContract) &&
    (!needsEmploymentOrCrew ||
      files.employmentCertificate ||
      files.crewConfirmation) &&
    (!needsFamily || files.familyCertificate) &&
    (!needsIncome || files.incomeCertificate || files.employmentCertificate) &&
    (!needsMarriage || files.marriageCertificate) &&
    (!needsF4 || files.f4Proof) &&
    (!needsG1 || files.g1ReasonDocument);

  const d10Completed =
    !isD10 ||
    (formData.koreaArrivalDate &&
      formData.universityName &&
      formData.graduationDate &&
      formData.studyField &&
      formData.studyLevel &&
      formData.futurePlans &&
      formData.japanReason &&
      formData.previousWork);

  const isFormComplete = basicCompleted && documentsCompleted && d10Completed;

  function handleSubmit() {
    if (!isFormComplete) return;
    localStorage.setItem("visaApplication", JSON.stringify(formData));
    window.location.href = "/result";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-14 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-700">
            VISA APPLICATION SYSTEM
          </p>
          <h1 className="text-5xl font-extrabold">Tourist Visa Application</h1>
          <p className="mt-5 text-xl text-slate-600">
            Fill your information and upload required documents for AI embassy document preparation.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-10 shadow-2xl">
          <div className="grid gap-8 md:grid-cols-2">
            <Select label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange}
              options={["Uzbekistan", "Kazakhstan", "Russia", "Kyrgyzstan", "Tajikistan"]} />

            <Select label="Korean Visa Type" name="koreanVisa" value={formData.koreanVisa} onChange={handleChange}
              options={[
                "D-2 Student Visa", "D-4 Language Student Visa", "D-7 Intra-company Transfer Visa",
                "D-8 Business Investment Visa", "D-9 International Trade Visa", "D-10 Job Seeking Visa",
                "E-1 Professor Visa", "E-2 Foreign Language Instructor Visa", "E-3 Research Visa",
                "E-4 Technology Transfer Visa", "E-5 Professional Employment Visa",
                "E-6 Culture / Entertainment Visa", "E-7 Specially Designated Activities Visa",
                "E-8 Seasonal Worker Visa", "E-9 Non-professional Employment Visa", "E-10 Ship Crew Visa",
                "F-1 Visiting or Joining Family Visa", "F-2 Residence Visa", "F-3 Dependent Family Visa",
                "F-4 Overseas Korean Visa", "F-5 Permanent Resident Visa", "F-6 Marriage Migrant Visa",
                "G-1 Miscellaneous Visa",
              ]} />

            <Select label="Destination Country" name="destination" value={formData.destination} onChange={handleChange}
              options={["Japan", "Spain", "Singapore", "Taiwan"]} />

            {isSpain && (
              <Input
                label="Spain Embassy Appointment Date"
                name="appointmentDate"
                placeholder="YYYY/MM/DD"
                value={formData.appointmentDate}
                onChange={handleChange}
                error={
                  formData.appointmentDate && !isAppointmentDateValid
                    ? "Appointment date must be today or a future date."
                    : ""
                }
              />
            )}

            <Input
              label="Travel Date"
              name="travelDate"
              placeholder="YYYY/MM/DD"
              value={formData.travelDate}
              onChange={handleChange}
              error={
                formData.travelDate && !isTravelDateValid
                  ? isSpain
                    ? "For Spain, travel date must be at least 3 weeks after appointment and within 3 months."
                    : "Travel date must be between 10 and 30 days from today."
                  : ""
              }
            />

            <Input
              label="Return Date"
              name="returnDate"
              placeholder="YYYY/MM/DD"
              value={formData.returnDate}
              onChange={handleChange}
              error={
                formData.returnDate && !isReturnDateValid
                  ? "Return date must be the same day or after travel date."
                  : ""
              }
            />
          </div>

          {isKazakhstanVisaFreeJapan && (
            <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-xl font-bold text-emerald-700">
                Visa-Free Travel Information
              </p>
              <p className="mt-3 leading-relaxed text-slate-700">
                Citizens of Kazakhstan can travel to Japan visa-free for short-term stays up to 90 days.
              </p>
              <p className="mt-3 leading-relaxed text-slate-700">
                You may not need a tourist visa. Please prepare your passport, travel plan,
                hotel booking, and return ticket for immigration screening.
              </p>
            </div>
          )}

          {shouldShowUpload && (
            <div className="mt-12 rounded-3xl border border-blue-100 bg-blue-50 p-8">
              <h2 className="text-3xl font-extrabold">Required Documents Upload</h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <Input label="Email" name="email" placeholder="example@email.com" value={formData.email} onChange={handleChange}
                  error={!formData.email ? "Email is required." : ""} />
                <Input label="Phone Number" name="phone" placeholder="010-0000-0000" value={formData.phone} onChange={handleChange}
                  error={!formData.phone ? "Phone number is required." : ""} />

                <UploadField label="Passport Copy" file={files.passport} onChange={(e: any) => handleFileChange(e, "passport")} />
                <UploadField label="ARC Front Side" file={files.arcFront} onChange={(e: any) => handleFileChange(e, "arcFront")} />
                <UploadField label="ARC Back Side" file={files.arcBack} onChange={(e: any) => handleFileChange(e, "arcBack")} />

                {needsEnrollment && <UploadField label="재학증명서 / Enrollment Certificate" file={files.enrollmentCertificate} onChange={(e: any) => handleFileChange(e, "enrollmentCertificate")} />}
                {needsEmployment && <UploadField label="재직증명서 / Employment Certificate" file={files.employmentCertificate} onChange={(e: any) => handleFileChange(e, "employmentCertificate")} />}
                {needsBusiness && <UploadField label="사업자등록증 / Business Registration Certificate" file={files.businessCertificate} onChange={(e: any) => handleFileChange(e, "businessCertificate")} />}
                {needsEmploymentOrContract && <UploadField label="재직증명서 or 근로계약서 / Employment Certificate or Contract" file={files.employmentContract} onChange={(e: any) => handleFileChange(e, "employmentContract")} />}
                {needsEmploymentOrCrew && <UploadField label="재직증명서 or 승선확인서 / Employment Certificate or Crew Confirmation" file={files.crewConfirmation} onChange={(e: any) => handleFileChange(e, "crewConfirmation")} />}
                {needsFamily && <UploadField label="가족관계증명서 / Family Relationship Document" file={files.familyCertificate} onChange={(e: any) => handleFileChange(e, "familyCertificate")} />}
                {needsIncome && <UploadField label="재직증명서 or 소득금액증명원 / Employment or Income Certificate" file={files.incomeCertificate} onChange={(e: any) => handleFileChange(e, "incomeCertificate")} />}
                {needsMarriage && <UploadField label="혼인관계증명서 / Marriage Certificate" file={files.marriageCertificate} onChange={(e: any) => handleFileChange(e, "marriageCertificate")} />}
                {needsF4 && <UploadField label="F-4 Status Proof Document" file={files.f4Proof} onChange={(e: any) => handleFileChange(e, "f4Proof")} />}
                {needsG1 && <UploadField label="G-1 Reason Document" file={files.g1ReasonDocument} onChange={(e: any) => handleFileChange(e, "g1ReasonDocument")} />}
              </div>
            </div>
          )}

          {isD10 && shouldShowUpload && (
            <div className="mt-12 rounded-3xl border border-amber-100 bg-amber-50 p-8">
              <h2 className="text-3xl font-extrabold">D-10 Additional Questions</h2>

              <div className="mt-8 grid gap-6">
                <Input name="koreaArrivalDate" placeholder="When did you arrive in Korea?" value={formData.koreaArrivalDate} onChange={handleChange} error={!formData.koreaArrivalDate ? "This field is required." : ""} />
                <Input name="universityName" placeholder="Which university did you study at?" value={formData.universityName} onChange={handleChange} error={!formData.universityName ? "This field is required." : ""} />
                <Input name="graduationDate" placeholder="When did you graduate?" value={formData.graduationDate} onChange={handleChange} error={!formData.graduationDate ? "This field is required." : ""} />
                <Input name="studyField" placeholder="What did you study?" value={formData.studyField} onChange={handleChange} error={!formData.studyField ? "This field is required." : ""} />

                <select name="studyLevel" value={formData.studyLevel} onChange={handleChange} className="rounded-2xl border border-slate-300 px-5 py-4">
                  <option value="">Select study level</option>
                  <option>Language School</option>
                  <option>Bachelors</option>
                  <option>Masters</option>
                  <option>PhD</option>
                </select>
                {!formData.studyLevel && <p className="text-sm font-semibold text-red-500">Study level is required.</p>}

                <textarea name="futurePlans" placeholder="What are your future plans?" value={formData.futurePlans} onChange={handleChange} className="rounded-2xl border border-slate-300 px-5 py-4" />
                {!formData.futurePlans && <p className="text-sm font-semibold text-red-500">Future plans are required.</p>}

                <textarea name="japanReason" placeholder="Why do you want to visit this destination?" value={formData.japanReason} onChange={handleChange} className="rounded-2xl border border-slate-300 px-5 py-4" />
                {!formData.japanReason && <p className="text-sm font-semibold text-red-500">Travel reason is required.</p>}

                <textarea name="previousWork" placeholder="Previous work or study experience" value={formData.previousWork} onChange={handleChange} className="rounded-2xl border border-slate-300 px-5 py-4" />
                {!formData.previousWork && <p className="text-sm font-semibold text-red-500">Previous experience is required.</p>}
              </div>
            </div>
          )}

          {shouldShowUpload && !isFormComplete && (
            <p className="mt-8 text-center text-sm font-semibold text-red-500">
              Please complete all required fields, documents, and valid dates.
            </p>
          )}

          {shouldShowUpload && (
            <button
              onClick={handleSubmit}
              disabled={!isFormComplete}
              className={`mt-10 w-full rounded-2xl py-5 text-xl font-bold transition ${
                isFormComplete
                  ? "bg-blue-700 text-white hover:bg-blue-800"
                  : "cursor-not-allowed bg-slate-300 text-slate-500"
              }`}
            >
              Generate AI Documents
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Input({ label, name, placeholder, value, onChange, error }: any) {
  return (
    <div>
      {label && <label className="mb-3 block text-lg font-semibold">{label}</label>}
      <input
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-300 px-5 py-4"
      />
      {error && <p className="mt-2 text-sm font-semibold text-red-500">{error}</p>}
    </div>
  );
}

function Select({ label, name, value, onChange, options }: any) {
  return (
    <div>
      <label className="mb-3 block text-lg font-semibold">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-300 px-5 py-4"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((item: string) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      {!value && <p className="mt-2 text-sm font-semibold text-red-500">{label} is required.</p>}
    </div>
  );
}

function UploadField({ label, file, onChange }: any) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-blue-300 bg-white p-6 transition hover:border-blue-600 hover:bg-blue-50">
      <label className="block cursor-pointer">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
            📄
          </div>

          <p className="text-lg font-bold text-slate-900">{label}</p>

          <p className="mt-2 text-sm text-slate-500">
            Click to upload JPG, PNG, PDF, DOC, or DOCX
          </p>

          <div className="mt-4 rounded-xl bg-blue-700 px-5 py-2 text-sm font-bold text-white">
            Choose File
          </div>

          <input type="file" onChange={onChange} className="hidden" />

          {file ? (
            <p className="mt-3 text-sm font-semibold text-green-600">
              Uploaded: {file.name}
            </p>
          ) : (
            <p className="mt-3 text-sm font-semibold text-red-500">
              This document is required.
            </p>
          )}
        </div>
      </label>
    </div>
  );
}