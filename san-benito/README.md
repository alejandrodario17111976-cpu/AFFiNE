# San Benito — Tu mejor elección

Sitio web de San Benito (Las Catitas y La Dormida): unos 180 productos reales en 3D, mostrador giratorio, góndola con 15 pasillos, buscador y vista en tarjetas o en lista, ofertas, afiches de promociones y un ticket de papel térmico que arma el pedido para enviarlo al negocio.

- Colores: azul lapislázuli (con textura de piedra y pirita), oro metálico y carmesí, sobre marfil.
- Tipografías: Cormorant Garamond (títulos), Jost (texto) y Courier Prime (ticket).
- Animaciones con Animate UI (Motion), GSAP ScrollTrigger y React Three Fiber.
- Sonidos hechos con earshot (sin licencias): agregar y quitar productos, abrir y cerrar el ticket, enviar el pedido, cambiar de pasillo y ver más productos. Se apagan desde el menú.
- Scroll suave con inercia en computadoras (Lenis) y escena 3D sincronizada con el scroll. Con cientos de productos, cada tarjeta muestra la foto y arma su 3D recién cuando aparece en pantalla.
- Cada producto es un sólido armado a partir de su foto, con el método de un programa CAD (como SolidCraft): la silueta de la foto es el croquis; las botellas, latas y frascos salen por revolución de ese perfil, y las bolsas, cajas y fotos planas por extrusión con espesor y aristas redondeadas. La foto original se proyecta de frente sin cambios (`src/components/escena/solido.ts`).

## Cómo verlo en tu computadora

