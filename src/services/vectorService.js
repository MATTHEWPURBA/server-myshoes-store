const { PrismaClient } = require('@prisma/client');
const tf = require('@tensorflow/tfjs-node');
const use = require('@tensorflow-models/universal-sentence-encoder');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
let model = null;

/**
 * Initialize the Universal Sentence Encoder model
 * @returns {Promise<Object>} - USE model
 */
async function initializeModel() {
  try {
    if (!model) {
      logger.info('Loading Universal Sentence Encoder model...');
      model = await use.load();
      logger.info('Model loaded successfully');
    }
    return model;
  } catch (error) {
    logger.error('Error loading model:', error);
    throw error;
  }
}

/**
 * Generate embedding for text
 * @param {string} text - Text to embed
 * @returns {Promise<Array>} - Embedding vector
 */
async function generateEmbedding(text) {
  try {
    const encoder = await initializeModel();
    const embeddings = await encoder.embed([text]);
    const embeddingArray = await embeddings.array();
    return embeddingArray[0];
  } catch (error) {
    logger.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Find products using vector search
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of products
 */

// async function findRelevantProducts(query, limit = 3) {
//   try {
//     // Extract specific attributes from query
//     const attributes = extractAttributes(query);
//     logger.info(`Extracted attributes: ${JSON.stringify(attributes)}`);
//     // Define attributeResults outside the if blocks
//     let attributeResults = [];

//     // If we found specific attributes, use exact attribute matching first
//     if (Object.keys(attributes).length > 0) {
//       // Build attribute query
//       const whereClause = buildAttributeWhereClause(attributes, query);
//       logger.info(`Built where clause: ${JSON.stringify(whereClause)}`);

//       // Try attribute-based search
//       attributeResults = await prisma.shoe.findMany({
//         where: whereClause,
//         take: limit,
//         orderBy: { stock: 'desc' }, // Prioritize in-stock items
//       });

//       // Log the actual results for debugging
//       logger.info(
//         `Attribute search results: ${JSON.stringify(
//           attributeResults.map((r) => ({
//             id: r.id,
//             name: r.name,
//             color: r.color,
//             size: r.size,
//           }))
//         )}`
//       );

//       // If we get results with attribute filtering, return them
//       if (attributeResults.length > 0) {
//         logger.info(`Found ${attributeResults.length} results using attribute search`);
//         return attributeResults;
//       }
//     }

//     // If attribute search returns nothing, try a looser search
//     if (Object.keys(attributes).length > 0 && attributeResults.length === 0) {
//       logger.info(`No exact matches found, trying looser attribute search`);

//       // Try looser match for color (if that was extracted)
//       if (attributes.color) {
//         const looseColorResults = await prisma.shoe.findMany({
//           where: {
//             color: {
//               contains: attributes.color,
//               mode: 'insensitive',
//             },
//             stock: { gt: 0 },
//           },
//           take: limit,
//         });

//         if (looseColorResults.length > 0) {
//           logger.info(`Found ${looseColorResults.length} results using loose color match`);
//           return looseColorResults;
//         }
//       }
//     }

//     // Proceed with vector search as a fallback
//     const embedding = await generateEmbedding(query);

//     // Check if pgvector is available
//     let pgvectorAvailable = false;
//     try {
//       await prisma.$executeRaw`SELECT 'vector'::regtype`;
//       pgvectorAvailable = true;
//     } catch (err) {
//       logger.warn('pgvector not available, falling back to keyword search');
//     }

//     if (pgvectorAvailable) {
//       try {
//         const results = await prisma.$queryRaw`
//           SELECT s.*, 
//             1 - (pe.embedding <=> ${embedding}::vector) as similarity
//           FROM "ProductEmbedding" pe
//           JOIN "Shoe" s ON pe.id = s.id
//           WHERE s.stock > 0
//           ORDER BY similarity DESC
//           LIMIT ${limit};
//         `;

//         if (results.length > 0) {
//           logger.info(`Found ${results.length} results using vector search`);
//           return results;
//         }
//       } catch (vectorError) {
//         logger.error('Vector search failed, falling back to keyword search:', vectorError);
//       }
//     }

//     // Enhanced keyword search as final fallback
//     const enhancedResults = await prisma.shoe.findMany({
//       where: {
//         OR: [
//           { name: { contains: query, mode: 'insensitive' } },
//           { brand: { contains: query, mode: 'insensitive' } },
//           { description: { contains: query, mode: 'insensitive' } },
//           { color: { contains: query, mode: 'insensitive' } }, // Explicitly search color
//         ],
//         stock: { gt: 0 },
//       },
//       take: limit,
//     });

//     logger.info(`Found ${enhancedResults.length} results using enhanced keyword search`);
//     return enhancedResults;
//   } catch (error) {
//     logger.error('Error in product search:', error);
//     return [];
//   }
// }












// Helper function to extract attributes from query





/**
 * Find products using vector search
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of products
 */
async function findRelevantProducts(query, limit = 3) {
  try {
    // Extract specific attributes from query
    const attributes = extractAttributes(query);
    logger.info(`Extracted attributes: ${JSON.stringify(attributes)}`);
    // Define attributeResults outside the if blocks
    let attributeResults = [];

    // If we found specific attributes, use exact attribute matching first
    if (Object.keys(attributes).length > 0) {
      // Build attribute query
      const whereClause = buildAttributeWhereClause(attributes, query);
      logger.info(`Built where clause: ${JSON.stringify(whereClause)}`);

      // Try attribute-based search
      attributeResults = await prisma.shoe.findMany({
        where: whereClause,
        take: limit,
        orderBy: { stock: 'desc' }, // Prioritize in-stock items
      });

      // Log the actual results for debugging
      logger.info(
        `Attribute search results: ${JSON.stringify(
          attributeResults.map((r) => ({
            id: r.id,
            name: r.name,
            color: r.color,
            size: r.size,
          }))
        )}`
      );

      // If we get results with attribute filtering, return them
      if (attributeResults.length > 0) {
        logger.info(`Found ${attributeResults.length} results using attribute search`);
        return attributeResults;
      }
    }

    // If attribute search returns nothing for color-specific queries, try more specific matching
    if (attributes.color && attributeResults.length === 0) {
      logger.info(`No exact matches found for color "${attributes.color}", trying specialized color search`);
      
      // Create a more specific color search based on the requested color
      let colorConditions = [];
      
      // For red specifically
      if (attributes.color === 'red') {
        colorConditions = [
          { color: { equals: 'Red', mode: 'insensitive' } },
          { color: { equals: 'Red/White', mode: 'insensitive' } },
          { color: { startsWith: 'Red/', mode: 'insensitive' } },
          { color: { contains: '/Red', mode: 'insensitive' } },
          { color: { contains: 'Red', mode: 'insensitive' } }
        ];
      } else {
        // Generic approach for other colors
        const capitalizedColor = attributes.color.charAt(0).toUpperCase() + attributes.color.slice(1);
        colorConditions = [
          { color: { equals: capitalizedColor, mode: 'insensitive' } },
          { color: { startsWith: `${capitalizedColor}/`, mode: 'insensitive' } },
          { color: { contains: `/${capitalizedColor}`, mode: 'insensitive' } },
          { color: { contains: capitalizedColor, mode: 'insensitive' } }
        ];
      }
      
      const colorResults = await prisma.shoe.findMany({
        where: {
          OR: colorConditions,
          stock: { gt: 0 }
        },
        take: limit,
        orderBy: { stock: 'desc' }
      });
      
      if (colorResults.length > 0) {
        logger.info(`Found ${colorResults.length} results using specialized color search`);
        return colorResults;
      }
    }

    // Try looser match for color as fallback
    if (attributes.color && attributeResults.length === 0) {
      logger.info(`No exact matches found, trying looser attribute search`);

      const looseColorResults = await prisma.shoe.findMany({
        where: {
          color: {
            contains: attributes.color,
            mode: 'insensitive',
          },
          stock: { gt: 0 },
        },
        take: limit,
      });

      if (looseColorResults.length > 0) {
        logger.info(`Found ${looseColorResults.length} results using loose color match`);
        return looseColorResults;
      }
    }

    // Proceed with vector search as a fallback
    const embedding = await generateEmbedding(query);

    // Check if pgvector is available
    let pgvectorAvailable = false;
    try {
      await prisma.$executeRaw`SELECT 'vector'::regtype`;
      pgvectorAvailable = true;
    } catch (err) {
      logger.warn('pgvector not available, falling back to keyword search');
    }

    if (pgvectorAvailable) {
      try {
        const results = await prisma.$queryRaw`
          SELECT s.*, 
            1 - (pe.embedding <=> ${embedding}::vector) as similarity
          FROM "ProductEmbedding" pe
          JOIN "Shoe" s ON pe.id = s.id
          WHERE s.stock > 0
          ORDER BY similarity DESC
          LIMIT ${limit};
        `;

        if (results.length > 0) {
          logger.info(`Found ${results.length} results using vector search`);
          return results;
        }
      } catch (vectorError) {
        logger.error('Vector search failed, falling back to keyword search:', vectorError);
      }
    }

    // Enhanced keyword search as final fallback
    const enhancedResults = await prisma.shoe.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { color: { contains: query, mode: 'insensitive' } }, // Explicitly search color
        ],
        stock: { gt: 0 },
      },
      take: limit,
    });

    logger.info(`Found ${enhancedResults.length} results using enhanced keyword search`);
    return enhancedResults;
  } catch (error) {
    logger.error('Error in product search:', error);
    return [];
  }
}














