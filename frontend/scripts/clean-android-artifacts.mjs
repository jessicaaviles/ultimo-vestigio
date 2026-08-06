import { readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());

const pathsToClean = [
  'android/app/build',
  'android/build',
  'android/capacitor-cordova-android-plugins/build',
  'node_modules/@capacitor/android/capacitor/build',
  'node_modules/@capacitor-community/text-to-speech/build',
  'node_modules/@capacitor-community/text-to-speech/android/build',
  'node_modules/@capgo/capacitor-social-login/build',
  'node_modules/@capgo/capacitor-social-login/android/build',
];

for (const relativePath of pathsToClean) {
  const target = resolve(root, relativePath);
  try {
    await rm(target, { recursive: true, force: true });
    console.log(`[clean-android-artifacts] removed ${relativePath}`);
  } catch (error) {
    console.warn(`[clean-android-artifacts] skipped ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const resourceRoot = resolve(root, 'android/app/src/main/res');

const cleanInvalidAndroidResourceNames = async (directory) => {
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    console.warn(`[clean-android-artifacts] skipped resource scan ${directory}: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  for (const entry of entries) {
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await cleanInvalidAndroidResourceNames(fullPath);
      continue;
    }

    if (/\s/.test(entry.name)) {
      await rm(fullPath, { force: true });
      console.log(`[clean-android-artifacts] removed invalid Android resource ${fullPath.replace(`${root}/`, '')}`);
    }
  }
};

await cleanInvalidAndroidResourceNames(resourceRoot);
