const mongoose = require('mongoose');

// encode cursor
function encodeCursor(doc, sortField) {
  const payload = {
    _id: doc._id.toString(),
    [sortField]: doc[sortField] instanceof Date  
      ? doc[sortField].toISOString()
      : doc[sortField],
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// decode cursor
function decodeCursor(cursor, sortField) {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    return {
      _id: new mongoose.Types.ObjectId(decoded._id),  // ignore deprecated warning because creating ObjectId from string is valid
      value: decoded[sortField] instanceof Date
        ? new Date(decoded[sortField])
        : decoded[sortField],
    };
  } catch {
    return null;
  }
}

// utility function for paginating mongoose queries using cursor-based pagination
async function paginateQuery({
  Model,    // collection/model to query
  filter = {},  
  cursor,   // cursor base-64 string from client
  sortField = 'createdAt',
  sortOrder = -1,
  limit = 10,   // number of items per page
  populate = [],    // fields of the model to populate
  projection = null,    // fields from the model to return
}) {
  const pageSize = parseInt(limit, 10);

  // apply cursor filter if present
  if (cursor) {
    const cursorData = decodeCursor(cursor, sortField);
    if (!cursorData) throw new Error('Invalid cursor');

    filter.$or = [
      { [sortField]: { [sortOrder === -1 ? '$lt' : '$gt']: cursorData.value } },  // primary sort field
      { [sortField]: cursorData.value, _id: { [sortOrder === -1 ? '$lt' : '$gt']: cursorData._id } }  // tie-breaker with _id
    ];
  }

  // building the mongoose query object
  let query = Model.find(filter, projection)
    .sort({ [sortField]: sortOrder, _id: sortOrder })
    .limit(pageSize + 1);

  if (populate && populate.length) {
    query = query.populate(populate);
  }
  
  const docs = await query.lean();

  const hasMore = docs.length > pageSize;
  if (hasMore) docs.pop();

  const nextCursor = hasMore ? encodeCursor(docs[docs.length - 1], sortField) : null;

  return {
    items: docs,
    nextCursor,
    hasMore,
  };
}

module.exports = paginateQuery;
