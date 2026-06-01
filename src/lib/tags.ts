/**
 * 解析校友 tags 字段，输出结构化数据。
 * tags 格式支持两种分隔符：| 或 逗号（兼容历史数据）
 * 标准格式：大学 | 专业 | 城市
 */

export interface ParsedTags {
  university: string;
  major: string;
  city: string;
}

export function parseTags(tags: string | null): ParsedTags {
  if (!tags) return { university: '', major: '', city: '' };

  // 优先按 | 拆分，如果结果不足 3 部分则尝试逗号
  let parts = tags.split('|').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) {
    parts = tags.split(/[,，]/).map((p) => p.trim()).filter(Boolean);
  }

  return {
    university: parts[0] || '',
    major: parts[1] || '',
    city: parts[2] || '',
  };
}

/**
 * 标准化 tags 为统一存储格式：大学 | 专业 | 城市
 * 无论输入是逗号还是竖线，统一输出 | 分隔。
 */
export function normalizeTags(input: string): string {
  const { university, major, city } = parseTags(input);
  if (!university) return input.trim(); // 无法解析的保持原样
  return [university, major, city].filter(Boolean).join(' | ');
}
