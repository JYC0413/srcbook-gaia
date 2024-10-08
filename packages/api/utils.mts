import fs from 'node:fs/promises';
import Path from 'node:path';

export function take<T extends object, K extends keyof T>(obj: T, ...keys: Array<K>): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of Object.keys(obj) as K[]) {
    if (keys.includes(key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

export async function disk(dirname: string, ext: string) {
  const results = await fs.readdir(dirname, { withFileTypes: true });

  const entries = results
    .filter((entry) => {
      return entry.isDirectory() || entry.name.endsWith(ext);
    })
    .map((entry) => {
      // .path -> .parentPath from node21 onwards.
      const parentPath = entry.parentPath || entry.path;
      return {
        path: Path.join(parentPath, entry.name),
        dirname: entry.path,
        basename: entry.name,
        isDirectory: entry.isDirectory(),
      };
    })
    .sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) {
        return -1;
      } else if (!a.isDirectory && b.isDirectory) {
        return 1;
      } else {
        return a.basename.localeCompare(b.basename);
      }
    });

  return isRootPath(dirname)
    ? entries
    : [
        {
          path: Path.dirname(dirname),
          dirname: Path.dirname(dirname),
          basename: '..',
          isDirectory: true,
        },
      ].concat(entries);
}

function isRootPath(path: string) {
  // Make sure to resolve the path, e.g., `/../` -> `/`
  const normalizedPath = Path.resolve(path);

  // On POSIX systems, the root is always "/"
  // On Windows, roots can be "C:\", "D:\", etc.
  if (process.platform === 'win32') {
    // For Windows, the root path ends with a backslash after the drive letter
    return /^[a-zA-Z]:\\$/.test(normalizedPath);
  } else {
    return normalizedPath === '/';
  }
}

export function toFormattedJSON(o: any) {
  return JSON.stringify(o, null, 2);
}
