export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <nav className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
        <h1 className="text-2xl font-extrabold text-blue-700">
          VisaAI Korea
        </h1>

        <div className="hidden md:flex items-center gap-8 text-slate-600 font-medium">
          <a href="#services">Services</a>
          <a href="#plans">Plans</a>
          <a href="#countries">Countries</a>
          <a href="#how">How it works</a>
        </div>

        <a
          href="/apply"
          className="rounded-xl bg-blue-700 px-5 py-2 font-semibold text-white"
        >
          Start Now
        </a>
      </nav>

      <section className="grid items-center gap-16 px-8 py-20 md:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex rounded-full bg-blue-100 px-5 py-2 text-sm font-semibold text-blue-700">
            AI for foreigners living in South Korea
          </div>

          <h1 className="mb-8 text-6xl font-extrabold leading-tight md:text-7xl">
            Prepare all tourist visa documents in
            <span className="text-blue-700"> seconds.</span>
          </h1>

          <p className="mb-10 max-w-xl text-xl leading-relaxed text-slate-600">
            VisaAI Korea helps foreigners in Korea prepare all required embassy
            documents for tourist visas using AI. Choose your destination
            country and get your complete document package instantly.
          </p>

          <a
            href="/apply"
            className="inline-block rounded-2xl bg-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-xl"
          >
            Generate Documents
          </a>
        </div>

        <div className="rounded-[2.5rem] border border-slate-200 bg-slate-50 p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-3xl font-bold">AI Document Package</h2>
              <p className="mt-2 text-slate-500">Tourist Visa Application</p>
            </div>

            <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
              ✓ Ready
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="mb-2 text-sm text-slate-500">Applicant</p>
              <p className="text-2xl font-bold">Foreigners living in Korea</p>
              <p className="mt-2 text-slate-500">
                Any nationality · Any Korean visa status
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6">
              <p className="mb-2 text-sm text-slate-500">Included documents</p>
              <p className="text-2xl font-bold">
                All required tourist visa documents
              </p>
              <p className="mt-2 text-slate-500">
                Generated based on destination country and applicant profile
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
              <p className="mb-3 text-lg font-bold text-blue-700">
                AI Assistant
              </p>
              <p className="leading-relaxed text-slate-700">
                Take a rest, choose your dream country, and let AI prepare your
                embassy documents for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-slate-50 px-8 py-20">
        <h2 className="mb-4 text-center text-5xl font-bold">
          Complete embassy document package
        </h2>

        <p className="mx-auto mb-14 max-w-3xl text-center text-xl text-slate-600">
          AI-powered tourist visa document preparation for foreigners living in Korea.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="mb-4 text-3xl font-bold">AI Documents</h3>
            <p className="text-slate-600">
              Automatically generate embassy-ready tourist visa documents in seconds.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="mb-4 text-3xl font-bold">Country Support</h3>
            <p className="text-slate-600">
              Documents customized for different embassy requirements and destinations.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h3 className="mb-4 text-3xl font-bold">Smart AI Guidance</h3>
            <p className="text-slate-600">
              AI recommendations based on your visa type, travel history, and destination.
            </p>
          </div>
        </div>
      </section>

      <section id="plans" className="px-8 py-20">
        <h2 className="mb-4 text-center text-5xl font-bold">Choose your plan</h2>
        <p className="mx-auto mb-14 max-w-3xl text-center text-xl text-slate-600">
          Flexible options for travelers and frequent applicants.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 p-8">
            <h3 className="mb-4 text-3xl font-bold">Basic</h3>
            <p className="mb-8 text-slate-600">Best for one-time travelers.</p>
            <ul className="space-y-4 text-lg text-slate-700">
              <li>✓ 1 destination country</li>
              <li>✓ Embassy-ready documents</li>
              <li>✓ AI recommendations</li>
              <li>✓ Fast generation</li>
            </ul>
          </div>

          <div className="rounded-3xl border-2 border-blue-700 p-8 shadow-2xl">
            <div className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
              Most Popular
            </div>
            <h3 className="mb-4 text-3xl font-bold">Standard</h3>
            <p className="mb-8 text-slate-600">Perfect for regular travelers.</p>
            <ul className="space-y-4 text-lg text-slate-700">
              <li>✓ 5 destination countries</li>
              <li>✓ Full document package</li>
              <li>✓ AI support system</li>
              <li>✓ Priority processing</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 p-8">
            <h3 className="mb-4 text-3xl font-bold">VIP</h3>
            <p className="mb-8 text-slate-600">
              For frequent international travelers.
            </p>
            <ul className="space-y-4 text-lg text-slate-700">
              <li>✓ 30+ destination countries</li>
              <li>✓ Unlimited document generation</li>
              <li>✓ Premium AI support</li>
              <li>✓ Fastest processing</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="countries" className="bg-slate-50 px-8 py-20">
        <h2 className="mb-4 text-center text-5xl font-bold">
          Most selected destinations
        </h2>

        <p className="mx-auto mb-14 max-w-3xl text-center text-xl text-slate-600">
          Popular tourist destinations frequently selected by foreigners living in Korea.
        </p>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-10 text-center shadow-lg">
            <p className="text-6xl">🇯🇵</p>
            <h3 className="mt-6 text-3xl font-bold">Japan</h3>
          </div>

          <div className="rounded-3xl bg-white p-10 text-center shadow-lg">
            <p className="text-6xl">🇪🇸</p>
            <h3 className="mt-6 text-3xl font-bold">Spain</h3>
          </div>

          <div className="rounded-3xl bg-white p-10 text-center shadow-lg">
            <p className="text-6xl">🇹🇼</p>
            <h3 className="mt-6 text-3xl font-bold">Taiwan</h3>
          </div>

          <div className="rounded-3xl bg-white p-10 text-center shadow-lg">
            <p className="text-6xl">🇸🇬</p>
            <h3 className="mt-6 text-3xl font-bold">Singapore</h3>
          </div>
        </div>
      </section>

      <section id="how" className="px-8 py-20">
        <h2 className="mb-14 text-center text-5xl font-bold">How it works</h2>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-8">
            <div className="mb-5 text-5xl font-extrabold text-blue-700">01</div>
            <h3 className="mb-4 text-3xl font-bold">Enter Information</h3>
            <p className="text-slate-600">
              Add nationality, Korean visa type, destination country, and travel details.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-50 p-8">
            <div className="mb-5 text-5xl font-extrabold text-blue-700">02</div>
            <h3 className="mb-4 text-3xl font-bold">AI Generates Documents</h3>
            <p className="text-slate-600">
              The AI prepares all required tourist visa documents automatically.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-50 p-8">
            <div className="mb-5 text-5xl font-extrabold text-blue-700">03</div>
            <h3 className="mb-4 text-3xl font-bold">Download & Submit</h3>
            <p className="text-slate-600">
              Download your files and prepare them for embassy submission.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-8 py-8 text-center text-slate-500">
        © 2026 VisaAI Korea · AI-powered tourist visa document preparation
      </footer>
    </main>
  );
}