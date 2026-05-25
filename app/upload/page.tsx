"use client";

import { useEffect, useState } from "react";

export default function UploadPage() {
  const [applicationData, setApplicationData] = useState<any>(null);

  const [passportFront, setPassportFront] = useState<File | null>(null);
  const [passportBack, setPassportBack] = useState<File | null>(null);
  const [arcFront, setArcFront] = useState<File | null>(null);
  const [arcBack, setArcBack] = useState<File | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    const savedData = localStorage.getItem("visaApplication");

    if (savedData) {
      setApplicationData(JSON.parse(savedData));
    }
  }, []);

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const maxSize = 10 * 1024 * 1024;

  function validateFile(file: File | null) {
    if (!file) return false;

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, JPEG, PNG, PDF, DOC, and DOCX files are allowed."
      );
      return false;
    }

    if (file.size > maxSize) {
      setError("Maximum file size is 10MB.");
      return false;
    }

    setError("");
    return true;
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<File | null>>
  ) {
    const file = event.target.files?.[0] || null;

    if (validateFile(file)) {
      setter(file);
    }
  }

  const isReady =
    passportFront &&
    passportBack &&
    arcFront &&
    arcBack;

  function handleContinue() {
    if (!isReady) return;

    alert("Documents uploaded successfully!");

    window.location.href = "/result";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-14 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-700">
            DOCUMENT UPLOAD
          </p>

          <h1 className="text-5xl font-extrabold">
            Upload Required Documents
          </h1>

          <p className="mt-5 text-xl text-slate-600">
            Upload passport and Korean ARC documents to continue AI visa preparation.
          </p>
        </div>

        {applicationData && (
          <div className="mb-10 rounded-[2rem] bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-3xl font-bold">
              Applicant Summary
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-6">
                <p className="text-sm text-slate-500">
                  Nationality
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {applicationData.nationality}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-6">
                <p className="text-sm text-slate-500">
                  Korean Visa
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {applicationData.koreanVisa}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-6">
                <p className="text-sm text-slate-500">
                  Destination
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {applicationData.destination}
                </p>
              </div>

              <div className="rounded-3xl bg-slate-50 p-6">
                <p className="text-sm text-slate-500">
                  Travel Dates
                </p>

                <p className="mt-2 text-xl font-bold">
                  {applicationData.travelDate}
                </p>

                <p className="text-xl font-bold">
                  {applicationData.returnDate}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[2rem] bg-white p-10 shadow-2xl">
          <div className="mb-8 rounded-3xl border border-blue-100 bg-blue-50 p-6">
            <p className="text-lg font-bold text-blue-700">
              Upload Rules
            </p>

            <ul className="mt-4 space-y-2 text-slate-700">
              <li>• Allowed formats: JPG, JPEG, PNG, PDF, DOC, DOCX</li>
              <li>• Maximum file size: 10MB</li>
              <li>• Uploaded documents should be clear and readable</li>
            </ul>
          </div>

          {error && (
            <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="font-semibold text-red-600">{error}</p>
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <label className="mb-3 block text-lg font-semibold">
                Passport Front Page
              </label>

              <input
                type="file"
                onChange={(e) =>
                  handleFileChange(e, setPassportFront)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4"
              />

              {passportFront && (
                <p className="mt-3 text-sm font-semibold text-green-600">
                  Uploaded: {passportFront.name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold">
                Passport Additional Page
              </label>

              <input
                type="file"
                onChange={(e) =>
                  handleFileChange(e, setPassportBack)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4"
              />

              {passportBack && (
                <p className="mt-3 text-sm font-semibold text-green-600">
                  Uploaded: {passportBack.name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold">
                Korean ARC Front Side
              </label>

              <input
                type="file"
                onChange={(e) =>
                  handleFileChange(e, setArcFront)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4"
              />

              {arcFront && (
                <p className="mt-3 text-sm font-semibold text-green-600">
                  Uploaded: {arcFront.name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-3 block text-lg font-semibold">
                Korean ARC Back Side
              </label>

              <input
                type="file"
                onChange={(e) =>
                  handleFileChange(e, setArcBack)
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4"
              />

              {arcBack && (
                <p className="mt-3 text-sm font-semibold text-green-600">
                  Uploaded: {arcBack.name}
                </p>
              )}
            </div>
          </div>

          {!isReady && (
            <p className="mt-8 text-center text-sm font-semibold text-red-500">
              Please upload all required documents before continuing.
            </p>
          )}

          <button
            onClick={handleContinue}
            disabled={!isReady}
            className={`mt-10 block w-full rounded-2xl py-5 text-center text-xl font-bold transition ${
              isReady
                ? "bg-blue-700 text-white hover:bg-blue-800"
                : "cursor-not-allowed bg-slate-300 text-slate-500"
            }`}
          >
            Generate Embassy Documents
          </button>
        </div>
      </div>
    </main>
  );
}