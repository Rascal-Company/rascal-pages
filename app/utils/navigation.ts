export function getDashboardUrl(path: string = ''): string {
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost');
    if (isLocalhost) {
      return `/app/dashboard${path}`;
    }
  }
  return `https://app.rascalpages.fi/dashboard${path}`;
}

export function navigateToDashboard(path: string = ''): void {
  const url = getDashboardUrl(path);
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost');
    if (isLocalhost) {
      // Kehitysympäristössä käytä Next.js routeria
      const router = require('next/navigation').useRouter();
      router.push(url);
    } else {
      // Tuotannossa käytä window.location.href
      window.location.href = url;
    }
  }
}