Necesitás [Node.js](https://nodejs.org) 20 o más nuevo.

```bash
cd san-benito
npm install
npm run dev
```

Abrí http://localhost:3000. Para editar, tocá las tres rayitas → **AGL**. En tu computadora, si no configuraste una contraseña, es `sanbenito`.

## Cómo compra un cliente

1. Entra al sitio (no necesita cuenta ni registrarse en ninguna página).
2. Agrega productos: cada uno vuela hasta el ticket.
3. Abre el ticket y toca **Continuar con mis datos**: nombre, apellido, DNI y celular. Se guardan en su teléfono para la próxima vez (menú → **Mis datos** para cambiarlos).
4. Toca **Enviar pedido al negocio**. El pedido llega a AGL con un número (por ejemplo `261126-007`) y el cliente ve abajo de la pantalla "Estamos preparando tu pedido".
5. Cuando el empleado toca **¡Pedido Listo!**, al cliente le suena una campanita y el aviso cambia a "¡Tu pedido está listo para retirar!". Además le llega el mensaje de WhatsApp que manda el empleado.

También puede **Copiar ticket** o mandarlo por **WhatsApp** al negocio (si cargaste el número en Datos del negocio).

## AGL: pedidos

Pestaña **Pedidos** (es la primera al entrar):

- Los pedidos llegan solos (se revisa cada 10 segundos) y suena una campanita con cada pedido nuevo. La pestaña del navegador muestra cuántos hay pendientes.
- Cada pedido muestra número, hora, cliente (nombre, DNI y celular), productos y total.
- **¡Pedido Listo!** marca el pedido como listo y abre WhatsApp con el mensaje para el cliente ya escrito: solo hay que tocar Enviar.
- En **Listos**: **Avisar de nuevo** o **Entregado** cuando lo retira.

Pestaña **Clientes**: todos los que mandaron al menos un pedido, con buscador.

Los pedidos y clientes se guardan en `data/pedidos.json` y `data/clientes.json`. Tienen datos personales: no se suben al repositorio (están en `.gitignore`) y solo se ven desde AGL con la contraseña.

## AGL: el panel para editar todo

Menú de las tres rayitas → **AGL** → contraseña. Al terminar, tocá **Guardar cambios**: el sitio se actualiza al instante.

### Cambiar un precio

1. Pestaña **Productos y precios**.
2. Escribí el precio nuevo en el casillero dorado **Precio**.
3. **Guardar cambios**.

Atajos:

- **Subir o bajar muchos precios a la vez:** elegí un pasillo (o Todos), escribí el porcentaje (`10` sube 10 %, `-5` baja 5 %) y tocá **Aplicar**. Redondea a la decena.
- **Precio por cantidad** (como "2 por $2.690" o "3 kg por $9.990"): **Agregar precio por cantidad**, poné cuántas unidades y el precio total. El ticket aplica la mejor combinación sola.
- **Oferta con precio tachado:** escribí el precio de antes en **Precio antes (oferta)**.
- **Mostrar en Ofertas:** tildalo para que el producto aparezca en esa sección.

### Agregar un producto

1. **Agregar producto** (aparece arriba de la lista).
2. Completá nombre, presentación (ej. `500 g`), pasillo, precio y, si querés, una descripción.
3. **Subir foto**: desde el celular podés sacarla en el momento o elegirla de la galería. Para que se vea en 3D como las demás, usá una foto con el fondo transparente (PNG); con fondo se ve como foto rectangular.
4. **Envase 3D**: elegí la forma (lata o frasco = cilindro que gira; bolsa = paquete abultado; foto recortada = plana).
5. **Guardar cambios**.

### Ocultar un producto o marcar la foto

- **Mostrar en el sitio:** destildalo para que el producto quede guardado en AGL pero no aparezca en la página ni se pueda pedir. Así están los cigarrillos de la lista de cotillón: la Ley 26.687 prohíbe la publicidad de productos de tabaco por cualquier medio, así que decidí no mostrarlos. Si los querés publicar, consultalo antes.
- **Foto ilustrativa:** la foto es de una variante o marca parecida a la que se vende; la tarjeta muestra "Imagen ilustrativa". Cuando subas tu propia foto, destildalo.

### Borrar un producto

**Eliminar** en el producto y tocá de nuevo para confirmar. Después, **Guardar cambios**. La foto que ya no se usa se borra del servidor sola.

### Afiches de promociones

Pestaña **Afiches**: **Subir afiche**, ordenalos con **Antes/Después**, ponerles título o **Quitar**. Se ven en la sección "Promociones de la semana" y se agrandan con un toque.

### Lo demás

- **Pasillos:** nombre y color de cada uno.
- **Textos y secciones:** todos los títulos, textos y botones, los pasos de "Cómo comprar" y qué secciones se muestran.
- **Colores y fuentes:** los colores de la marca y las tipografías, con muestra en vivo.
- **Datos del negocio:** sucursales (con enlace al mapa), teléfono, WhatsApp, horarios, Instagram, Facebook y TikTok. Lo que quede vacío no aparece en el sitio.

Todo se guarda en `data/tienda.json`; las fotos en `data/imagenes/` y los afiches en `data/afiches/`.

Las fotos de los productos de las listas de precios se buscaron en los catálogos de Carrefour, Jumbo, Día y ChangoMás y se recortaron sin fondo. Los productos sin foto (sueltos, fiambres por kilo, helados, panadería) se dibujan en 3D con una etiqueta con su nombre; podés subir la foto propia cuando quieras.

## La tienda publicada en claude.ai (con AGL)

La tienda también se publica como página de claude.ai, con un enlace para compartir. Ahí AGL funciona sin servidor:

- Menú de las tres rayitas → **AGL** → el PIN de AGL.
- Se cambian precios, ofertas, productos, fotos, afiches y textos igual que en el sitio con servidor.
- **Guardar cambios** publica de nuevo la página con los datos nuevos adentro, y se actualiza para todos los que la tienen abierta.
- **Subir foto** guarda la foto dentro de la propia página.
- Solo la cuenta de claude.ai dueña de la página (o quien tenga permiso de edición) puede guardar o subir fotos. Para cualquier otra persona, la página es de solo lectura aunque sepa el PIN.
- Los pedidos y clientes no están en esta versión: necesitan el sitio con servidor.

Para armarla:

```bash
CLAVE_AGL=<el PIN de AGL> npm run vista-previa
```

- En el código queda solo la huella del PIN (PBKDF2), nunca el PIN, y se guarda en `vista-previa/.clave-agl`, fuera del repositorio, para los armados siguientes.
- **Antes de volver a publicarla desde acá**, bajá los datos que se editaron desde AGL: están en la página publicada, dentro de `<script id="datos-tienda">`. Guardalos en un archivo y armá con `DATOS_TIENDA=ese-archivo.json`; si no, se pisan los cambios hechos desde la página.

## Publicar el sitio (con enlace para compartir)

Para que cualquiera entre con un enlace y los pedidos lleguen a AGL, el sitio tiene que correr en un servidor con disco. La forma más simple es Railway (u otro hosting con Docker):

1. Crear una cuenta en [railway.com](https://railway.com) e iniciar sesión con GitHub.
2. **New Project → Deploy from GitHub repo** → elegir este repositorio. En **Settings → Root Directory** poner `san-benito` (usa el `Dockerfile` que ya está).
3. **Variables**: agregar `ADMIN_PASSWORD` con la contraseña de AGL. Conviene que sea larga y distinta del PIN de la página de claude.ai: este panel muestra los DNI y celulares de los clientes. Después de 6 intentos fallidos, esa conexión espera 15 minutos.
4. **Volume**: agregar un volumen montado en `/datos` (ahí quedan precios, pedidos, clientes y fotos; sobrevive a cada actualización).
5. **Settings → Networking → Generate Domain**: ese es el enlace para compartir (por ejemplo `san-benito.up.railway.app`). También se puede conectar un dominio propio.

La primera vez, los datos que vienen en `data/` se copian solos al volumen.

### Sin Docker

```bash
npm run build
ADMIN_PASSWORD=tu-contraseña npm start
```

- En el sitio publicado, AGL pide la contraseña de `ADMIN_PASSWORD`. Sin esa variable no se puede editar (no hay contraseña por defecto).
- AGL guarda en archivos del servidor (`data/`), así que el sitio tiene que correr en un servidor con disco propio (un VPS o un servicio que permita escribir archivos, como Railway o Render con disco).
- En hostings de solo lectura (como Vercel), editá en tu computadora, tocá **Descargar copia**, reemplazá `data/tienda.json` y volvé a publicar.
