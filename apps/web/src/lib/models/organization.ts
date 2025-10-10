import { query } from '@/lib/db';
import crypto from 'crypto';

function generatePublicId(): string {
  // Generate a random 12-character alphanumeric ID
  return crypto.randomBytes(6).toString('hex');
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  public_id: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createOrganization(
  name: string,
  slug: string,
  description?: string
): Promise<Organization> {
  const publicId = generatePublicId();
  const result = await query(
    'INSERT INTO organizations (name, slug, public_id, description) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, slug, publicId, description || null]
  );
  return result.rows[0];
}

export async function getOrganizationById(id: number): Promise<Organization | null> {
  const result = await query('SELECT * FROM organizations WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const result = await query('SELECT * FROM organizations WHERE slug = $1', [slug]);
  return result.rows[0] || null;
}

export async function getOrganizationByPublicId(publicId: string): Promise<Organization | null> {
  const result = await query('SELECT * FROM organizations WHERE public_id = $1', [publicId]);
  return result.rows[0] || null;
}

export async function getUserOrganizations(userEmail: string): Promise<Organization[]> {
  const result = await query(
    `SELECT o.* FROM organizations o
     JOIN organization_members om ON o.id = om.organization_id
     WHERE om.user_email = $1 AND om.status = 'active'
     ORDER BY om.joined_at DESC`,
    [userEmail]
  );
  return result.rows;
}

export async function updateOrganization(
  id: number,
  updates: Partial<Pick<Organization, 'name' | 'slug' | 'description'>>
): Promise<Organization> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.slug !== undefined) {
    fields.push(`slug = $${paramCount++}`);
    values.push(updates.slug);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await query(
    `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );
  return result.rows[0];
}

export async function deleteOrganization(id: number): Promise<void> {
  await query('DELETE FROM organizations WHERE id = $1', [id]);
}
