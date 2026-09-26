-- Add indexes for user diary and restaurant history queries.
CREATE INDEX `Visit_userId_visitedAt_idx` ON `Visit`(`userId`, `visitedAt`);
CREATE INDEX `Visit_restaurantId_visitedAt_idx` ON `Visit`(`restaurantId`, `visitedAt`);