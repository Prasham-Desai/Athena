import { NextRequest } from 'next/server';
import { getEnv, successResponse, errorResponse, generateId } from '@/api/helpers';
import { Database } from '@/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const env = await getEnv(request);
    if (!env.DB) return errorResponse('D1 Database binding not found', 500);

    const db = new Database(env.DB);
    const academicYearId = request.nextUrl.searchParams.get('academic_year_id');
    const subjectId = request.nextUrl.searchParams.get('subject_id');
    const chapterId = request.nextUrl.searchParams.get('chapter_id');
    const topicId = request.nextUrl.searchParams.get('topic_id');

    let query = 'SELECT * FROM notes WHERE 1=1';
    const params: any[] = [];

    if (academicYearId) {
      query += ' AND academic_year_id = ?';
      params.push(academicYearId);
    }

    if (subjectId) {
      query += ' AND subject_id = ?';
      params.push(subjectId);
    }

    if (chapterId) {
      query += ' AND chapter_id = ?';
      params.push(chapterId);
    }

    if (topicId) {
      query += ' AND topic_id = ?';
      params.push(topicId);
    }

    query += ' ORDER BY created_at DESC';

    const notes = await db.query<any>(query, params);
    return successResponse(notes);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = await getEnv(request);
    if (!env.DB) return errorResponse('D1 Database binding not found', 500);
    if (!env.KV) return errorResponse('Cloudflare KV storage binding not found', 500);

    const db = new Database(env.DB);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const subjectId = formData.get('subject_id') as string | null;
    const academicYearId = formData.get('academic_year_id') as string | null;
    const title = (formData.get('title') as string | null)?.trim();
    const subtitle = (formData.get('subtitle') as string | null)?.trim() || null;
    const chapterId = (formData.get('chapter_id') as string | null)?.trim() || null;
    const topicId = (formData.get('topic_id') as string | null)?.trim() || null;

    if (!file) {
      return errorResponse('A document file (.pdf, .jpg, .jpeg, .png) is required', 400);
    }

    if (!subjectId) {
      return errorResponse('subject_id is required', 400);
    }

    if (!academicYearId) {
      return errorResponse('academic_year_id is required', 400);
    }

    if (!title) {
      return errorResponse('A title for the note is required', 400);
    }

    // Verify subject exists and matches academic year
    const subject = await db.get<any>(
      'SELECT id, academic_year_id FROM subjects WHERE id = ?',
      [subjectId]
    );

    if (!subject) {
      return errorResponse('Selected subject not found', 404);
    }

    if (subject.academic_year_id !== academicYearId) {
      return errorResponse('Subject does not belong to the selected academic year', 400);
    }

    // Validate file size (25MB max)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File exceeds the 25MB maximum size limit', 400);
    }

    // Validate file extension and MIME type
    const originalName = file.name || 'document';
    const ext = originalName.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

    if (!allowedExtensions.includes(ext)) {
      return errorResponse(
        `Unsupported file type .${ext}. Only PDF, JPG, JPEG, and PNG are supported.`,
        400
      );
    }

    let mimeType = file.type || '';
    if (!mimeType) {
      if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    }

    const noteId = generateId();
    const kvKey = `note_file:${noteId}`;
    const arrayBuffer = await file.arrayBuffer();

    // Store binary file in Cloudflare KV
    await env.KV.put(kvKey, arrayBuffer);

    const now = new Date().toISOString();

    // Insert record in D1
    await db.run(
      `INSERT INTO notes (
        id, subject_id, academic_year_id, chapter_id, topic_id,
        title, subtitle, file_name, file_type, mime_type, file_size, kv_key,
        page_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        noteId,
        subjectId,
        academicYearId,
        chapterId,
        topicId,
        title,
        subtitle,
        originalName,
        ext === 'jpeg' ? 'jpg' : ext,
        mimeType,
        file.size,
        kvKey,
        ext === 'pdf' ? 1 : 1, // updated dynamically upon first render
        now,
        now,
      ]
    );

    const created = await db.get<any>('SELECT * FROM notes WHERE id = ?', [noteId]);
    return successResponse(created, 201);
  } catch (err: any) {
    console.error('Failed to upload note:', err);
    return errorResponse(err.message, 500);
  }
}
