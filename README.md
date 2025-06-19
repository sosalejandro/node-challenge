# Instrucciones de consumo

### Requerimientos
1. Conexión a internet
2. Docker
3. Node.js localmente


1. Crear un archivo de `.env` y elegir algunas de las variables en base al setup que se realice.

#### Docker App
```
# Environment variables for Docker containers
DATABASE_URL=postgresql://postgres:postgres@db:5432/node_challenge
REDIS_URL=redis://redis:6379
```
#### Local App
```
# Local development environment variables
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/node_challenge
REDIS_URL=redis://localhost:6379
```


2. Levantar los servicios con docke

```sh
docker compose up -d
```

3. Correr la aplicación en desarrollo
```sh
npm run dev
```

## Inicialización de la base de datos con Prisma

Para generar el esquema de la base de datos y aplicar las migraciones iniciales al instalar el sistema por primera vez, sigue estos pasos:

1. **Instala las dependencias:**
   ```sh
   npm install
   ```

2. **Configura la conexión a la base de datos:**
   - Edita el archivo `.env` y asegúrate de que la variable `DATABASE_URL` apunte a tu instancia de PostgreSQL.

3. **Genera y aplica las migraciones:**
   ```sh
   npx prisma migrate deploy
   ```
   o, para desarrollo:
   ```sh
   npx prisma migrate dev --name init
   ```

4. **(Opcional) Genera el cliente Prisma:**
   ```sh
   npx prisma generate
   ```

Esto creará todas las tablas y relaciones definidas en el archivo `prisma/schema.prisma` en tu base de datos.