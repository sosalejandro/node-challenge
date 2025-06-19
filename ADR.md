# ADR: Decisiones de Diseño y Arquitectura

## Estado
Aceptado

## Contexto
Durante el desarrollo del proyecto, se tomaron varias decisiones de diseño y selección de tecnologías para priorizar la consistencia, simplicidad y mantenibilidad del sistema.

## Decisiones

1. **Base de datos**
   - Se eligió **PostgreSQL** como base de datos relacional por su excelente integración con Prisma y porque la consistencia de los datos es prioritaria en el diseño del sistema.
   - **Redis** se utiliza para cache y colas, aunque el uso de colas quedó excluido en esta entrega (ver punto 2).

2. **Colas y procesamiento asíncrono**
   - Se decidió **no implementar Bull** (librería de colas basada en Redis) en esta versión, debido a limitaciones de tiempo y a los cambios adicionales requeridos en la base de datos para manejar el estado de las transacciones y la generación anticipada de IDs. Esto complica la consulta del estado de una transacción y requiere más tiempo del disponible para el entregable.

3. **JWT**
   - Se seleccionó la librería **jsonwebtoken** por su simplicidad y facilidad de integración para el manejo de autenticación basada en JWT.

4. **Validación**
   - Se utilizó **Joi** como validador de datos, principalmente por familiaridad y porque es la librería recomendada y utilizada por frameworks como Nest.js.

5. **Logging**
   - Se eligió **Pino** como sistema de logging por su simplicidad y rapidez de configuración.

6. **Inyección de dependencias**
   - Inicialmente se consideró **Inversify** como librería de DI, pero se descartó por la simplicidad y tamaño del proyecto. Se optó por instanciación manual de clases y uso de singletons.

7. **Arquitectura**
   - Se implementó una **arquitectura de cebolla** (onion architecture) con capas bien definidas: application, services, infrastructure y domain.
   - Las entidades generadas por Prisma se utilizan directamente, y la capa de dominio se reserva para interfaces de servicios y repositorios, así como para servicios de dominio.
   - Se implementó un **transaction service** en la capa de servicios como orquestador de las órdenes.

8. **Documentación y pruebas**
   - Se creó una **colección de Postman** como referencia para la API y su consumo.

## Consecuencias

- El sistema es consistente, modular y fácil de mantener.
- La ausencia de colas limita el procesamiento asíncrono, pero simplifica la entrega y reduce la complejidad.
- La arquitectura y las tecnologías elegidas permiten escalar y refactorizar el sistema en el futuro si es necesario.