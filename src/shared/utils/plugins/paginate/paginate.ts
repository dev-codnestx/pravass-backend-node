/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Model, PipelineStage, Schema, SortOrder } from 'mongoose';

export interface PaginateOptions {
  sortBy?: string;
  populate?: string;
  limit?: number;
  page?: number;
  fields?: string;
  aggregation?: PipelineStage[];
  alias?: string;
  includeTimeStamps?: boolean;
  isShuffleRecord?: boolean;
  notDefaultSort?: boolean;
}

export type IOptions = PaginateOptions;

export interface QueryResult<T = any> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
  total: number; // Alias for totalResults
  counts?: Record<string, number>;
  [key: string]: any;
}

/**
 * Interface for the Model containing the static paginate method
 */
export interface PaginateModel<T extends Document> extends Model<T> {
  paginate(filter: Record<string, any>, options: PaginateOptions): Promise<QueryResult<T>>;
}

// --- Helper Functions ---

const buildNestedPopulateQuery = (field: string, selectFields?: string[]): any => {
  const nestedPathSegments = field.split('.');
  const select = selectFields ? selectFields.join(' ') : '';

  if (nestedPathSegments.length > 1) {
    const [firstSegment, ...restSegments] = nestedPathSegments;
    return {
      path: firstSegment,
      select,
      populate: buildNestedPopulateQuery(restSegments.join('.'), selectFields),
    };
  }
  return {
    path: field,
    select,
  };
};

const buildResult = <T>(
  results: T[],
  totalResults: number,
  totalPages: number,
  page: number,
  limit: number,
): QueryResult<T> => ({
  results,
  page: page === -1 ? 1 : page || 1,
  limit: page === -1 ? totalResults : limit,
  totalPages,
  totalResults,
  total: totalResults, // Added alias for compatibility with frontend expectations
});

function getDeepValue(obj: any, path: string): any {
  const parts = path.split('.');
  return parts.reduce((current, key) => {
    if (Array.isArray(current)) {
      const values = current.map((item) => item?.[key]);
      return values.find((v) => v !== undefined && v !== null);
    }
    return current ? current[key] : undefined;
  }, obj);
}

function renameNestedField(obj: any, sourcePath: string, targetKey: string): void {
  const parts = sourcePath.split('.');

  function deepRename(currentObj: any, pathParts: string[]) {
    if (!currentObj) return;

    const [firstPart, ...restParts] = pathParts;

    if (Array.isArray(currentObj)) {
      currentObj.forEach((item) => deepRename(item, pathParts));
      return;
    }

    if (restParts.length === 0) {
      if (currentObj[firstPart] !== undefined) {
        currentObj[targetKey] = currentObj[firstPart];
        delete currentObj[firstPart];
      }
    } else {
      deepRename(currentObj[firstPart], restParts);
    }
  }

  deepRename(obj, parts);
}

// --- Main Plugin ---