// function extractAttributes(query) {
//   const attributes = {};
//   const lowercaseQuery = query.toLowerCase();

//   // Enhanced color extraction with combination handling
//   const colorTerms = {
//     red: ['red'],
//     blue: ['blue', 'navy'],
//     black: ['black'],
//     white: ['white'],
//     gray: ['gray', 'grey', 'wolf gray'],
//     green: ['green'],
//     brown: ['brown', 'tan', 'earth'],
//     orange: ['orange'],
//     silver: ['silver'],
//     yellow: ['yellow'],
//   };

//   // Check for each color group
//   for (const [colorKey, variants] of Object.entries(colorTerms)) {
//     for (const variant of variants) {
//       if (lowercaseQuery.includes(variant)) {
//         attributes.color = colorKey;
//         break;
//       }
//     }
//     if (attributes.color) break; // Stop once we find a color
//   }

//   // Size extraction (look for numbers followed by optional .5)
//   const sizeRegex = /\b(\d+(?:\.\d+)?)\b/g;
//   const sizeMatches = [...lowercaseQuery.matchAll(sizeRegex)];

//   if (sizeMatches.length > 0) {
//     // Assume the first number found is a shoe size
//     attributes.size = parseFloat(sizeMatches[0][1]);
//   }

//   // Brand extraction
//   const commonBrands = ['nike', 'adidas', 'puma', 'reebok', 'vans', 'converse', 'new balance', 'asics', 'dr. martens', 'cole haan'];

