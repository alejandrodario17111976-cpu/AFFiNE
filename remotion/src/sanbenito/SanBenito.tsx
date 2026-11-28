import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { anim, cargarFuentes, SUAVE } from "./base";
import { Barrido, MarcoOro } from "./piezas";
import { Apertura, Buscar, Catalogo, Carrusel, Cierre, Envio, Negocio, Ofertas, Ticket, Ubicacion } from "./escenas/Escenas";
import L from "./linea.json";

cargarFuentes();

const ESCENAS: { id: keyof typeof L.escenas; C: React.FC }[] = [
  { id: "apertura", C: Apertura },
  { id: "carrusel", C: Carrusel },
  { id: "catalogo", C: Catalogo },
  { id: "buscar", C: Buscar },
  { id: "ticket", C: Ticket },
  { id: "envio", C: Envio },
  { id: "ofertas", C: Ofertas },
  { id: "negocio", C: Negocio },
  { id: "ubicacion", C: Ubicacion },
  { id: "cierre", C: Cierre },
];

export type PropsSanBenito = { conAudio: boolean };

/**
 * Video de presentación de San Benito. La misma composición sirve para el horizontal
 * (1920×1080) y el vertical (1080×1920): cada escena acomoda su diseño según la orientación.
 * Las escenas cambian en los tiempos fuertes de la música (un compás = 80 cuadros).
 */
export const SanBenito: React.FC<PropsSanBenito> = ({ conAudio }) => {
  const f = useCurrentFrame();
  const negro = anim(f, 0, 10, 1, 0, SUAVE) + anim(f, L.duracion - 18, 18, 0, 1, SUAVE);
  return (
    <AbsoluteFill style={{ background: "#040b17" }}>
      {ESCENAS.map(({ id, C }, i) => {
        const e = L.escenas[id];
        const desde = i === 0 ? 0 : e.desde - L.solape;
        const dur = e.dur + (i === 0 ? 0 : L.solape);
        return (
          <Sequence key={id} from={desde} durationInFrames={dur} name={id}>
            <C />
          </Sequence>
        );
      })}
      {ESCENAS.slice(1).map(({ id }) => (
        <Sequence key={`barrido-${id}`} from={L.escenas[id].desde - 10} durationInFrames={28} name={`barrido ${id}`}>
          <Barrido />
        </Sequence>
      ))}
      <MarcoOro />
      <AbsoluteFill style={{ background: "#040b17", opacity: Math.min(1, negro), pointerEvents: "none" }} />
      {conAudio && <Audio src={staticFile("sanbenito/audio/mezcla.wav")} />}
    </AbsoluteFill>
  );
};
