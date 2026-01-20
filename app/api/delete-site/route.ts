import { NextResponse } from 'next/server';
import { deleteSite } from '@/app/actions';

export async function POST(request: Request) {
  try {
    const { siteId } = await request.json();

    if (!siteId) {
      return NextResponse.json(
        { error: 'siteId on pakollinen' },
        { status: 400 }
      );
    }

    const result = await deleteSite(siteId);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Virhe API-reitissä:', error);
    return NextResponse.json(
      { error: 'Odottamaton virhe tapahtui.' },
      { status: 500 }
    );
  }
}