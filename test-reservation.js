// Test script for reservation API
const testReservation = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        carId: 1,
        startDate: '2026-02-01',
        endDate: '2026-02-03',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        notes: 'Test reservation'
      }),
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
  } catch (error) {
    console.error('Test error:', error);
  }
};

testReservation();