//   for (const brand of commonBrands) {
//     if (lowercaseQuery.includes(brand)) {
//       attributes.brand = brand;
//       break;
//     }
//   }

//   return attributes;
// }

// Helper function to build where clause based on extracted attributes



// Helper function to extract attributes from query
function extractAttributes(query) {
  const attributes = {};
  const lowercaseQuery = query.toLowerCase();

  // Enhanced color extraction with combination handling
  const colorTerms = {
    red: ['red'],
    blue: ['blue', 'navy'],
    black: ['black'],
    white: ['white'],
    gray: ['gray', 'grey', 'wolf gray'],
    green: ['green'],
    brown: ['brown', 'tan', 'earth'],
    orange: ['orange'],
    silver: ['silver'],
    yellow: ['yellow'],
  };

  // Check for each color group
  for (const [colorKey, variants] of Object.entries(colorTerms)) {
    for (const variant of variants) {
      // Make sure we match whole words, not substrings
      if (lowercaseQuery.includes(' ' + variant + ' ') || 
          lowercaseQuery.includes(' ' + variant) || 
          lowercaseQuery.includes(variant + ' ') || 
          lowercaseQuery === variant) {
        attributes.color = colorKey;
        break;
      }
    }
    if (attributes.color) break; // Stop once we find a color
  }

  // Size extraction (look for numbers followed by optional .5)
  const sizeRegex = /\b(\d+(?:\.\d+)?)\b/g;
  const sizeMatches = [...lowercaseQuery.matchAll(sizeRegex)];

  if (sizeMatches.length > 0) {
    // Assume the first number found is a shoe size
    attributes.size = parseFloat(sizeMatches[0][1]);
  }

  // Brand extraction
  const commonBrands = ['nike', 'adidas', 'puma', 'reebok', 'vans', 'converse', 'new balance', 'asics', 'dr. martens', 'cole haan'];

  for (const brand of commonBrands) {
    if (lowercaseQuery.includes(brand)) {
      attributes.brand = brand;
      break;
    }
  }

  return attributes;
}











