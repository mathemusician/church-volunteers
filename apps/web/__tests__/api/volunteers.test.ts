import { createVolunteer, getVolunteers, getVolunteerById } from '../../src/server/api/volunteers';
import { query } from '../../src/lib/db';

// Mock the database module
jest.mock('../../src/lib/db', () => ({
  query: jest.fn(),
}));

describe('Volunteers API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVolunteers', () => {
    it('should return all volunteers', async () => {
      const mockVolunteers = [
        {
          id: '1',
          user_id: 'user1',
          phone: '123-456-7890',
          availability: {},
          skills: ['teaching'],
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (query as jest.Mock).mockResolvedValue({ rows: mockVolunteers });

      const result = await getVolunteers();

      expect(result).toEqual(mockVolunteers);
      expect(query).toHaveBeenCalledWith('SELECT * FROM volunteers ORDER BY created_at DESC');
    });
  });

  describe('getVolunteerById', () => {
    it('should return a volunteer by id', async () => {
      const mockVolunteer = {
        id: '1',
        user_id: 'user1',
        phone: '123-456-7890',
        availability: {},
        skills: ['teaching'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      (query as jest.Mock).mockResolvedValue({ rows: [mockVolunteer] });

      const result = await getVolunteerById('1');

      expect(result).toEqual(mockVolunteer);
      expect(query).toHaveBeenCalledWith('SELECT * FROM volunteers WHERE id = $1', ['1']);
    });

    it('should return null if volunteer not found', async () => {
      (query as jest.Mock).mockResolvedValue({ rows: [] });

      const result = await getVolunteerById('999');

      expect(result).toBeNull();
    });
  });

  describe('createVolunteer', () => {
    it('should create a new volunteer', async () => {
      const newVolunteer = {
        user_id: 'user1',
        phone: '123-456-7890',
        availability: {},
        skills: ['teaching'],
      };

      const mockCreatedVolunteer = {
        id: '1',
        ...newVolunteer,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (query as jest.Mock).mockResolvedValue({ rows: [mockCreatedVolunteer] });

      const result = await createVolunteer(newVolunteer);

      expect(result).toEqual(mockCreatedVolunteer);
      expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO volunteers'), [
        newVolunteer.user_id,
        newVolunteer.phone,
        newVolunteer.availability,
        newVolunteer.skills,
      ]);
    });
  });
});
