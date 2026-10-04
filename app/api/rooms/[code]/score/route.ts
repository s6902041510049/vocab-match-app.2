import { NextRequest, NextResponse } from 'next/server';
import { updateStudentScore } from '@/lib/roomStore';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest,{params}:{params:{code:string}}) {
  try {
    const body = await request.json();
    const result = await updateStudentScore(params.code, body.studentId, body);
    if (!result) return NextResponse.json({error:'ไม่พบห้องหรือนักเรียน'}, {status:404});
    return NextResponse.json({success:true, student:result.student});
  } catch { return NextResponse.json({error:'บันทึกคะแนนไม่สำเร็จ'}, {status:500}); }
}
