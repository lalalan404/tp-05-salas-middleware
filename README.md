# Trabajo práctico 05 — Pipeline de middleware en Express

## Descripción

App web desarrollada en Node.js con Express y EJS para la consulta de salas de estudio y la gestión de reservas temporales de turnos. El proyecto se concentra en la implementación, orden, alcance y comportamiento de un pipeline de middleware avanzado, router de área, validación de datos en servidor y registro de solicitudes.

## Instalación

Clonar el repositorio y para instalar las dependencias necesarias:

npm install

## Ejecucion

npm start

## Rutas

- GET / — Página de inicio
- GET /estado — Devuelve un objeto JSON con el estado del servicio, cantidad de reservas y el identificador de solicitud.
- GET /reservas — Muestra el listado de salas reservadas
- GET /reservas/nueva — Muestra el formulario de alta de reservas
- GET /reservas/:id — Muestra el detalle de una reserva específica o un error 404 si no existe.
- POST /reservas — Procesa el formulario, valida los datos y registra la reserva.

## Pipeline de Middleware ,alcances

- Morgan (morgan("dev")): Middleware de terceros que registra en consola las solicitudes HTTP con formato conciso (método, URL, estado y tiempo).
- identificarSolicitud: Middleware global personalizado que incrementa un contador y asigna un identificador único (ej. SOL-0001) a res.locals.solicitudId para rastrear cada petición.
- medirDuracion: Middleware global personalizado que toma el tiempo inicial y escucha el evento finish de la respuesta para calcular en milisegundos.
- expressLayouts: Middleware de terceros que envuelve las vistas en una plantilla HTML común (layouts/main).
- express.static: Middleware incorporado que sirve los recursos estáticos (CSS, imágenes) desde la carpeta public.
- express.urlencoded / express.json: Middlewares incorporados (parsers) que procesan los datos enviados por formularios POST y JSON, dejándolos disponibles en req.body.
- prepararAreaReserva: Middleware de router que define res.locals.seccion = "reservas turno" exclusivamente para el área de reservas.
- validarReserva: Middleware de ruta que normaliza los campos con .trim(), verifica datos obligatorios, formato de email con @, salas y turnos permitidos, y cantidad de personas (entero de 1 a 6). Si falla, responde 400 sin llamar a next(); si es correcto, pasa el control a crearReserva.
- crearReserva: Handler final que calcula el siguiente ID incremental, almacena la nueva reserva en el arreglo en memoria y redirige con un código 302 hacia /reservas.

## Conceptos Clave

- Diferencia entre middlewares: Los incorporados vienen nativos en Express (como express.static), los de terceros se instalan como dependencias externas (como morgan), y los personalizados son funciones escritas a medida para la lógica del requerimeinto.
- Función next(): Transfiere el control al siguiente middleware de la pila. Si se omite y no se envía una respuesta explícita, la petición se bloquea y queda "colgada".
- Parsers antes de validar: Es obligatorio colocar los parsers (express.urlencoded) antes de las rutas o validaciones que lean req.body, de lo contrario este llegará como undefined.
- Alcances (Scopes): El alcance global (como identificarSolicitud) afecta a toda la aplicación; el de router (como prepararAreaReserva) afecta a un grupo específico bajo un prefijo; y el de ruta (como validarReserva) se aplica únicamente a un endpoint puntual.
- Evento finish: Se emite en el objeto de respuesta (res) cuando esta ha sido enviada por completo al cliente, garantizando una medición temporal precisa.
- Montaje del router: Permite modularizar las rutas bajo un prefijo común (/reservas) manteniendo las rutas internas relativas.
- POST 302 frente al GET posterior: Tras procesar con éxito un formulario mediante POST, el servidor emite una redirección 302 Found para forzar un GET y evitar reenvíos duplicados si el usuario presiona F5.
- Memoria temporal: Los datos viven únicamente en la RAM del servidor; al reiniciar la aplicación, se restablecen a las reservas iniciales.

## Diagramas de Flujo

**Diagrama 1: POST /reservas Válido**
POST /reservas

- morgan("dev")
- identificarSolicitud
- medirDuracion
- expressLayouts
- express.urlencoded
- reservasRouter
- prepararAreaReserva
- validarReserva (Éxito: genera req.reservaValidada, llama a next())
- crearReserva (Guarda en memoria)
- 302 Redirect a /reservas
- finish (Imprime ID, método, URL, estado 302 y duración en ms)

**Diagrama 2: POST /reservas Inválido**

- igual que el flujo valido....
- prepararAreaReserva
- validarReserva (Fallo: detecta datos incorrectos)
- Responde HTTP 400 y renderiza "reservas/nueva" con error
- FIN del ciclo (Termina en validarReserva, no llama a next(), no crea registro, se registra el evento finish con estado 400).

## Persistencia temporal

Los datos residen exclusivamente en un arreglo de JavaScript en memoria. No se utilizan bases de datos ni archivos externos, por lo que cualquier alta se pierde al reiniciar el servidor.
