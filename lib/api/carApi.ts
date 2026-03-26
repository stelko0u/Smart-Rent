export async function fetchOfficeByCarId(carId: number) {
  try {
    // Adjusted endpoint to fetch office details for a specific car
    const res = await fetch(`/api/cars/${carId}/office`);

    if (!res.ok) {
      throw new Error('Failed to fetch office details');
    }

    // Parse the response to get office details
    const office = await res.json();

    // Return the office details in the expected format
    return {
      id: office.id,
      name: office.name,
      latitude: Number(office.latitude),
      longitude: Number(office.longitude),
      address: office.address,
    };
  } catch (error) {
    console.error('Error fetching office details by car ID:', error);
    throw error;
  }
}

export async function fetchCarById(carId: number | string) {
  const res = await fetch(`/api/cars/${carId}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load car details');
  }

  return data.car;
}
