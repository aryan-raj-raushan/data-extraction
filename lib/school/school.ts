export const SCHOOL_DB_NAME = 'static_data';
export const SCHOOL_COLLECTION = 'static_school_data';

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// Hard cap on export row count so a single request can't try to stream
// 2 lakh+ rows and time out the serverless function. Narrow filters
// (pick a district/block) to export more than this in one go.
export const EXPORT_ROW_CAP = 50000;
