import { Types } from 'mongoose';
import { masterModels } from '@/modules/masters/models/master.models.js';
import { getObjectId } from '@/shared/utils/commonHelper.js';
import pick from '@/shared/utils/pick.js';

/**
 * Process tour query parameters into Mongoose filter and options
 * @param query req.query
 * @param headers req.headers
 * @returns { filter, options }
 */
export const processTourQuery = async (query: Record<string, any>, headers: Record<string, any>) => {
  const filter: Record<string, any> = pick(query, [
    'name',
    'status',
    'tourType',
    'tourCategory',
    'category',
    'difficulty',
    'code',
    'departureCity',
    'budget',
    'rating',
    'duration',
  ]);
  const options = pick(query, ['sortBy', 'limit', 'page', 'populate', 'fields', 'includeTimeStamps']);

  const unifiedCategory = (query.category || query.tourCategory || '').toLowerCase();
  if (unifiedCategory && unifiedCategory !== 'all') filter.tourCategory = unifiedCategory;

  // Remove non-model fields that were picked
  delete filter.category;

  // Default to active tours for website if no status provided
  if (!filter.status && headers['x-client-type'] === 'website') filter.status = 'active';
  if (filter.status) filter.status = filter.status.toLowerCase();

  // Remove non-model fields that are handled separately below
  delete filter.departureCity;
  delete filter.budget;
  delete filter.rating;

  const parseDestinationIds = (value: unknown) => {
    const rawValues = (Array.isArray(value) ? value : [value])
      .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : [entry]))
      .filter((entry) => entry !== undefined && entry !== null);

    return rawValues
      .map((entry) => String(entry ?? '').trim())
      .filter(Boolean)
      .map((entry) => getObjectId(entry))
      .filter((entry): entry is Exclude<typeof entry, string> => typeof entry !== 'string');
  };

  const destinationIdsFromQuery = parseDestinationIds([
    ...(Array.isArray(query.destinationIds) ? query.destinationIds : [query.destinationIds]),
    ...(Array.isArray(query.destination) ? query.destination : [query.destination]),
  ]);

  if (query.zoneId || query.cityId || query.stateId) {
    const destinationFilter: Record<string, any> = { deletedAt: null };

    if (query.cityId) {
      destinationFilter.cityId = getObjectId(query.cityId);
    } else if (query.zoneId) {
      // Find all cities in this zone
      const cities = await masterModels.locations
        .find({ type: 'city', zoneId: getObjectId(query.zoneId), deletedAt: null })
        .select('_id')
        .lean();
      const cityIds = cities.map((c) => c._id);
      destinationFilter.cityId = { $in: cityIds };
    } else if (query.stateId) {
      destinationFilter.stateId = getObjectId(query.stateId);
    }

    const matchedDestinations = await masterModels.destinations.find(destinationFilter).select('_id').lean();
    matchedDestinations.forEach((d) => destinationIdsFromQuery.push(d._id));
  }

  if (destinationIdsFromQuery.length > 0) filter.destinationIds = { $in: destinationIdsFromQuery };

  if (query.search) {
    const searchRegex = { $regex: query.search, $options: 'i' };
    const matchedDestinations = await masterModels.destinations
      .find({ name: searchRegex, deletedAt: null })
      .select('_id')
      .lean();
    const destinationIds = matchedDestinations.map((item) => item._id);
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { description: searchRegex },
      ...(destinationIds.length > 0 ? [{ destinationIds: { $in: destinationIds } }] : []),
    ];
  }

  // Sort mapping
  if (query.sort) {
    if (query.sort === 'price-asc') options.sortBy = 'price:asc';
    else if (query.sort === 'price-desc') options.sortBy = 'price:desc';
    else if (query.sort === 'popularity') options.sortBy = 'bookings:desc';
  } else if (query.sortBy) {
    options.sortBy = query.sortBy as string;
  }

  // 1. Departure City
  if (query.departureCity) {
    const deptValues = (query.departureCity as string).split(',');
    const validIds = deptValues.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length > 0) filter.departureCities = { $in: validIds };
  }

  // 2. Tour Type
  if (query.tourType) {
    const typeValues = (query.tourType as string).split(',');
    const validIds = typeValues.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length > 0) filter.tourType = { $in: validIds };
  }

  // 3. Budget
  if (query.budget) {
    const [min, max] = (query.budget as string).split('-').map(Number);
    filter.price = { $gte: min };
    if (max) filter.price.$lte = max;
  }

  // 4. Rating
  if (query.rating) {
    const minRating = Number(query.rating);
    filter.ratings = { $gte: minRating };
  }

  // 5. Duration
  if (query.duration) {
    const ranges = (query.duration as string).split(',');
    const durationRegexPatterns = ranges
      .map((range) => {
        if (range === '1-3') return '([1-3])\\s*(N|Nights?)';
        if (range === '4-6') return '([4-6])\\s*(N|Nights?)';
        if (range === '7-10') return '([7-9]|10)\\s*(N|Nights?)';
        if (range === '10+') return '(1[1-9]|[2-9][0-9])\\s*(N|Nights?)';
        return '';
      })
      .filter(Boolean);

    if (durationRegexPatterns.length > 0) filter.duration = { $regex: durationRegexPatterns.join('|'), $options: 'i' };
  }

  return { filter, options };
};
