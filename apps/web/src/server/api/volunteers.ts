import { query } from '@/lib/db';

export interface Volunteer {
  id: string;
  user_id: string;
  phone: string;
  availability: Record<string, unknown>;
  skills: string[];
  created_at: Date;
  updated_at: Date;
}

export async function getVolunteers(): Promise<Volunteer[]> {
  const result = await query('SELECT * FROM volunteers ORDER BY created_at DESC');
  return result.rows;
}

export async function getVolunteerById(id: string): Promise<Volunteer | null> {
  const result = await query('SELECT * FROM volunteers WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createVolunteer(data: {
  user_id: string;
  phone: string;
  availability: Record<string, unknown>;
  skills: string[];
}): Promise<Volunteer> {
  const result = await query(
    `INSERT INTO volunteers (user_id, phone, availability, skills)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.user_id, data.phone, data.availability, data.skills]
  );
  return result.rows[0];
}

export async function updateVolunteer(
  id: string,
  data: Partial<Omit<Volunteer, 'id' | 'created_at' | 'updated_at'>>
): Promise<Volunteer | null> {
  const fields = Object.keys(data);
  const values = Object.values(data);

  if (fields.length === 0) {
    return getVolunteerById(id);
  }

  const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

  const result = await query(`UPDATE volunteers SET ${setClause} WHERE id = $1 RETURNING *`, [
    id,
    ...values,
  ]);

  return result.rows[0] || null;
}

export async function deleteVolunteer(id: string): Promise<boolean> {
  const result = await query('DELETE FROM volunteers WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
