import { DatabaseService, User, Company, Car, Office, Reservation, Review } from './database';

// User API functions
export const userService = {
  // Get user by ID
  async getById(id: number): Promise<User | null> {
    return await DatabaseService.queryOne<User>(
      'SELECT * FROM "User" WHERE id = $1',
      [id]
    );
  },

  // Get user by email
  async getByEmail(email: string): Promise<User | null> {
    return await DatabaseService.queryOne<User>(
      'SELECT * FROM "User" WHERE email = $1',
      [email]
    );
  },

  // Create new user
  async create(userData: Partial<User>): Promise<User> {
    return await DatabaseService.insert<User>('User', userData);
  },

  // Update user
  async update(id: number, userData: Partial<User>): Promise<User | null> {
    return await DatabaseService.updateOne<User>(
      'User',
      'id = $1',
      [id],
      userData
    );
  },

  // Get users by company
  async getByCompany(companyId: number): Promise<User[]> {
    return await DatabaseService.query<User>(
      'SELECT * FROM "User" WHERE "companyId" = $1',
      [companyId]
    );
  },

  // Get all users
  async getAll(): Promise<User[]> {
    return await DatabaseService.query<User>(
      'SELECT id, name, email, role FROM "User" ORDER BY id ASC'
    );
  }
};

// Company API functions
export const companyService = {
  // Get company by ID
  async getById(id: number): Promise<Company | null> {
    return await DatabaseService.queryOne<Company>(
      'SELECT * FROM "Company" WHERE id = $1',
      [id]
    );
  },

  // Get company by owner
  async getByOwner(ownerId: number): Promise<Company | null> {
    return await DatabaseService.queryOne<Company>(
      'SELECT * FROM "Company" WHERE "ownerId" = $1',
      [ownerId]
    );
  },

  // Create new company
  async create(companyData: Partial<Company>): Promise<Company> {
    return await DatabaseService.insert<Company>('Company', companyData);
  },

  // Update company
  async update(id: number, companyData: Partial<Company>): Promise<Company | null> {
    return await DatabaseService.updateOne<Company>(
      'Company',
      'id = $1',
      [id],
      companyData
    );
  },

  // Get all companies
  async getAll(): Promise<Company[]> {
    return await DatabaseService.query<Company>('SELECT * FROM "Company"');
  }
};

