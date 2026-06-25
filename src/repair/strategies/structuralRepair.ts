export interface RepairAttempt {
  strategy: 'structural' | 'field' | 'consistency';
  inputError: string;
  outcome: 'repaired' | 'escalated' | 'failed';
}

export function repairJsonStructure(raw: string): string {
  let text = raw.trim();

  // If there are markdown blocks, isolate the JSON text first
  if (text.includes('```')) {
    const lines = text.split('\n');
    const startIdx = lines.findIndex(l => l.startsWith('```json'));
    const endIdx = lines.findIndex((l, i) => i > startIdx && l.startsWith('```'));
    if (startIdx !== -1) {
      const sliceEnd = endIdx !== -1 ? endIdx : lines.length;
      text = lines.slice(startIdx + 1, sliceEnd).join('\n').trim();
    }
  }

  // 1. Fix simple double quote escaping issues
  // 2. Scan text character by character to detect open quotes, open braces, open brackets
  let inString = false;
  let escape = false;
  const stack: ('{' | '[')[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        stack.push('{');
      } else if (char === '[') {
        stack.push('[');
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  // Close string if left open
  if (inString) {
    text += '"';
  }

  // Pop remaining elements in reverse order and append their closures
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') {
      // Remove trailing comma if any
      text = text.trim();
      if (text.endsWith(',')) {
        text = text.substring(0, text.length - 1).trim();
      }
      text += '}';
    } else if (open === '[') {
      text = text.trim();
      if (text.endsWith(',')) {
        text = text.substring(0, text.length - 1).trim();
      }
      text += ']';
    }
  }

  return text;
}

export function runStructuralRepair(rawOutput: string): { repairedContent: string; outcome: 'repaired' | 'failed' } {
  try {
    const repaired = repairJsonStructure(rawOutput);
    JSON.parse(repaired); // Verify it actually parses now
    return {
      repairedContent: repaired,
      outcome: 'repaired',
    };
  } catch {
    return {
      repairedContent: rawOutput,
      outcome: 'failed',
    };
  }
}
