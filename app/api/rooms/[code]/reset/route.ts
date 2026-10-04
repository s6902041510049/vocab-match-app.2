import { NextRequest, NextResponse } from 'next/server';
import { resetRoomGame } from '@/lib/roomStore';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest,{params}:{params:{code:string}}) {
  const room = await resetRoomGame(params.code);
  if (!room) return NextResponse.json({error:'ไม่พบห้องกิจกรรมนี้'}, {status:404});
  return NextResponse.json({success:true, room});
}
