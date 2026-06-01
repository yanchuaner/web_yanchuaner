import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/admin-auth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: jpeg, png, webp, gif' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成可读文件名：时间戳-原始文件名（去除非ASCII安全字符）
    const safeName = (file as any).name
      ? (file as any).name.replace(/[^a-zA-Z0-9._\-一-鿿]/g, '_').replace(/_{2,}/g, '_')
      : 'upload';
    const MIME_EXT: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = MIME_EXT[file.type] || 'jpg';
    // 确保扩展名正确
    const baseName = safeName.replace(/\.[^.]+$/, '');
    const filename = `${Date.now()}-${baseName}.${ext}`;

    // 确保上传目录存在
    const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // 如果是自定义目录，可能需要通过另外的路由或 Nginx 代理访问
    // 默认回退路径仍为 /uploads/...
    const url = `/uploads/${filename}`;

    return NextResponse.json({ url, filename }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
