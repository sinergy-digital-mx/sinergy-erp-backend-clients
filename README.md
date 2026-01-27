# Para ejecturar migracion de TypeORM
# Recuerda cambiarle el nombre donde dice update-leads
npx typeorm-ts-node-commonjs migration:generate src/database/migrations/update-leads -d src/database/data-source.ts

npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
