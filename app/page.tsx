export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <h1 className="text-2xl font-bold">VisaAI Korea</h1>

        <div className="hidden md:flex gap-6 text-gray-300">
          <a href="#" className="hover:text-white transition">Home</a>
          <a href="#" className="hover:text-white transition">Features</a>
          <a href="#" className="hover:text-white transition">Pricing</a>
          <a href="#" className="hover:text-white transition">Contact</a>
        </div>

        <button className="bg-white text-black px-5 py-2 rounded-xl font-semibold hover:bg-gray-200 transition">
          Start
        </button>
      </nav>

      <section className="relative flex flex-col items-center justify-center text-center px-6 py-32">
        <div className="absolute top-20 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute right-20 top-40 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

        <p className="relative mb-6 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-gray-300">
          Built for foreigners living in South Korea
        </p>

        <h2 className="relative text-5xl md:text-7xl font-extrabold mb-8 leading-tight">
          Prepare Visa Documents <br />
          With AI in Minutes
        </h2>

        <p className="relative text-gray-400 text-lg md:text-xl max-w-2xl mb-10">
          VisaAI Korea helps travelers generate embassy cover letters,
          travel itineraries, document checklists, and application support files instantly.
        </p>

        <div className="relative flex flex-col sm:flex-row gap-4">
          <button className="bg-white text-black px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-200 transition">
            Generate Documents
          </button>

          <button className="border border-white/15 px-8 py-4 rounded-2xl text-lg hover:bg-white/10 transition">
            See How It Works
          </button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 px-8 md:px-16 pb-20">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-4xl font-bold mb-2">3+</p>
          <p className="text-gray-400">Countries for MVP launch</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-4xl font-bold mb-2">5 min</p>
          <p className="text-gray-400">Average document generation time</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-4xl font-bold mb-2">AI</p>
          <p className="text-gray-400">Personalized documents for each client</p>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 px-8 md:px-16 pb-24">
        <div className="bg-zinc-900/80 p-8 rounded-3xl border border-zinc-800 hover:border-white/20 transition">
          <h3 className="text-2xl font-bold mb-4">AI Cover Letters</h3>
          <p className="text-gray-400">
            Create personalized embassy cover letters based on the traveler’s profile.
          </p>
        </div>

        <div className="bg-zinc-900/80 p-8 rounded-3xl border border-zinc-800 hover:border-white/20 transition">
          <h3 className="text-2xl font-bold mb-4">Travel Itinerary</h3>
          <p className="text-gray-400">
            Generate realistic daily travel plans for Japan, Spain, Italy, and more.
          </p>
        </div>

        <div className="bg-zinc-900/80 p-8 rounded-3xl border border-zinc-800 hover:border-white/20 transition">
          <h3 className="text-2xl font-bold mb-4">Embassy Checklist</h3>
          <p className="text-gray-400">
            Get destination-specific document checklists for visa applications.
          </p>
        </div>
      </section>
    </main>
  );
}