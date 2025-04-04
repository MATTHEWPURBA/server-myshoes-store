const { indexAllProducts } = require('../services/vectorService');
const logger = require('../utils/logger');

// Run the indexing process
(async () => {
  try {
    logger.info('Starting product indexing script...');
    await indexAllProducts();
    logger.info('Product indexing completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error running product indexing:', error);
    process.exit(1);
  }
})();