import {
  getAllOfficesForCarFilters,
  getFilteredCars,
} from '@/lib/repository/car/carBrowseRepository';
import { isValidDate } from '@/lib/utils/date';

type Input = {
  officeId: string | null;
  startDate: string | null;
  endDate: string | null;
};

export async function getCarsBrowseData(input: Input) {
  const hasRange = isValidDate(input.startDate) && isValidDate(input.endDate);

  const parsedOfficeId = input.officeId ? Number(input.officeId) : null;

  const [cars, offices] = await Promise.all([
    getFilteredCars({
      officeId: parsedOfficeId,
      startDate: hasRange ? input.startDate : null,
      endDate: hasRange ? input.endDate : null,
      hasRange,
    }),
    getAllOfficesForCarFilters(),
  ]);

  return {
    ok: true,
    filters: {
      officeId: parsedOfficeId,
      startDate: hasRange ? input.startDate : null,
      endDate: hasRange ? input.endDate : null,
    },
    cars,
    offices,
  };
}
