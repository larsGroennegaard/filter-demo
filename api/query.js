// This is our new serverless function that will run on Vercel's backend.
// It securely connects to BigQuery and executes queries.

const { BigQuery } = require('@google-cloud/bigquery');

// --- NEW: Explicit Credential Handling ---
// This function initializes the BigQuery client.
// It first tries to use the JSON string from the Vercel environment variable.
// If that's not available (like in local development), it falls back to
// the default behavior (which uses your local .env file).
const initializeBigQuery = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      return new BigQuery({ credentials });
    } catch (e) {
      console.error("Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:", e);
      // Fallback to default auth if parsing fails
      return new BigQuery();
    }
  } else {
    // This will be used for your local `vercel dev` environment
    return new BigQuery();
  }
};

const bigquery = initializeBigQuery();

// Define the full BigQuery table names to avoid repetition.
const BQ_TABLE = '`product-471619.report_components.dreamdata_io`';
const BQ_VALUES_TABLE = '`product-471619.property_values_lookup.dreamdata_io`';


// Use module.exports for a Vercel Serverless Function in Node.js
module.exports = async (req, res) => {
  // --- CORS Headers for local development ---
  // These headers allow your local React app (e.g., on localhost:3000)
  // to talk to this API function when it's running.
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*') // In production, you might restrict this to your domain
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  // Respond to pre-flight requests from the browser
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
    
  // We will get the name of the query we want to run from the URL.
  // e.g., /api/query?queryName=getAnalysisTypes
  const { queryName, analysisType, propertyId } = req.query;

  if (!queryName) {
    return res.status(400).json({ error: 'Missing required parameter: queryName' });
  }

  try {
    let query = '';
    let options = {};

    // A switch statement to handle different queries based on queryName.
    switch (queryName) {
      case 'getAnalysisTypes':
        query = `SELECT DISTINCT analysis_type FROM ${BQ_TABLE} ORDER BY analysis_type`;
        options = { query: query };
        break;

      case 'getFiltersForType':
        if (!analysisType) {
          return res.status(400).json({ error: 'Missing required parameter for getFiltersForType: analysisType' });
        }
        query = `SELECT f.*
                 FROM ${BQ_TABLE}, UNNEST(available_filter_properties) AS f
                 WHERE analysis_type = @analysisType`;
        options = {
          query: query,
          // Parameters help prevent security issues like SQL injection.
          params: { analysisType: analysisType },
        };
        break;
    
      case 'getPropertyValues':
        if(!propertyId){
             return res.status(400).json({ error: 'Missing required parameter for getPropertyValues: propertyId' });
        }
        query = `SELECT label, value FROM ${BQ_VALUES_TABLE} WHERE property_id = @propertyId ORDER BY sort`;
        options = {
            query: query,
            params: { propertyId: propertyId }
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid queryName specified.' });
    }

    // This is where we actually run the BigQuery query.
    const [rows] = await bigquery.query(options);
    
    // For the analysis types, we want to return a simple array of strings,
    // like ['journeys', 'performance', ...], not an array of objects.
    if (queryName === 'getAnalysisTypes') {
      const types = rows.map(row => row.analysis_type);
      return res.status(200).json(types);
    }
    
    // For all other queries, return the rows as they are.
    return res.status(200).json(rows);

  } catch (error)
   {
    console.error('BigQuery Error:', error);
    // Send a generic error message back to the client.
    res.status(500).json({ error: 'Failed to query BigQuery.', details: error.message });
  }
}

