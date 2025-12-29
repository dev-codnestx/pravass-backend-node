
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Document, PipelineStage, Schema, SortOrder } from 'mongoose';

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
}

export interface QueryResult<T = Document> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

const buildNestedPopulateQuery = (field: string, selectFields: string[]) => {
  const nestedPathSegments = field.split('.');

  if (nestedPathSegments.length > 1) {
    const [firstSegment, ...restSegments] = nestedPathSegments;
    return {
      path: firstSegment,
      select: selectFields.join(' '),
      populate: buildNestedPopulateQuery(restSegments.join('.'), selectFields),
    };
  } else {
    return {
      path: field,
      select: selectFields.join(' '),
    };
  }
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
});

// Extract deep value (normal get)
function getDeepValue(obj, path) {
  const parts = path.split('.');
  return parts.reduce((current, key) => {
    if (Array.isArray(current)) {
      const values = current.map((item) => item?.[key]);
      return values.find((v) => v !== undefined && v !== null);
    }
    return current ? current[key] : undefined;
  }, obj);
}

// Deep rename field (fixing array handling)
function renameNestedField(obj, sourcePath, targetKey) {
  const parts = sourcePath.split('.');
  let current = obj;

  function deepRename(currentObj, pathParts) {
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

  deepRename(current, parts);
}

const paginate = <T extends Document>(schema: Schema<T>) => {
  schema.statics.paginate = async function (
    filter: Record<string, string> = {},
    options: PaginateOptions = {},
  ): Promise<QueryResult<T>> {
    let sort: Record<string, SortOrder> = {};
    let responseResult: QueryResult<T>;

    if (options.sortBy)
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        const sortOrder = order === 'desc' ? -1 : 1;

        if (!key) throw new Error(`Invalid field "${key}" passed to sort()`);

        if (key === 'name') sort[key] = sortOrder;
        else if (key === 'date') sort.createdAt = sortOrder;
        else sort[key] = sortOrder;
      });
    else sort.createdAt = -1;

    let limit = 10;
    let skip = 0;
    const page = (options.page && parseInt(options.page.toString(), 10)) || 1;

    if (page === -1) {
      limit = Number.MAX_SAFE_INTEGER;
      skip = 0;
    } else {
      limit = options.limit && parseInt(options.limit.toString(), 10) > 0 ? parseInt(options.limit.toString(), 10) : 10;
      skip = (page - 1) * limit;
    }

    const selectFields = options.fields ? options.fields.split(',') : [];
    const populateFields = options.populate || '';

    let countPromise: Promise<number>;
    let docsPromise: any;

    if (options.aggregation) {
      docsPromise = this.aggregate(options.aggregation).sort(sort).skip(skip).limit(limit);

      const countPipeline = [...options.aggregation, { $count: 'totalResults' }];
      const countResult = await this.aggregate(countPipeline);

      const totalResults = countResult.length > 0 ? countResult[0].totalResults : 0;
      const totalPages = Math.ceil(totalResults / limit);
      let results = await docsPromise;

      if (options.isShuffleRecord) results = results.sort(() => Math.random() - 0.5);

      const formattedResults = results.map((doc: any) => {
        if (typeof options.alias === 'string' && options.alias.length > 0) {
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
              const fields = fieldsString.split(',').map((f) => f.trim());
              fields.forEach((field) => {
                const fullPath = basePath ? `${basePath}.${field}` : field;
                const value = getDeepValue(doc, fullPath);
                if (value !== undefined) doc[field] = value;
              });
            }
          });
        }

        doc.id = doc._id;
        delete doc._id;
        return doc;
      });

      responseResult = buildResult(formattedResults, totalResults, totalPages, page, limit);
    } else {
      countPromise = this.countDocuments(filter).exec();
      docsPromise = this.find(filter).sort(sort).skip(skip).limit(limit);

      if (selectFields.length > 0) docsPromise = docsPromise.select(selectFields.join(' '));

      if (populateFields.length > 0)
        populateFields.split(';').forEach((populateOption) => {
          populateOption = populateOption.trim();
          if (!populateOption) return;

          const [path, fields] = populateOption.split(':');
          const select = fields ? fields.split(',').map((f) => f.trim()) : ['_id'];

          if (path) {
            const pathSegments = path.split('-');

            if (pathSegments.length === 2) {
              const [parentField, childFields] = pathSegments;
              const childPathSegments = childFields.split(',');

              docsPromise = docsPromise.populate({
                path: parentField,
                select: select.join(' '),
                populate: childPathSegments.map((childField) => buildNestedPopulateQuery(childField, select)),
              });
            } else if (path.includes('.')) {
              const [parentField, ...rest] = path.split('.');
              const childPath = rest.join('.');

              docsPromise = docsPromise.populate({
                path: parentField,
                select: select.join(' '),
                populate: buildNestedPopulateQuery(childPath, select),
              });
            } else {
              docsPromise = docsPromise.populate({
                path,
                select: select.join(' '),
              });
            }
          }
        });
      await Promise.all([countPromise, docsPromise]).then((values) => {
        let [totalResults, results] = values;

        const totalPages = page === -1 ? 1 : Math.ceil(totalResults / limit);

        if (options.isShuffleRecord === true) results = results.sort(() => Math.random() - 0.5);

        // Extract deep value (normal get)===
        function getDeepValue(obj, path) {
          const parts = path.split('.');
          return parts.reduce((current, key) => {
            if (Array.isArray(current)) {
              const values = current.map((item) => item?.[key]);
              return values.find((v) => v !== undefined && v !== null);
            }
            return current ? current[key] : undefined;
          }, obj);
        }

        const formattedResults = results.map((doc) => {
          if (options.populate && options.populate.length > 0) {
            const aliasRules = options.populate
              .split(';')
              .map((r) => r.trim())
              .filter(Boolean);

            aliasRules.forEach((rule) => {
              if (rule.includes(':')) {
                const [basePath, fieldsString] = rule.split(':').map((s) => s.trim());
                const fields = fieldsString.split(',').map((f) => f.trim());
                fields.forEach((field) => {
                  const fullPath = basePath ? `${basePath}.${field}` : field;
                  const value = getDeepValue(doc, fullPath);
                  // Do not overwrite existing top-level fields (e.g., prevent source.name from overriding name)
                  if (value !== undefined && doc[field] === undefined) doc[field] = value;
                });
              }
            });
          }

          doc.id = doc._id;
          delete doc._id;
          return doc;
        });
        results = formattedResults.map((doc) =>
          doc.toJSON({
            includeTimeStamps: options.includeTimeStamps,
            alias: options.alias || {},
          }),
        );

        responseResult = buildResult(results, totalResults, totalPages, page, limit);
      });
    }
    return responseResult;
  };
};

export default paginate;
