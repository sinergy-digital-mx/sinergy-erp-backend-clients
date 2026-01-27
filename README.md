# Para ejecturar migracion de TypeORM
# Recuerda cambiarle el nombre donde dice update-leads
npx typeorm-ts-node-commonjs migration:generate src/database/migrations/your_change_name -d src/database/data-source.ts

npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts


npx typeorm-ts-node-commonjs migration:generate src/database/migrations/user_changes -d src/database/data-source.ts


# Never underestimate the determination of a geek. The world's first web-cam was invented to monitor when a coffee pot located in another room needed refilling.

