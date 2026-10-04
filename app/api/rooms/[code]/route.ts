import { NextRequest, NextResponse } from 'next/server';
import { getRoom } from '@/lib/roomStore';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, {params}:{params:{code:string}}) {
  const room = await getRoom(params.code);
  if (!room) return NextResponse.json({error:'ไม่พบห้องกิจกรรมนี้ หรือห้องอาจจะถูกปิดไปแล้ว'}, {status:404});
  const studentsList = Object.values(room.students).sort((a,b) =>
    b.score-a.score || Number(b.completed)-Number(a.completed) ||
    ((a.timeTakenSeconds ?? Infinity)-(b.timeTakenSeconds ?? Infinity)) || a.joinedAt-b.joinedAt
  );
  return NextResponse.json({success:true, room:{...room, studentsList}});
}
