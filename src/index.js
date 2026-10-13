const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const path = require("node:path");

const app = express();
const PORT = 3000;

const inscripciones = [
  {
    id: 1,
    estudiante: "Carlos Gómez",
    email: "carlos.gomez@email.com",
    sala: "Sala Norte",
    fecha: "2026-10-15",
    turno: "Mañana",
    personas: 4,
  },
  {
    id: 2,
    estudiante: "Ana Martínez",
    email: "ana.martinez@email.com",
    sala: "Sala Sur",
    fecha: "2026-10-16",
    turno: "Tarde",
    personas: 2,
  },
  {
    id: 3,
    estudiante: "Luis Torres",
    email: "luis.torres@email.com",
    sala: "Sala Multimedia",
    fecha: "2026-10-17",
    turno: "Noche",
    personas: 5,
  },
  {
    id: 4,
    estudiante: "Sofía Ruiz",
    email: "sofia.ruiz@email.com",
    sala: "Sala Norte",
    fecha: "2026-10-18",
    turno: "Mañana",
    personas: 3,
  },
];

let numeroDeSolicitud = 0;

function identificarSolicitud(req, res, next) {
  numeroDeSolicitud += 1;
  res.locals.solicitudId = `SOL-${String(numeroDeSolicitud).padStart(4, "0")}`;
  next();
}
function medirDuracion(req, res, next) {
  const inicio = process.hrtime.bigint();
  res.on("finish", () => {
    const fin = process.hrtime.bigint();
    const milisegundos = Number(fin - inicio) / 1_000_000;
    console.log(
      `[${res.locals.solicitudId}] ${req.method} ${req.originalUrl} ` +
        `${res.statusCode} ${milisegundos.toFixed(2)} ms`,
    );
  });
  next();
}
//--
function prepararAreaReserva(req, res, next) {
  res.locals.seccion = "reservas turno";
  console.log("seccion::" + res.locals.seccion);
  next();
}
function validarReserva(req, res, next) {
  const estudiante = String(req.body.estudiante ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const sala = String(req.body.sala ?? "").trim();
  const fecha = String(req.body.fecha ?? "").trim();
  const turno = String(req.body.turno ?? "").trim();
  const personas = Number(req.body.personas);

  const salasValidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
  const turnosValidos = ["Mañana", "Tarde", "Noche"];

  if (
    !estudiante ||
    !email ||
    !email.includes("@") ||
    !salasValidas.includes(sala) ||
    !fecha ||
    !turnosValidos.includes(turno) ||
    !Number.isInteger(personas) ||
    personas < 1 ||
    personas > 6
  ) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      error:
        "Completá todos los campos con valores válidos (personas de 1 a 6).",
      valores: req.body,
    });
  }

  req.reservaValidada = { estudiante, email, sala, fecha, turno, personas };
  next();
}
async function main() {
  function crearReserva(req, res) {
    const ultimoId = inscripciones.reduce(
      (mayorId, reserva) => Math.max(mayorId, reserva.id),
      0,
    );
    inscripciones.push({ id: ultimoId + 1, ...req.reservaValidada });
    res.redirect("/reservas");
  }

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("layout", "layouts/main");
  app.use(morgan("dev"));

  app.use(expressLayouts);
  app.use(identificarSolicitud);
  app.use(medirDuracion);
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  //-----
  app.get("/", (req, res) => {
    res.render("inicio", { titulo: "Reserva tu Turno" });
  });
  app.get("/estado", (req, res) => {
    res.json({
      servicio: "activo",
      totalInscripciones: inscripciones.length,
      solicitudId: res.locals.solicitudId,
      inscripciones,
    });
  });
  //---
  const reservasRouter = express.Router();
  reservasRouter.use(prepararAreaReserva);

  reservasRouter.get("/", (req, res) => {
    res.render("reservas/lista", {
      titulo: "Salas Reservadas",
      inscripciones,
    });
  });
  reservasRouter.get("/nueva", (req, res) => {
    res.render("reservas/nueva", {
      titulo: "Nueva Reserva",
      error: null,
      valores: {},
    });
  });
  reservasRouter.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const inscripcion = inscripciones.find((elemento) => elemento.id === id);
    if (!inscripcion) {
      return res.status(404).render("no-encontrado", {
        titulo: "reserva no encontrada",
        mensaje: "No existe un reserva con ese identificador.",
      });
    }
    res.render("reservas/detalle", {
      titulo: inscripcion.sala,
      inscripcion,
    });
  });
  reservasRouter.post("/", validarReserva, crearReserva);
  //--aqui le digo q cuadnoe ntrene a este ruta use el routeador
  app.use("/reservas", reservasRouter);
  app.use((req, res) => {
    res.status(404).render("no-encontrado", {
      titulo: "Página no encontrada",
      mensaje: "La dirección solicitada no existe.",
    });
  });
  //----escuchnado
  app.listen(PORT, () => {
    console.log(`Aplicación disponible en http://localhost:${PORT}`);
  });
}
main().catch((error) => {
  console.error("No se pudo iniciar la aplicación:", error);
  process.exitCode = 1;
});
