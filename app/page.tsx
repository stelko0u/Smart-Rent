import HomePageClient from './HomePage';
import { getAuthUser } from '@/lib/auth';
import { getCarsBrowseData } from '@/lib/services/car/carBrowseService';
import { normalizeRole } from '@/lib/auth/normalizeRole';
import { mapCarToHomeCar } from '@/lib/mappers/homeCarMapper';
import type { HomeCar, Role } from '@/types/home';

type HomePageData = {
  isLoggedIn: boolean;
  role: Role;
  initialCars: HomeCar[];
};

async function getHomePageData(): Promise<HomePageData> {
  const [user, carsResult] = await Promise.all([
    getAuthUser(),
    getCarsBrowseData({
      officeId: null,
      startDate: null,
      endDate: null,
    }),
  ]);

  return {
    isLoggedIn: user !== null,
    role: normalizeRole(user?.role),
    initialCars: Array.isArray(carsResult?.cars)
      ? carsResult.cars.map(mapCarToHomeCar)
      : [],
  };
}

export default async function HomePage() {
  const homePageData = await getHomePageData();
  return <HomePageClient {...homePageData} />;
}