function buildAttributeWhereClause(attributes, originalQuery) {
  const whereClause = {
    AND: [
      { stock: { gt: 0 } }, // Only in-stock items
    ],
  };

  // Add exact attribute matches with improved color handling
  if (attributes.color) {
    whereClause.AND.push({
      OR: [
        // Match exact color (e.g., "Red")
        { color: { equals: attributes.color, mode: 'insensitive' } },

        // Match color at start of string (e.g., "Red/White")
        { color: { startsWith: attributes.color, mode: 'insensitive' } },

        // Match color in middle or end (e.g., "Blue/Red" or "White/Blue/Red")
        { color: { contains: `/${attributes.color}`, mode: 'insensitive' } },

        // Match as part of the color string any way it appears
        { color: { contains: attributes.color, mode: 'insensitive' } },
      ],
    });
  }

  if (attributes.size) {
    whereClause.AND.push({
      size: attributes.size,
    });
  }

  if (attributes.brand) {
    whereClause.AND.push({
      brand: { contains: attributes.brand, mode: 'insensitive' },
    });
  }

  // Add general term search if we have attributes (to further refine)
  if (Object.keys(attributes).length > 0) {
    // Remove any extracted attributes from the query for general search
    let cleanQuery = originalQuery.toLowerCase();
    Object.values(attributes).forEach((attr) => {
      cleanQuery = cleanQuery.replace(String(attr).toLowerCase(), '');
    });

    // Trim and check if there's anything meaningful left
    cleanQuery = cleanQuery.trim();
    if (cleanQuery.length > 2) {
      // If there's still meaningful text
      whereClause.AND.push({
        OR: [{ name: { contains: cleanQuery, mode: 'insensitive' } }, { description: { contains: cleanQuery, mode: 'insensitive' } }],
      });
    }
  }

  return whereClause;
}

/**
 * Index all products
 * @returns {Promise<boolean>} - Success indicator
 */
async function indexAllProducts() {
  try {
    logger.info('Starting product indexing...');

    // Check if pgvector is available
    let pgvectorAvailable = false;
    try {
      await prisma.$executeRaw`SELECT 'vector'::regtype`;
      pgvectorAvailable = true;
      logger.info('pgvector extension is available');
    } catch (err) {
      logger.warn('pgvector extension is not available, will store embeddings but not use vector search');
    }

    // Get all products
    const shoes = await prisma.shoe.findMany({
      select: {
        id: true,
        name: true,
        brand: true,
        description: true,
        color: true,
        size: true,
      },
    });

    logger.info(`Found ${shoes.length} products to index`);

    // Process in batches to avoid memory issues
    const batchSize = 20;
    for (let i = 0; i < shoes.length; i += batchSize) {
      const batch = shoes.slice(i, i + batchSize);

      // Create text representations
      const texts = batch.map((p) => `${p.name} ${p.brand} ${p.description || ''} ${p.color} size ${p.size}`);

      // Generate embeddings
      const encoder = await initializeModel();
      const embeddings = await encoder.embed(texts);
      const embeddingArrays = await embeddings.array();

      // Store in database
      for (let j = 0; j < batch.length; j++) {
        try {
          await prisma.productEmbedding.upsert({
            where: { id: batch[j].id },
            update: {
              embedding: embeddingArrays[j],
              updatedAt: new Date(),
            },
            create: {
              id: batch[j].id,
              embedding: embeddingArrays[j],
              updatedAt: new Date(),
            },
          });
        } catch (error) {
          logger.error(`Failed to index product ${batch[j].id}:`, error);
          // Continue with next product instead of failing the entire batch
        }
      }

      logger.info(`Indexed products ${i + 1} to ${Math.min(i + batchSize, shoes.length)}`);
    }

    logger.info('Product indexing complete');
    return true;
  } catch (error) {
    logger.error('Error indexing products:', error);
    return false;
  }
}

module.exports = {
  initializeModel,
  generateEmbedding,
  findRelevantProducts,
  indexAllProducts,
};