const paginate = <T extends Document>(schema: Schema<T>): void => {
  schema.statics.paginate = async function (
    filter: Record<string, any> = {},
    options: PaginateOptions = {},
  ): Promise<QueryResult<any>> {
    const sort: Record<string, SortOrder> = {};
    let responseResult: QueryResult<any>;

    // 1. Handle Sorting
    if (options.sortBy)
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        const sortOrder: SortOrder = order === 'desc' ? -1 : 1;
        if (!key) throw new Error(`Invalid field "${key}" passed to sort()`);

        if (key === 'date') sort.createdAt = sortOrder;
        else sort[key] = sortOrder;
      });

    if (!options.aggregation && !options.notDefaultSort && !Object.keys(sort).length) sort.createdAt = -1;

    // 2. Pagination Logic
    const page = (options.page && parseInt(options.page.toString(), 10)) || 1;
    let limit = options.limit && parseInt(options.limit.toString(), 10) > 0 ? parseInt(options.limit.toString(), 10) : 10;
    let skip = (page - 1) * limit;

    if (page === -1) {
      limit = Number.MAX_SAFE_INTEGER;
      skip = 0;
    }

    const selectFields = options.fields ? options.fields.split(',') : [];
    if (options.includeTimeStamps && options.fields) selectFields.push('createdAt', 'updatedAt');

    // 3. Execution (Aggregation vs Find)
    if (options.aggregation) {
      const aggregationPipeline = [...options.aggregation];

      // Handle count separately for aggregations
      const countPipeline = [...aggregationPipeline, { $count: 'totalResults' }];
      const countResult = await this.aggregate(countPipeline);
      const totalResults = countResult.length > 0 ? countResult[0].totalResults : 0;
      const totalPages = Math.ceil(totalResults / limit);

      // Main query
      let query = this.aggregate(aggregationPipeline);
      if (Object.keys(sort).length) query = query.sort(sort);

      let results = await query.skip(skip).limit(limit).exec();

      if (options.isShuffleRecord) results = results.sort(() => Math.random() - 0.5);

      const formattedResults = results.map((doc: any) => {
        if (options.alias) {
          const aliasRules = options.alias
            .split(';')
            .map((r) => r.trim())
            .filter(Boolean);
          aliasRules.forEach((rule) => {
            if (rule.includes('::')) {
              const [sourcePath, targetKey] = rule.split('::').map((s) => s.trim());
              renameNestedField(doc, sourcePath, targetKey);
            } else if (rule.includes(':')) {
              const [basePath, fieldsString] = rule.split(':').map((s) => s.trim());
              fieldsString
                .split(',')
                .map((f) => f.trim())
                .forEach((field) => {
                  const fullPath = basePath ? `${basePath}.${field}` : field;
                  const value = getDeepValue(doc, fullPath);
                  if (value !== undefined) doc[field] = value;
                });
            }
          });
        }
        doc.id = doc._id?.toString();
        // Keep _id if it's not a plain object or if toJSON hasn't run yet,
        // but typically for aggregation results we want to standardize on id.
        return doc;
      });

      responseResult = buildResult(formattedResults, totalResults, totalPages, page, limit);
    } else {
      // Standard Find Query
      const countPromise = this.countDocuments(filter).exec();
      let docsPromise = this.find(filter).sort(sort).skip(skip).limit(limit);

      if (selectFields.length > 0) docsPromise = docsPromise.select(selectFields.join(' '));

      // Handle Populates
      if (options.populate)
        options.populate.split(';').forEach((populateOption) => {
          const opt = populateOption.trim();
          if (!opt) return;

          const [rawPath, fields] = opt.split(':');
          const path = rawPath.replace(/,/g, ' ');
          const select = fields ? fields.split(',').map((f) => f.trim()) : undefined;

          if (path)
            if (path.includes('-')) {
              const [parentField, childFields] = path.split('-');
              docsPromise = docsPromise.populate({
                path: parentField,
                select: select ? select.join(' ') : '',
                populate: childFields.split(',').map((child) => buildNestedPopulateQuery(child, select)),
              });
            } else if (path.includes('.')) {
              const [parent, ...rest] = path.split('.');
              docsPromise = docsPromise.populate({
                path: parent,
                select: select ? select.join(' ') : '',
                populate: buildNestedPopulateQuery(rest.join('.'), select),
              });
            } else {
              docsPromise = docsPromise.populate({ path, select: select ? select.join(' ') : '' });
            }
        });

      const [totalResults, results] = await Promise.all([countPromise, docsPromise]);
      const totalPages = page === -1 ? 1 : Math.ceil(totalResults / limit);

      let finalResults = results;
      if (options.isShuffleRecord) finalResults = finalResults.sort(() => Math.random() - 0.5);

      const formattedResults = finalResults.map((doc: any) => {
        // Apply mapping/formatting to plain objects or Mongoose docs
        const plainDoc = doc.toJSON ? doc.toJSON({ virtuals: true }) : doc;

        if (options.populate)
          options.populate
            .split(';')
            .map((r) => r.trim())
            .filter(Boolean)
            .forEach((rule) => {
              if (rule.includes(':')) {
                const [basePath, fieldsString] = rule.split(':').map((s) => s.trim());
                fieldsString
                  .split(',')
                  .map((f) => f.trim())
                  .forEach((field) => {
                    const fullPath = basePath ? `${basePath}.${field}` : field;
                    const value = getDeepValue(plainDoc, fullPath);
                    // Support both comma and space separated fields for flattening
                    if (value !== undefined && (plainDoc[field] === undefined || plainDoc[field] === null))
                      plainDoc[field] = value;
                  });
              }
            });

        if (plainDoc._id) plainDoc.id = plainDoc._id.toString();
        return plainDoc;
      });

      responseResult = buildResult(formattedResults, totalResults, totalPages, page, limit);
    }

    return responseResult;
  };
};

export default paginate;
