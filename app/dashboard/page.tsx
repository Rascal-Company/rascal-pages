import { db } from '@/src/lib/db';

// Hardcoded test UUID - will be replaced with auth later
const TEST_USER_ID = '173b0949-2f0e-4073-be3d-05bd93e4c7ce';

export default async function DashboardPage() {
  // Fetch all sites for the test user
  const sites = await db
    .selectFrom('sites')
    .selectAll()
    .where('user_id', '=', TEST_USER_ID)
    .execute();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
              My Sites
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Manage your websites and pages
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Create New Site
          </button>
        </div>

        {/* Sites Grid */}
        {sites.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              No sites yet
            </p>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Get started by creating your first site
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <div
                key={site.id}
                className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                        {site.subdomain}
                      </h3>
                      {site.custom_domain && (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          {site.custom_domain}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>
                      Created{' '}
                      {new Date(site.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
