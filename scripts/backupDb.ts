import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

/**
 * SQLite Database Online Backup Utility
 * Spec: MASTER_PROMPT Phase 13
 * Uses SQLite's online backup API to take a non-blocking snapshot of medscribe.db
 */

export async function runBackup(customSource?: string, customDestDir?: string): Promise<{ backupPath: string; sizeBytes: number }> {
  const sourceDbPath = customSource || process.env.MEDSCRIBE_DB_PATH || path.join(process.cwd(), 'server', 'db', 'medscribe.db');
  const backupDir = customDestDir || path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  if (!fs.existsSync(sourceDbPath)) {
    throw new Error(`Source database does not exist at: ${sourceDbPath}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `medscribe_backup_${timestamp}.db`;
  const targetPath = path.join(backupDir, backupFileName);

  const db = new Database(sourceDbPath);
  try {
    // SQLite online backup API
    await db.backup(targetPath);
    const stats = fs.statSync(targetPath);
    console.log(`[Backup] SQLite database backup created successfully:`);
    console.log(`  Source: ${sourceDbPath}`);
    console.log(`  Destination: ${targetPath}`);
    console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
    return { backupPath: targetPath, sizeBytes: stats.size };
  } finally {
    db.close();
  }
}

// CLI Runner
if (process.argv[1]?.includes('backupDb')) {
  runBackup()
    .then((res) => {
      console.log(`Backup completed: ${res.backupPath}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Backup failed:', err);
      process.exit(1);
    });
}
