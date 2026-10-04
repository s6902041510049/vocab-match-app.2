import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/roomStore';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest,{params}:{params:{code:string}}) {
  try {
    const {studentName} = await request.json();
    const result = await joinRoom(params.code, studentName);
    if (!result) return NextResponse.json({error:'ไม่พบห้องกิจกรรมนี้ หรือชื่อผู้เล่นไม่ถูกต้อง'}, {status:404});
    return NextResponse.json({success:true, student:result.student, room:result.room});
  } catch { return NextResponse.json({error:'ไม่สามารถเข้าร่วมห้องได้'}, {status:500}); }
}
