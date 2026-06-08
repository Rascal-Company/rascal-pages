export default function LogosBlock() {
  return (
    <section className="border-y border-gray-200 bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-semibold tracking-wide text-gray-500 uppercase">
          Luottavat meihin
        </p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex h-12 items-center justify-center text-sm font-semibold text-gray-400"
            >
              Logo {i}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
