"use client";

import { useState } from "react";

export default function ApplyPage() {
  const [formData, setFormData] = useState({
    nationality: "",
    koreanVisa: "",
    destination: "",
    otherDestination: "",
    travelDate: "",
    returnDate: "",
  });

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const japanMinimumDate = new Date(today);
  japanMinimumDate.setDate(today.getDate() + 10);

  const maxAllowedDate = new Date(today);
  maxAllowedDate.setFullYear(today.getFullYear() + 2);

  const travelDateObject = parseDate(formData.travelDate);
  const returnDateObject = parseDate(formData.returnDate);

  const isJapan = formData.destination === "Japan";

  const isTravelDateValid =
    travelDateObject !== null &&
    travelDateObject <= maxAllowedDate &&
    (isJapan ? travelDateObject >= japanMinimumDate : travelDateObject >= today);

  const isReturnDateValid =
    returnDateObject !== null &&
    travelDateObject !== null &&
    returnDateObject >= travelDateObject &&
    returnDateObject <= maxAllowedDate;

  const isFormComplete =
    formData.nationality.trim() !== "" &&
    formData.koreanVisa.trim() !== "" &&
    formData.destination.trim() !== "" &&
    formData.travelDate.trim() !== "" &&
    formData.returnDate.trim() !== "" &&
    isTravelDateValid &&
    isReturnDateValid &&
    (formData.destination !== "Other" ||
      formData.otherDestination.trim() !== "");

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function handleSubmit() {
    if (!isFormComplete) return;

    const finalData = {
      ...formData,
      destination:
        formData.destination === "Other"
          ? formData.otherDestination
          : formData.destination,
    };

    localStorage.setItem("visaApplication", JSON.stringify(finalData));
    window.location.href = "/upload";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-14 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-700">
            AI VISA APPLICATION
          </p>

          <h1 className="text-5xl font-extrabold text-slate-900">
            Tourist Visa Application
          </h1>

          <p className="mt-5 text-xl text-slate-600">
            Enter your information and let AI prepare your tourist visa documents.
          </p>
        </div>

        <div className="rounded-[2rem] bg-white p-10 shadow-2xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-lg font-semibold">
                Nationality
              </label>

              <select
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-semibold outline-none focus:border-blue-700"
              >
                <option value="">Select nationality</option>
                <option>Uzbekistan</option>
                <option>Kazakhstan</option>
                <option>Russia</option>
                <option>Kyrgyzstan</option>
                <option>Tajikistan</option>
              </select>
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold">
                Korean Visa Type
              </label>

              <select
                name="koreanVisa"
                value={formData.koreanVisa}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-semibold outline-none focus:border-blue-700"
              >
                <option value="">Select Korean visa type</option>
                <option>D-2 Student Visa</option>
                <option>D-4 Language Student Visa</option>
                <option>D-7 Intra-company Transfer Visa</option>
                <option>D-8 Business Investment Visa</option>
                <option>D-9 International Trade Visa</option>
                <option>D-10 Job Seeking Visa</option>
                <option>E-1 Professor Visa</option>
                <option>E-2 Foreign Language Instructor Visa</option>
                <option>E-3 Research Visa</option>
                <option>E-4 Technology Transfer Visa</option>
                <option>E-5 Professional Employment Visa</option>
                <option>E-6 Culture / Entertainment Visa</option>
                <option>E-7 Specially Designated Activities Visa</option>
                <option>E-9 Non-professional Employment Visa</option>
                <option>F-1 Visiting or Joining Family Visa</option>
                <option>F-2 Residence Visa</option>
                <option>F-3 Dependent Family Visa</option>
                <option>F-4 Overseas Korean Visa</option>
                <option>F-5 Permanent Resident Visa</option>
                <option>F-6 Marriage Migrant Visa</option>
                <option>H-1 Working Holiday Visa</option>
                <option>H-2 Working Visit Visa</option>
                <option>G-1 Miscellaneous Visa</option>
                <option>C-3 Short-term Visa</option>
              </select>
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold">
                Destination Country
              </label>

              <select
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-semibold outline-none focus:border-blue-700"
              >
                <option value="">Select destination country</option>
                <option>Japan</option>
                <option>Vietnam</option>
                <option>Spain</option>
                <option>UK</option>
                <option>Taiwan</option>
                <option>Hong Kong</option>
                <option>Singapore</option>
                <option>Brazil</option>
                <option>America</option>
                <option>Canada</option>
                <option>Australia</option>
                <option>New Zealand</option>
                <option>Saudi Arabia</option>
                <option>Other</option>
              </select>
            </div>

            {formData.destination === "Other" && (
              <div>
                <label className="mb-3 block text-lg font-semibold">
                  Enter Destination Country
                </label>

                <input
                  name="otherDestination"
                  type="text"
                  value={formData.otherDestination}
                  onChange={handleChange}
                  placeholder="Example: France"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-semibold placeholder:text-slate-400 outline-none focus:border-blue-700"
                />
              </div>
            )}

            <div>
              <label className="mb-3 block text-lg font-semibold">
                Travel Date
              </label>

              <input
                name="travelDate"
                type="text"
                placeholder="YYYY/MM/DD"
                value={formData.travelDate}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-semibold placeholder:text-slate-400 outline-none focus:border-blue-700"
              />

              {formData.travelDate && !isTravelDateValid && (
                <p className="mt-2 text-sm font-semibold text-red-500">
                  {isJapan
                    ? "For Japan, travel date must be at least 10 days from today."
                    : "Travel date must be a real future date. Example: 2026/05/24"}
                </p>
              )}
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold">
                Return Date
              </label>

              <input
                name="returnDate"
                type="text"
                placeholder="YYYY/MM/DD"
                value={formData.returnDate}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-semibold placeholder:text-slate-400 outline-none focus:border-blue-700"
              />

              {formData.returnDate && !isReturnDateValid && (
                <p className="mt-2 text-sm font-semibold text-red-500">
                  Return date must be a real date after the travel date.
                </p>
              )}
            </div>
          </div>

          {isJapan && (
            <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <p className="mb-2 text-lg font-bold text-amber-700">
                Japan Visa Date Rule
              </p>

              <p className="leading-relaxed text-slate-700">
                Japan tourist visa processing usually takes around 7–10 business
                days. Please choose your travel date at least 10 days after
                today so your documents can be prepared and submitted safely.
              </p>
            </div>
          )}

          {!isFormComplete && (
            <p className="mt-6 text-center text-sm font-semibold text-red-500">
              Please complete all fields and enter valid travel dates before continuing.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isFormComplete}
            className={`mt-10 block w-full rounded-2xl py-5 text-center text-xl font-bold transition ${
              isFormComplete
                ? "bg-blue-700 text-white hover:bg-blue-800"
                : "cursor-not-allowed bg-slate-300 text-slate-500"
            }`}
          >
            Continue to Document Upload
          </button>
        </div>
      </div>
    </main>
  );
}