// Car API functions
export const carService = {
  // Get car by ID
  async getById(id: number): Promise<Car | null> {
    return await DatabaseService.queryOne<Car>(
      `SELECT 
        c.*,
        json_build_object('id', comp.id, 'name', comp.name, 'email', comp.email) as company,
        json_build_object('id', off.id, 'name', off.name, 'address', off.address, 'latitude', off.latitude, 'longitude', off.longitude) as office
       FROM "Car" c
       LEFT JOIN "Company" comp ON c."companyId" = comp.id
       LEFT JOIN "Office" off ON c."officeId" = off.id
       WHERE c.id = $1`,
      [id]
    );
  },

  // Get cars by owner
  async getByOwner(ownerId: number): Promise<Car[]> {
    return await DatabaseService.query<Car>(
      `SELECT c.*, co.name as company_name, o.name as office_name
       FROM "Car" c
       LEFT JOIN "Company" co ON c."companyId" = co.id
       LEFT JOIN "Office" o ON c."officeId" = o.id
       WHERE c."ownerId" = $1`,
      [ownerId]
    );
  },

  // Get cars by company
  async getByCompany(companyId: number): Promise<Car[]> {
    return await DatabaseService.query<Car>(
      `SELECT c.*, o.name as office_name, o.address as office_address
       FROM "Car" c
       LEFT JOIN "Office" o ON c."officeId" = o.id
       WHERE c."companyId" = $1`,
      [companyId]
    );
  },

  // Get available cars for rent
  async getAvailable(startDate: Date, endDate: Date): Promise<Car[]> {
    return await DatabaseService.query<Car>(
      `SELECT c.*, co.name as company_name, o.name as office_name, o.address as office_address
       FROM "Car" c
       LEFT JOIN "Company" co ON c."companyId" = co.id
       LEFT JOIN "Office" o ON c."officeId" = o.id
       WHERE c.id NOT IN (
         SELECT r."carId" 
         FROM "Reservation" r 
         WHERE r.status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
         AND (
           (r."startDate" <= $1 AND r."endDate" >= $1) OR
           (r."startDate" <= $2 AND r."endDate" >= $2) OR
           (r."startDate" >= $1 AND r."endDate" <= $2)
         )
       )`,
      [startDate, endDate]
    );
  },

  // Search cars with filters
  async search(filters: {
    make?: string;
    model?: string;
    carType?: string;
    transmissionType?: string;
    fuelType?: string;
    minPrice?: number;
    maxPrice?: number;
    companyId?: number;
  }): Promise<Car[]> {
    let query = `
      SELECT c.*, co.name as company_name, o.name as office_name, o.address as office_address
      FROM "Car" c
      LEFT JOIN "Company" co ON c."companyId" = co.id
      LEFT JOIN "Office" o ON c."officeId" = o.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.make) {
      query += ` AND c.make ILIKE $${paramIndex}`;
      params.push(`%${filters.make}%`);
      paramIndex++;
    }

    if (filters.model) {
      query += ` AND c.model ILIKE $${paramIndex}`;
      params.push(`%${filters.model}%`);
      paramIndex++;
    }

    if (filters.carType) {
      query += ` AND c."carType" = $${paramIndex}`;
      params.push(filters.carType);
      paramIndex++;
    }

    if (filters.transmissionType) {
      query += ` AND c."transmissionType" = $${paramIndex}`;
      params.push(filters.transmissionType);
      paramIndex++;
    }

    if (filters.fuelType) {
      query += ` AND c."fuelType" = $${paramIndex}`;
      params.push(filters.fuelType);
      paramIndex++;
    }

    if (filters.minPrice) {
      query += ` AND c."pricePerDay" >= $${paramIndex}`;
      params.push(filters.minPrice);
      paramIndex++;
    }

    if (filters.maxPrice) {
      query += ` AND c."pricePerDay" <= $${paramIndex}`;
      params.push(filters.maxPrice);
      paramIndex++;
    }

    if (filters.companyId) {
      query += ` AND c."companyId" = $${paramIndex}`;
      params.push(filters.companyId);
      paramIndex++;
    }

    return await DatabaseService.query<Car>(query, params);
  },

  // Create new car
  async create(carData: Partial<Car>): Promise<Car> {
    return await DatabaseService.insert<Car>('Car', carData);
  },

  // Update car
  async update(id: number, carData: Partial<Car>): Promise<Car | null> {
    return await DatabaseService.updateOne<Car>(
      'Car',
      'id = $1',
      [id],
      carData
    );
  },

  // Delete car
  async delete(id: number): Promise<boolean> {
    const deletedCount = await DatabaseService.delete('Car', 'id = $1', [id]);
    return deletedCount > 0;
  },

  // Get all cars (for admin)
  async getAll(): Promise<Car[]> {
    return await DatabaseService.query<Car>(
      `SELECT 
        c.id, c.make, c.model, c.year, c."pricePerDay",
        json_build_object('id', comp.id, 'name', comp.name) as company
       FROM "Car" c
       LEFT JOIN "Company" comp ON c."companyId" = comp.id
       ORDER BY c.id DESC`
    );
  }
};

// Office API functions
export const officeService = {
  // Get office by ID
  async getById(id: number): Promise<Office | null> {
    return await DatabaseService.queryOne<Office>(
      'SELECT * FROM "Office" WHERE id = $1',
      [id]
    );
  },

  // Get offices by company
  async getByCompany(companyId: number): Promise<Office[]> {
    return await DatabaseService.query<Office>(
      'SELECT * FROM "Office" WHERE "companyId" = $1',
      [companyId]
    );
  },

  // Create new office
  async create(officeData: Partial<Office>): Promise<Office> {
    return await DatabaseService.insert<Office>('Office', officeData);
  },

  // Update office
  async update(id: number, officeData: Partial<Office>): Promise<Office | null> {
    return await DatabaseService.updateOne<Office>(
      'Office',
      'id = $1',
      [id],
      officeData
    );
  },

  // Delete office
  async delete(id: number): Promise<boolean> {
    const deletedCount = await DatabaseService.delete('Office', 'id = $1', [id]);
    return deletedCount > 0;
  }
};

// Reservation API functions
export const reservationService = {
  // Get reservation by ID
  async getById(id: number): Promise<Reservation | null> {
    return await DatabaseService.queryOne<Reservation>(
      `SELECT r.*, u.name as user_name, u.email as user_email,
              c.make as car_make, c.model as car_model, c."pricePerDay" as car_price
       FROM "Reservation" r
       JOIN "User" u ON r."userId" = u.id
       JOIN "Car" c ON r."carId" = c.id
       WHERE r.id = $1`,
      [id]
    );
  },

  // Get reservations by user
  async getByUser(userId: number): Promise<Reservation[]> {
    return await DatabaseService.query<Reservation>(
      `SELECT r.*, c.make as car_make, c.model as car_model, c."pricePerDay" as car_price,
              co.name as company_name
       FROM "Reservation" r
       JOIN "Car" c ON r."carId" = c.id
       LEFT JOIN "Company" co ON c."companyId" = co.id
       WHERE r."userId" = $1
       ORDER BY r."startDate" DESC`,
      [userId]
    );
  },

  // Get reservations by car
  async getByCar(carId: number): Promise<Reservation[]> {
    return await DatabaseService.query<Reservation>(
      `SELECT r.id, r."firstName", r."lastName", r.email, r.phone, r.notes, r.status, r."createdAt",
              r."startDate" as start_date, r."endDate" as end_date, r."carId",
              u.name as user_name, u.email as user_email
       FROM "Reservation" r
       LEFT JOIN "User" u ON r."userId" = u.id
       WHERE r."carId" = $1
       ORDER BY r."startDate" DESC`,
      [carId]
    );
  },

  // Get reservations by company
  async getByCompany(companyId: number): Promise<Reservation[]> {
    return await DatabaseService.query<Reservation>(
      `SELECT r.*, u.name as user_name, u.email as user_email,
              c.make as car_make, c.model as car_model
       FROM "Reservation" r
       JOIN "User" u ON r."userId" = u.id
       JOIN "Car" c ON r."carId" = c.id
       WHERE c."companyId" = $1
       ORDER BY r."startDate" DESC`,
      [companyId]
    );
  },

  // Create new reservation
  async create(reservationData: Partial<Reservation>): Promise<Reservation> {
    return await DatabaseService.insert<Reservation>('Reservation', reservationData);
  },

  // Update reservation status
  async updateStatus(id: number, status: Reservation['status']): Promise<Reservation | null> {
    return await DatabaseService.updateOne<Reservation>(
      'Reservation',
      'id = $1',
      [id],
      { status }
    );
  },

  // Update reservation
  async update(id: number, reservationData: Partial<Reservation>): Promise<Reservation | null> {
    return await DatabaseService.updateOne<Reservation>(
      'Reservation',
      'id = $1',
      [id],
      reservationData
    );
  },

  // Check if car is available for dates
  async isCarAvailable(carId: number, startDate: Date, endDate: Date, excludeReservationId?: number): Promise<boolean> {
    let query = `
      SELECT COUNT(*) as count
      FROM "Reservation" 
      WHERE "carId" = $1 
      AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
      AND (
        ("startDate" <= $2 AND "endDate" >= $3) OR
        ("startDate" <= $3 AND "endDate" >= $2) OR
        ("startDate" >= $2 AND "endDate" <= $3)
      )
    `;
    const params = [carId, startDate, endDate];

    if (excludeReservationId) {
      query += ` AND id != $4`;
      params.push(excludeReservationId);
    }

    const result = await DatabaseService.queryScalar(query, params);
    return Number(result) === 0;
  }
};

// Review API functions
export const reviewService = {
  // Get reviews by car
  async getByCar(carId: number): Promise<Review[]> {
    return await DatabaseService.query<Review>(
      `SELECT r.*, u.name as user_name
       FROM "Review" r
       JOIN "User" u ON r."userId" = u.id
       WHERE r."carId" = $1
       ORDER BY r."createdAt" DESC`,
      [carId]
    );
  },

  // Get reviews by user
  async getByUser(userId: number): Promise<Review[]> {
    return await DatabaseService.query<Review>(
      `SELECT r.*, c.make as car_make, c.model as car_model
       FROM "Review" r
       JOIN "Car" c ON r."carId" = c.id
       WHERE r."userId" = $1
       ORDER BY r."createdAt" DESC`,
      [userId]
    );
  },

  // Create new review
  async create(reviewData: Partial<Review>): Promise<Review> {
    return await DatabaseService.insert<Review>('Review', reviewData);
  },

  // Get average rating for car
  async getAverageRating(carId: number): Promise<number> {
    const result = await DatabaseService.queryScalar(
      'SELECT AVG(rating) as avg_rating FROM "Review" WHERE "carId" = $1',
      [carId]
    );
    return parseFloat(result) || 0;
  }
};

// Transaction utilities
export const transactionService = {
  // Begin a transaction
  async beginTransaction() {
    return await DatabaseService.beginTransaction();
  },

  // Commit a transaction
  async commitTransaction(client: any) {
    return await DatabaseService.commitTransaction(client);
  },

  // Rollback a transaction
  async rollbackTransaction(client: any) {
    return await DatabaseService.rollbackTransaction(client);
  }
};

// Export all services
export const api = {
  user: userService,
  company: companyService,
  car: carService,
  office: officeService,
  reservation: reservationService,
  review: reviewService,
  transaction: transactionService
};

export default api;