import { Redis } from '@upstash/redis';

export interface WordPair {
  id: string;
  term: string;
  meaning: string;
  categoryId?: string;
}
export interface StudentMember {
  id: string; name: string; joinedAt: number; score: number;
  matchedPairsCount: number; completed: boolean;
  timeTakenSeconds?: number; finishedAt?: number;
}
export interface Room {
  code: string; categoryId: string; categoryName: string; words: WordPair[];
  status: 'waiting' | 'playing' | 'ended'; createdAt: number;
  startedAt?: number; endedAt?: number;
  students: Record<string, StudentMember>;
}

const memory = new Map<string, Room>();
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

const key = (code: string) => `vocab-match:room:${code}`;

export async function createRoom(code: string, categoryId: string, categoryName: string, words: WordPair[]) {
  const room: Room = {
    code, categoryId, categoryName: categoryName || 'หมวดหมู่ทั่วไป',
    words: Array.isArray(words) ? words : [], status: 'waiting',
    createdAt: Date.now(), students: {}
  };
  if (redis) await redis.set(key(code), room, { ex: 60 * 60 * 6 });
  else memory.set(code, room);
  return room;
}

export async function getRoom(code: string): Promise<Room | null> {
  if (redis) return (await redis.get<Room>(key(code))) || null;
  return memory.get(code) || null;
}

async function saveRoom(room: Room) {
  if (redis) await redis.set(key(room.code), room, { ex: 60 * 60 * 6 });
  else memory.set(room.code, room);
  return room;
}

export async function joinRoom(code: string, studentName: string) {
  const room = await getRoom(code);
  if (!room) return null;
  const name = String(studentName || '').trim();
  if (!name) return null;

  const existing = Object.values(room.students).find(s => s.name.toLowerCase() === name.toLowerCase());
  if (existing) return { student: existing, room };

  const student: StudentMember = {
    id: `std-${Date.now()}-${Math.floor(Math.random()*100000)}`,
    name, joinedAt: Date.now(), score: 0, matchedPairsCount: 0, completed: false
  };
  room.students[student.id] = student;
  await saveRoom(room);
  return { student, room };
}

export async function startRoomGame(code: string) {
  const room = await getRoom(code);
  if (!room) return null;
  room.status = 'playing';
  room.startedAt = Date.now();
  return saveRoom(room);
}

export async function updateStudentScore(code: string, studentId: string, data: {
  score: number; matchedPairsCount?: number; completed?: boolean; timeTakenSeconds?: number;
}) {
  const room = await getRoom(code);
  if (!room) return null;
  const student = room.students[studentId];
  if (!student) return null;
  if (typeof data.score === 'number') student.score = data.score;
  if (typeof data.matchedPairsCount === 'number') student.matchedPairsCount = data.matchedPairsCount;
  if (data.completed !== undefined) {
    student.completed = data.completed;
    if (data.completed && !student.finishedAt) {
      student.finishedAt = Date.now();
      student.timeTakenSeconds = typeof data.timeTakenSeconds === 'number'
        ? data.timeTakenSeconds
        : room.startedAt ? Math.round((Date.now()-room.startedAt)/1000) : undefined;
    }
  }
  await saveRoom(room);
  return { room, student };
}

export async function endRoomGame(code: string) {
  const room = await getRoom(code);
  if (!room) return null;
  room.status = 'ended'; room.endedAt = Date.now();
  return saveRoom(room);
}

export async function resetRoomGame(code: string) {
  const room = await getRoom(code);
  if (!room) return null;
  room.status = 'waiting'; room.startedAt = undefined; room.endedAt = undefined;
  Object.values(room.students).forEach(s => {
    s.score=0; s.matchedPairsCount=0; s.completed=false;
    s.timeTakenSeconds=undefined; s.finishedAt=undefined;
  });
  return saveRoom(room);
}

export async function kickStudent(code: string, studentId: string) {
  const room = await getRoom(code);
  if (!room || !room.students[studentId]) return false;
  delete room.students[studentId];
  await saveRoom(room);
  return true;
}
