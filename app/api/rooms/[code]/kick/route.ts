import { NextRequest, NextResponse } from 'next/server';
import { kickStudent } from '@/lib/roomStore';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest,{params}:{params:{code:string}}) {
  const {studentId} = await request.json();
  const ok = await kickStudent(params.code, studentId);
  if (!ok) return NextResponse.json({error:'ไม่พบห้องหรือนักเรียน'}, {status:404});
  return NextResponse.json({success:true});
}
